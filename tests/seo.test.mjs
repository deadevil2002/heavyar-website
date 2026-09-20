import test from 'node:test';
import assert from 'node:assert/strict';
import { fallbackPayload } from '../src/fallback.mjs';
import { escapeJson, pageFor, renderHead, resetSeoCache, getSeo, robotsTxt, sitemapXml, validatePublishedPayload } from '../src/seo.mjs';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { handleRequest } from '../src/handler.mjs';
import { LEGACY_SOURCE_SHA256, legacySource, renderLegacy } from '../src/legacy.mjs';

test('metadata is escaped and JSON-LD cannot close its script', () => {
  const payload = fallbackPayload();
  const page = pageFor(payload, 'home', 'en');
  page.title = 'Heavyar " <safe>';
  const head = renderHead(page, payload.global);
  assert.match(head, /Heavyar &quot; &lt;safe&gt;/);
  assert.equal(escapeJson({ text: '</script>&' }), '{"text":"\\u003c/script\\u003e\\u0026"}');
});

test('unsafe and unsupported published schema is rejected', () => {
  const base = fallbackPayload();
  const raw = { ...base, fallback: undefined, pages: base.pages.map(p => ({ ...p })) };
  raw.pages[0].structuredData = [{ '@context': 'https://schema.org', '@type': 'Product', name: 'Fake' }];
  assert.throws(() => validatePublishedPayload(raw), /Unsupported/);
});

test('published fetch is coalesced and unavailable endpoint uses audited fallback', async () => {
  resetSeoCache();
  let calls = 0;
  const fetcher = async () => { calls++; return new Response(JSON.stringify({ success: false, errorCode: 'SEO_NOT_PUBLISHED' }), { status: 404 }); };
  const [a, b] = await Promise.all([getSeo(fetcher, 1), getSeo(fetcher, 1)]);
  assert.equal(calls, 1);
  assert.match(a.source, /^audited-baseline:/);
  assert.equal(b.payload.pages.length, 18);
});

test('canonical, hreflang, robots and sitemap use controlled routes', () => {
  const payload = fallbackPayload();
  const page = pageFor(payload, 'privacy', 'en');
  const head = renderHead(page, payload.global);
  assert.match(head, /canonical" href="https:\/\/heavyar.com\/en\/privacy"/);
  assert.match(head, /hreflang="ar-SA"/);
  assert.match(head, /site\.webmanifest/);
  assert.match(robotsTxt(payload), /Disallow: \/api\//);
  const sitemap = sitemapXml(payload);
  assert.match(sitemap, /https:\/\/heavyar.com\/en\/privacy/);
  assert.doesNotMatch(sitemap, /early-access|account-deletion/);
});

test('account deletion always remains private', () => {
  const payload = fallbackPayload();
  const page = pageFor(payload, 'account-deletion', 'ar-SA');
  assert.equal(page.robots, 'noindex,nofollow');
  assert.equal(page.sitemap.include, false);
});

test('clean and legacy account-deletion routes preserve authenticated flow', async () => {
  resetSeoCache();
  const unavailable = async () => Response.json({ errorCode: 'SEO_NOT_PUBLISHED' }, { status: 404 });
  const options = {
    fetcher: unavailable,
    legacyLoader: file => readFile(new URL(`../${file}`, import.meta.url), 'utf8'),
  };
  for (const path of ['/account-deletion', '/en/account-deletion', '/delete-account.html']) {
    const response = await handleRequest(new Request(`https://heavyar.com${path}`), {}, options);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex,nofollow');
    assert.match(html, /id="sign-in-form"/);
    assert.match(html, /id="delete-form"/);
    assert.match(html, /type="module" src="\/delete-account\.js"/);
    assert.doesNotMatch(html, /name="uid"/);
  }
});

test('legal routes use immutable sources without fetching Pages assets', async () => {
  resetSeoCache();
  let assetCalls = 0;
  const env = { ASSETS: { fetch: async () => { assetCalls++; return new Response(null, { status: 302 }); } } };
  for (const path of ['/privacy', '/terms', '/account-deletion']) {
    const response = await handleRequest(new Request(`https://heavyar.com${path}`), env, {
      fetcher: async () => new Response('{}', { status: 404 }),
    });
    assert.equal(response.status, 200);
  }
  assert.equal(assetCalls, 0);
});

test('clean preserved-document aliases retain content and root-relative navigation', async () => {
  for (const [path, expected] of [
    ['/contact', /تواصل معنا/],
    ['/refund', /سياسة الاسترجاع/],
    ['/safety', /السلامة/],
    ['/providers-terms', /شروط مقدمي الخدمة/],
    ['/faq', /هل Heavyar يملك المعدات المعروضة/],
    ['/faq.html', /هل Heavyar يملك المعدات المعروضة/],
  ]) {
    const response = await handleRequest(new Request(`https://heavyar.com${path}`));
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, expected);
    assert.match(html, /href="\/privacy"/);
    assert.match(html, /src="\/script\.js"/);
  }
});

test('routing blocks source and arbitrary API paths', async () => {
  const options = { fetcher: async () => new Response('{}', { status: 503 }) };
  for (const path of ['/src/seo.mjs', '/tests/seo.test.mjs', '/.git/config', '/api/admin']) {
    const response = await handleRequest(new Request(`https://heavyar.com${path}`), {}, options);
    assert.equal(response.status, 404);
  }
});

test('production never proxies browser Early Access APIs', async () => {
  let calls = 0;
  const response = await handleRequest(new Request('https://heavyar.com/api/early-access/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"email":"safe@example.test"}',
  }), {}, { fetcher: async () => { calls++; return Response.json({ success: true }); } });
  assert.equal(response.status, 404);
  assert.equal(calls, 0);
});

test('dedicated Early Access route contains the real fail-closed form', async () => {
  resetSeoCache();
  const response = await handleRequest(new Request('https://heavyar.com/en/early-access'), {}, {
    fetcher: async () => Response.json({ errorCode: 'SEO_NOT_PUBLISHED' }, { status: 404 }),
  });
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex,follow');
  assert.match(html, /name="heavyar-api-base" content="https:\/\/heavyar-api\.heavyar-official\.workers\.dev"/);
  assert.match(html, /data-ea-form/);
  assert.match(html, /data-early-access-section style="display:none;"/);
});

test('HEAD responses have no body and favicon aliases the icon asset', async () => {
  resetSeoCache();
  const fetcher = async () => Response.json({ errorCode: 'SEO_NOT_PUBLISHED' }, { status: 404 });
  for (const path of ['/', '/robots.txt', '/sitemap.xml', '/missing', '/api/early-access/config']) {
    const response = await handleRequest(new Request(`https://heavyar.com${path}`, { method: 'HEAD' }), {}, { fetcher });
    assert.equal(await response.text(), '');
  }
  let fetchedPath = '';
  const env = { ASSETS: { fetch: async request => {
    fetchedPath = new URL(request.url).pathname;
    return new Response('ico', { headers: { 'Content-Type': 'image/x-icon' } });
  } } };
  const icon = await handleRequest(new Request('https://heavyar.com/favicon.ico'), env, { fetcher });
  assert.equal(icon.status, 200);
  assert.equal(fetchedPath, '/assets/icons/favicon.ico');
});

test('a valid single-locale publication serves missing locale as noindex fallback', () => {
  const raw = fallbackPayload();
  raw.global.supportedLanguages = ['en'];
  raw.pages = raw.pages.filter(page => page.locale === 'en');
  const published = validatePublishedPayload(raw);
  assert.equal(published.pages.length, 9);
  const absentArabic = pageFor(published, 'home', 'ar-SA');
  assert.equal(absentArabic.robots, 'noindex,follow');
  assert.equal(absentArabic.sitemap.include, false);
});

test('outages retain stale published atomically while cold outages block indexing', async () => {
  const valid = fallbackPayload();
  valid.global.supportedLanguages = ['ar-SA', 'en'];
  resetSeoCache();
  let mode = 'valid';
  let conditional = '';
  const fetcher = async (_url, init) => {
    conditional = init.headers['If-None-Match'] || '';
    if (mode === 'valid') return new Response(JSON.stringify(valid), { headers: { ETag: '"published-v1"' } });
    if (mode === '304') return new Response(null, { status: 304 });
    return new Response('{}', { status: 503 });
  };
  const first = await getSeo(fetcher, 1);
  assert.equal(first.source, 'published');
  mode = 'error';
  const stale = await getSeo(fetcher, 60_002);
  assert.equal(stale.source, 'stale-published');
  assert.equal(conditional, '"published-v1"');
  mode = '304';
  const recovered = await getSeo(fetcher, 66_000);
  assert.equal(recovered.source, 'published');
  assert.equal(recovered.payload.pages.length, 18);

  resetSeoCache();
  const cold = await getSeo(async () => new Response('{}', { status: 503 }), 1);
  assert.equal(cold.source, 'unavailable-fallback');
  assert.ok(cold.payload.pages.every(page => page.robots === 'noindex,nofollow' && !page.sitemap.include));
  assert.doesNotMatch(sitemapXml(cold.payload), /<url>/);
  assert.match(robotsTxt(cold.payload), /User-agent: \*\nDisallow: \//);
});

test('SEO request has a bounded abort signal', async () => {
  resetSeoCache();
  const started = Date.now();
  const result = await getSeo((_url, init) => new Promise((resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true });
  }), 1);
  assert.equal(result.source, 'unavailable-fallback');
  assert.ok(Date.now() - started < 4_500);
});

test('named crawler groups repeat private route exclusions', () => {
  const robots = robotsTxt(fallbackPayload());
  for (const agent of ['Googlebot', 'Bingbot', 'OAI-SearchBot']) {
    const group = robots.split(`User-agent: ${agent}\n`)[1].split('\n\n')[0];
    for (const path of ['/api/', '/admin/', '/auth/', '/account-deletion']) assert.match(group, new RegExp(`Disallow: ${path.replaceAll('/', '\\/')}`));
  }
});

test('all public endpoint JSON-LD shapes are accepted when typed and visible', () => {
  const raw = fallbackPayload();
  raw.global.supportedLanguages = ['ar-SA', 'en'];
  const page = raw.pages[0];
  page.faqs = [{ question: 'Visible question', answer: 'Visible answer', order: 0 }];
  page.structuredData = [
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'Heavyar', url: 'https://heavyar.com' },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Heavyar', url: 'https://heavyar.com', inLanguage: 'ar-SA' },
    { '@context': 'https://schema.org', '@type': 'MobileApplication', name: 'Heavyar', applicationCategory: 'BusinessApplication', operatingSystem: 'Android', downloadUrl: 'https://play.google.com/store/apps/details?id=com.example.app' },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'Visible question', acceptedAnswer: { '@type': 'Answer', text: 'Visible answer' } }] },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Heavyar', item: 'https://heavyar.com/' }] },
  ];
  assert.equal(validatePublishedPayload(raw).pages[0].structuredData.length, 5);
});

test('legacy source hashes are pinned and altered source is rejected', async () => {
  for (const [key, file] of [['privacy', 'privacy.html'], ['terms', 'terms.html'], ['account-deletion', 'delete-account.html']]) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.equal(legacySource(key), source);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
    const actual = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    assert.equal(actual, LEGACY_SOURCE_SHA256[key]);
    const rendered = await renderLegacy(key, 'ar-SA', source);
    assert.match(rendered, key === 'privacy' ? /نطاق السياسة/ : key === 'terms' ? /القانون الواجب التطبيق/ : /id="delete-form"/);
    await assert.rejects(() => renderLegacy(key, 'ar-SA', `${source} `), /integrity/);
  }
});

test('CMS heading is rendered on home and content routes while legal H1 remains preserved', async () => {
  const raw = fallbackPayload();
  raw.global.supportedLanguages = ['ar-SA', 'en'];
  raw.pages.find(page => page.key === 'home' && page.locale === 'en').heading = 'Configured home heading';
  raw.pages.find(page => page.key === 'equipment' && page.locale === 'en').heading = 'Configured equipment heading';
  resetSeoCache();
  const options = { fetcher: async () => new Response(JSON.stringify(raw)) };
  assert.match(await (await handleRequest(new Request('https://heavyar.com/en/'), {}, options)).text(), /<h1 class="hero-title">Configured home heading<\/h1>/);
  resetSeoCache();
  assert.match(await (await handleRequest(new Request('https://heavyar.com/en/equipment'), {}, options)).text(), /<h1>Configured equipment heading<\/h1>/);
  resetSeoCache();
  const legalOptions = { ...options, legacyLoader: file => readFile(new URL(`../${file}`, import.meta.url), 'utf8') };
  assert.match(await (await handleRequest(new Request('https://heavyar.com/terms'), {}, legalOptions)).text(), /<h1>شروط وأحكام استخدام منصة Heavyar<\/h1>/);

  resetSeoCache();
  const audited = await handleRequest(new Request('https://heavyar.com/en/'), {}, { fetcher: async () => Response.json({ errorCode: 'SEO_NOT_PUBLISHED' }, { status: 404 }) });
  const auditedHtml = await audited.text();
  assert.match(auditedHtml, /<h1 class="hero-title">Heavy Equipment Closer Than You Think<\/h1>/);
  assert.equal(audited.headers.get('x-seo-source'), 'audited-fallback');
});

test('Early Access remains noindex even if a publication requests indexing', () => {
  const raw = fallbackPayload();
  raw.global.supportedLanguages = ['ar-SA', 'en'];
  for (const page of raw.pages.filter(page => page.key === 'early-access')) {
    page.robots = 'index,follow';
    page.sitemap.include = true;
  }
  const valid = validatePublishedPayload(raw);
  assert.ok(valid.pages.filter(page => page.key === 'early-access').every(page => page.robots === 'noindex,follow' && !page.sitemap.include));
});

test('development CSP permits the Replit preview frame without weakening production', async () => {
  resetSeoCache();
  const options = { basePath: '/heavyar-website', fetcher: async () => Response.json({ errorCode: 'SEO_NOT_PUBLISHED' }, { status: 404 }) };
  const development = await handleRequest(new Request('https://example.test/heavyar-website/'), {}, options);
  assert.doesNotMatch(development.headers.get('content-security-policy'), /frame-ancestors/);
  assert.equal(development.headers.get('x-frame-options'), null);
  resetSeoCache();
  const production = await handleRequest(new Request('https://heavyar.com/'), {}, { fetcher: options.fetcher });
  assert.match(production.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal(production.headers.get('x-frame-options'), 'DENY');
});

test('production blocker aliases and English deletion fields are corrected', async () => {
  const unpublished = async () => Response.json({ errorCode: 'SEO_NOT_PUBLISHED' }, { status: 404 });
  for (const [alias, canonical] of [
    ['/privacy-policy', 'https://heavyar.com/privacy'],
    ['/en/privacy-policy', 'https://heavyar.com/en/privacy'],
    ['/terms-of-service', 'https://heavyar.com/terms'],
    ['/en/terms-of-service', 'https://heavyar.com/en/terms'],
  ]) {
    resetSeoCache();
    const response = await handleRequest(new Request(`https://heavyar.com${alias}`), {}, { fetcher: unpublished });
    assert.equal(response.status, 200);
    assert.match(await response.text(), new RegExp(`canonical" href="${canonical.replaceAll('/', '\\/')}"`));
  }

  resetSeoCache();
  const deletion = await handleRequest(new Request('https://heavyar.com/en/account-deletion'), {}, { fetcher: unpublished });
  const deletionHtml = await deletion.text();
  assert.match(deletionHtml, /placeholder="Enter your password"/);
  assert.match(deletionHtml, /<div lang="en" dir="ltr"><main/);
  assert.match(deletion.headers.get('content-security-policy'), /static\.cloudflareinsights\.com/);

});

test('landing pages use the official Saudi Business seal without the legacy static image', async () => {
  const unpublished = async () => Response.json({ errorCode: 'SEO_NOT_PUBLISHED' }, { status: 404 });
  const seal = /<div class="sbc-verify-seal"\s+data-token="eTlYY0g1Z0x3OUM2QmFkdmUyNk5rZz09"\s+data-position="bottom-left"><\/div>/;
  for (const path of ['/', '/en/']) {
    resetSeoCache();
    const response = await handleRequest(new Request(`https://heavyar.com${path}`), {}, { fetcher: unpublished });
    const html = await response.text();
    assert.match(html, seal);
    assert.match(html, /7050191290/);
    assert.doesNotMatch(html, /sbc-certificate\.png/);
    assert.equal((html.match(/class="nav-lang"/g) || []).length, 1);
    assert.doesNotMatch(html, /class="language-route"/);
    assert.match(html, /class="nav-lang-icon"/);
    assert.match(html, /src="\/assets\/seal-lifecycle\.js"/);
    assert.ok(html.indexOf('/assets/seal-lifecycle.js') < html.indexOf('https://eauthenticate.saudibusiness.gov.sa/EAuthSealApi/seal.js'));
    const csp = response.headers.get('content-security-policy');
    assert.match(csp, /script-src[^;]*https:\/\/eauthenticate\.saudibusiness\.gov\.sa/);
    assert.doesNotMatch(csp, /script-src[^;]*(?:\*|'unsafe-eval')/);
    assert.equal(
      csp.split(';').map(value => value.trim()).find(value => value.startsWith('frame-src')),
      'frame-src https://heavyar-app.firebaseapp.com https://eauthenticate.saudibusiness.gov.sa',
    );
  }
});

test('language control is singular, localized, and keeps locale routes and direction', async () => {
  const unpublished = async () => Response.json({ errorCode: 'SEO_NOT_PUBLISHED' }, { status: 404 });
  for (const [path, lang, dir, target, label] of [
    ['/', 'ar-SA', 'rtl', '/en/', 'English'],
    ['/en/', 'en', 'ltr', '/', 'العربية'],
  ]) {
    resetSeoCache();
    const html = await (await handleRequest(new Request(`https://heavyar.com${path}`), {}, { fetcher: unpublished })).text();
    assert.match(html, new RegExp(`<html lang="${lang}" dir="${dir}">`));
    assert.equal((html.match(/class="nav-lang"/g) || []).length, 1);
    assert.match(html, new RegExp(`href="${target.replaceAll('/', '\\/')}" class="nav-lang"`));
    assert.match(html, new RegExp(`<span>${label}</span>`));
  }
});

test('seal lifecycle reveals only the exact provider frame after its authenticated message', async () => {
  const lifecycle = await readFile(new URL('../assets/seal-lifecycle.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../assets/site.css', import.meta.url), 'utf8');
  for (const [documentLang, sealLang] of [['ar-SA', 'ar'], ['en', 'en']]) {
    const messageListeners = {};
    const observers = [];
    const source = {};
    const wrongSource = {};
    const attributes = new Map();
    const frameListeners = {};
    const exactSrc = `https://eauthenticate.saudibusiness.gov.sa/EAuthSealApi/seal?token=eTlYY0g1Z0x3OUM2QmFkdmUyNk5rZz09&lang=${sealLang}&pos=bottom`;
    const frame = {
      contentWindow: source,
      getAttribute: name => name === 'src' ? exactSrc : null,
      addEventListener: (type, listener) => { frameListeners[type] = listener; },
      setAttribute: (name, value) => attributes.set(name, value),
      removeAttribute: name => attributes.delete(name),
    };
    const wrongFrame = {
      contentWindow: source,
      getAttribute: () => exactSrc.replace('eTlYY0g1Z0x3OUM2QmFkdmUyNk5rZz09', 'wrong-token'),
      addEventListener: () => {},
      setAttribute: () => assert.fail('wrong-token frame must never be revealed'),
      removeAttribute: () => {},
    };
    class MutationObserver {
      constructor(callback) { this.callback = callback; observers.push(this); }
      observe() {}
    }
    runInNewContext(lifecycle, {
      document: { baseURI: 'https://heavyar.com/', documentElement: { lang: documentLang }, querySelectorAll: () => [frame, wrongFrame] },
      window: { addEventListener: (type, listener) => { messageListeners[type] = listener; } },
      MutationObserver,
      WeakSet,
      URL,
    });

    assert.equal(attributes.has('data-seal-ready'), false);
    messageListeners.message({ origin: 'https://evil.example', source, data: { sbcSeal: true } });
    messageListeners.message({ origin: 'https://eauthenticate.saudibusiness.gov.sa', source: wrongSource, data: { sbcSeal: true } });
    messageListeners.message({ origin: 'https://eauthenticate.saudibusiness.gov.sa', source, data: { sbcSeal: false } });
    assert.equal(attributes.has('data-seal-ready'), false);

    messageListeners.message({ origin: 'https://eauthenticate.saudibusiness.gov.sa', source, data: { sbcSeal: true } });
    assert.equal(attributes.get('data-seal-ready'), 'true');
    assert.equal(frameListeners.load, undefined);
    frameListeners.load?.();
    assert.equal(attributes.get('data-seal-ready'), 'true');
    frameListeners.error();
    assert.equal(attributes.has('data-seal-ready'), false);

    messageListeners.message({ origin: 'https://eauthenticate.saudibusiness.gov.sa', source, data: { sbcSeal: true } });
    observers[0].callback();
    assert.equal(attributes.has('data-seal-ready'), false);
  }

  assert.match(css, /\.sbc-verify-seal:not\(\[data-seal-ready="true"\]\)/);
  assert.match(css, /iframe\.sbc-seal-frame:not\(\[data-seal-ready="true"\]\)/);
  assert.match(lifecycle, /document\.querySelectorAll\(frameSelector\)/);
  assert.doesNotMatch(lifecycle, /querySelectorAll\([^)]*sbc-verify-seal/);
  assert.doesNotMatch(lifecycle, /new Image|backgroundImage|naturalWidth/);
});

test('static landing surface keeps the CR and official seal while removing the image', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /السجل التجاري: 7050191290/);
  assert.match(html, /data-token="eTlYY0g1Z0x3OUM2QmFkdmUyNk5rZz09"/);
  assert.match(html, /src="https:\/\/eauthenticate\.saudibusiness\.gov\.sa\/EAuthSealApi\/seal\.js"/);
  assert.match(html, /href="\/en\/" hreflang="en"/);
  assert.equal((html.match(/class="language-toggle language-route"/g) || []).length, 1);
  assert.match(html, /src="\/assets\/seal-lifecycle\.js"/);
  assert.doesNotMatch(html, /sbc-certificate\.png/);
});