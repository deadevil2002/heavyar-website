import { renderHome, renderSiteFooter, renderSiteHeader, renderSiteScripts } from './site.mjs';
import { getSeo, LEGACY_ROUTES, pageFor, renderHead, robotsTxt, ROUTES, sitemapXml, escapeHtml } from './seo.mjs';
import { FALLBACK_REASON } from './fallback.mjs';
import { renderPreservedBody } from './legacy.mjs';
import { hasLegalPage, renderLegalPage } from './legal-pages.mjs';
import { fetchWithDeadline } from './deadline.mjs';

const API_ORIGIN = 'https://heavyar-api.heavyar-official.workers.dev';
const API_RULES = {
  '/api/early-access/config': ['GET', 'HEAD'],
  '/api/early-access/register': ['POST'],
};
const EARLY_ACCESS_CONFIG_URL = `${API_ORIGIN}/api/early-access/config`;
const STATIC_FILES = new Set([
  '/styles.css', '/script.js', '/site.webmanifest',
  '/favicon.ico',
  '/refund.html', '/safety.html', '/providers-terms.html', '/contact.html',
]);
const PRESERVED_DOCUMENT_ROUTES = {
  '/refund': 'refund.html', '/refund.html': 'refund.html',
  '/safety': 'safety.html', '/safety.html': 'safety.html',
  '/providers-terms': 'providers-terms.html', '/providers-terms.html': 'providers-terms.html',
  '/faq': 'faq.html', '/faq.html': 'faq.html',
  '/contact': 'contact.html', '/contact.html': 'contact.html',
};
const text = (body, status = 200, type = 'text/plain; charset=utf-8', extra = {}) => new Response(body, { status, headers: { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', ...extra } });
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; frame-src https://heavyar-app.firebaseapp.com https://eauthenticate.saudibusiness.gov.sa; form-action 'self'; script-src 'self' https://www.gstatic.com https://static.cloudflareinsights.com https://eauthenticate.saudibusiness.gov.sa; connect-src 'self' https://heavyar-api.heavyar-official.workers.dev https://*.googleapis.com https://cloudflareinsights.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-Frame-Options': 'DENY',
};
function pageSecurityHeaders(development = false) {
  if (!development) return securityHeaders;
  const { 'X-Frame-Options': _frameOptions, ...developmentHeaders } = securityHeaders;
  return {
    ...developmentHeaders,
    'Content-Security-Policy': securityHeaders['Content-Security-Policy'].replace("frame-ancestors 'none'; ", ''),
  };
}

function typographyHead(locale) {
  const family = locale === 'ar-SA'
    ? 'IBM+Plex+Sans+Arabic:wght@400;500;600;700'
    : 'IBM+Plex+Sans:wght@400;500;600;700';
  return `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${family}&amp;display=swap">`;
}

function shell(locale, head, body, key) {
  const dir = locale === 'ar-SA' ? 'rtl' : 'ltr';
  return `<!doctype html><html lang="${locale}" dir="${dir}"><head>${typographyHead(locale)}${head}</head><body>${body}</body></html>`;
}

function brandedPage(locale, key, content) {
  const siteLocale = locale === 'en' ? 'en' : 'ar-SA';
  return `${renderSiteHeader(siteLocale, { key })}${content}${renderSiteFooter(siteLocale)}${renderSiteScripts()}`;
}

function routeBody(key, locale, page) {
  const ar = locale === 'ar-SA';
  const sections = {
    about: ar ? ['عن Heavyar', 'Heavyar منصة سوق للمعدات الثقيلة تربط العملاء ومقدمي المعدات والسائقين، وتساعدهم على البحث وإدارة الطلبات والتنسيق بكفاءة.'] : ['About Heavyar', 'Heavyar is a heavy-equipment marketplace platform connecting customers, equipment providers, and drivers for discovery, request management, and efficient coordination.'],
    equipment: ar ? ['اكتشف المعدات', 'استكشف فئات المعدات المعتمدة مثل الحفارات والرافعات واللوادر والجرافات والشاحنات والمولدات والضواغط ومعدات الخرسانة، دون عرض مخزون أو أعداد غير موثقة.'] : ['Discover equipment', 'Explore established categories such as excavators, cranes, loaders, bulldozers, trucks, generators, compressors, and concrete equipment, without unverified inventory or counts.'],
    drivers: ar ? ['اكتشاف السائقين', 'ابحث عن سائقي المعدات حسب القدرات والموقع والتوفر، ثم أرسل طلباً عبر مسار آمن دون كشف بيانات الاتصال للعامة.'] : ['Driver discovery', 'Find equipment drivers by capability, location, and availability, then use a secure request flow without exposing contact details publicly.'],
    help: ar ? ['كيف يمكننا مساعدتك؟', 'تعرّف على المنصة أو تواصل مع الدعم العام عبر heavyar.official@gmail.com.'] : ['How can we help?', 'Learn about the platform or contact public support at heavyar.official@gmail.com.'],
    'early-access': ar ? ['الوصول المبكر', 'يظهر نموذج التسجيل هنا فقط عندما تفعّل Heavyar الوصول المبكر.'] : ['Early access', 'Registration appears here only when Heavyar enables early access.'],
  };
  const [, description] = sections[key];
  const heading = page.heading;
  const faqs = page.faqs.length ? `<section class="route-faq"><h2>${ar ? 'الأسئلة الشائعة' : 'Frequently asked questions'}</h2>${page.faqs.map(f => `<details><summary>${escapeHtml(f.question)}</summary><p>${escapeHtml(f.answer)}</p></details>`).join('')}</section>` : '';
  return `<main class="content-page" id="main-content"><header class="inner-hero"><div class="site-container inner-hero-copy"><p class="eyebrow eyebrow-light">Heavyar</p><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(description)}</p></div></header><div class="site-container route-content">${key === 'early-access' ? '<section id="early-access-root" data-early-access="false" hidden></section>' : ''}${faqs}</div></main>`;
}

function accountDeletionInformation(locale) {
  const ar = locale === 'ar-SA';
  const copy = ar ? {
    eyebrow: 'إدارة الحساب',
    title: 'حذف حساب Heavyar',
    intro: 'يمكنك طلب حذف حسابك مباشرة من تطبيق Heavyar. لا ترسل كلمة المرور أو بيانات الدخول عبر البريد الإلكتروني أو الدعم.',
    stepsTitle: 'طريقة طلب حذف الحساب',
    steps: [
      'افتح تطبيق Heavyar.',
      'سجّل الدخول إلى حسابك.',
      'افتح «الملف الشخصي» أو «الإعدادات».',
      'اختر «حذف الحساب».',
      'راجع التنبيه وأكد طلب الحذف.',
    ],
    processTitle: 'ماذا يحدث بعد الطلب؟',
    process: 'يبدأ الطلب من داخل التطبيق. يتم قفل الحساب وبدء معالجة طلب الحذف وفق سياسة الخصوصية. قد يتم الاحتفاظ بسجلات محدودة عندما يكون الاحتفاظ مطلوباً لأغراض نظامية أو محاسبية أو نزاعات.',
    accessTitle: 'لا تستطيع الوصول إلى حسابك؟',
    access: 'تواصل مع دعم Heavyar للمساعدة. لا ترسل كلمة المرور أو أي بيانات دخول.',
    privacy: 'سياسة الخصوصية',
    support: 'الدعم',
  } : {
    eyebrow: 'Account management',
    title: 'Delete your Heavyar account',
    intro: 'You can request deletion of your account directly in the Heavyar app. Never send your password or sign-in credentials by email or to support.',
    stepsTitle: 'How to request account deletion',
    steps: [
      'Open the Heavyar app.',
      'Sign in to your account.',
      'Open “Profile” or “Settings”.',
      'Select “Delete account”.',
      'Review the notice and confirm the deletion request.',
    ],
    processTitle: 'What happens after the request?',
    process: 'The request starts inside the app. Your account is locked and the deletion process begins under the Privacy Policy. Limited records may be retained when required for legal, accounting, or dispute purposes.',
    accessTitle: 'Cannot access your account?',
    access: 'Contact Heavyar Support for assistance. Never send your password or other sign-in credentials.',
    privacy: 'Privacy Policy',
    support: 'Support',
  };
  const steps = copy.steps.map((step, index) => `<li><span aria-hidden="true">${index + 1}</span><p>${escapeHtml(step)}</p></li>`).join('');
  return `<main class="content-page account-information" id="main-content"><header class="inner-hero"><div class="site-container inner-hero-copy"><p class="eyebrow eyebrow-light">${escapeHtml(copy.eyebrow)}</p><h1>${escapeHtml(copy.title)}</h1><p>${escapeHtml(copy.intro)}</p></div></header><div class="site-container account-information-layout"><section class="account-information-card" aria-labelledby="deletion-steps"><h2 id="deletion-steps">${escapeHtml(copy.stepsTitle)}</h2><ol class="account-deletion-steps">${steps}</ol></section><aside class="account-information-aside"><section><h2>${escapeHtml(copy.processTitle)}</h2><p>${escapeHtml(copy.process)}</p><a href="/privacy">${escapeHtml(copy.privacy)}</a></section><section><h2>${escapeHtml(copy.accessTitle)}</h2><p>${escapeHtml(copy.access)}</p><a href="mailto:heavyar.official@gmail.com">heavyar.official@gmail.com</a><a href="/support">${escapeHtml(copy.support)}</a></section></aside></div></main>`;
}

function notFound(locale) {
  const en = locale === 'en';
  const home = en ? '/en/' : '/';
  return brandedPage(locale, 'home', `<main class="not-found-page" id="main-content"><div class="site-container not-found-card"><span class="not-found-code">404</span><p class="eyebrow">${en ? 'Page not found' : 'الصفحة غير موجودة'}</p><h1>${en ? 'This route is not available' : 'هذا الرابط غير متاح'}</h1><p>${en ? 'The page may have moved or the address may be incorrect.' : 'ربما نُقلت الصفحة أو أن العنوان غير صحيح.'}</p><a class="btn btn-primary" href="${home}">${en ? 'Return home' : 'العودة للرئيسية'}</a></div></main>`);
}

function devRewrite(html, basePath) {
  if (!basePath) return html;
  return html.replace(/<(a|link|script|img)\b([^>]*?)\s(href|src)="(\/(?!\/)[^"]*)"/gi, (all, tag, attrs, name, value) => {
    if (tag.toLowerCase() === 'link' && /\brel="(?:canonical|alternate)"/i.test(attrs)) return all;
    return `<${tag}${attrs} ${name}="${basePath}${value}"`;
  });
}

async function proxyApi(request, pathname, fetcher) {
  const methods = API_RULES[pathname];
  if (!methods) return text('Not found', 404);
  if (!methods.includes(request.method)) return text('Method not allowed', 405, 'text/plain; charset=utf-8', { Allow: methods.join(', ') });
  const headers = new Headers();
  for (const name of ['accept', 'accept-language', 'content-type', 'user-agent']) {
    const value = request.headers.get(name); if (value) headers.set(name, value);
  }
  // req.cf proves this request passed through Cloudflare. Never trust a client-
  // supplied forwarding header in Node/dev or non-Cloudflare environments.
  if (request.cf && request.headers.get('cf-connecting-ip')) headers.set('CF-Connecting-IP', request.headers.get('cf-connecting-ip'));
  const upstreamMethod = request.method === 'HEAD' ? 'GET' : request.method;
  const init = { method: upstreamMethod, headers, redirect: 'manual' };
  if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = request.body;
    init.duplex = 'half';
  }
  const response = await fetcher(`${API_ORIGIN}${pathname}`, init);
  if (request.method !== 'HEAD') return response;
  return new Response(null, { status: response.status, headers: response.headers });
}

async function getEarlyAccessEnabled(fetcher, timeoutMs = 1500) {
  try {
    const response = await fetchWithDeadline(fetcher, EARLY_ACCESS_CONFIG_URL, {
      headers: { Accept: 'application/json' },
    }, timeoutMs, 'Early Access');
    if (!response.ok) return false;
    const payload = await response.json();
    return payload?.enabled === true;
  } catch {
    return false;
  }
}

export async function handleRequest(request, env = {}, options = {}) {
  const url = new URL(request.url);
  const basePath = options.basePath || '';
  let pathname = url.pathname;
  if (basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))) pathname = pathname.slice(basePath.length) || '/';
  // Production browsers call the fixed API Worker directly. A same-origin
  // proxy would cross Cloudflare zones and lose the visitor IP semantics used
  // by backend rate limiting. The proxy exists only for the local dev server.
  if (pathname.startsWith('/api/')) {
    if (options.enableDevApiProxy === true) return proxyApi(request, pathname, options.fetcher || fetch);
    return text(request.method === 'HEAD' ? null : 'Not found', 404);
  }
  if (!['GET', 'HEAD'].includes(request.method)) return text('Method not allowed', 405, 'text/plain; charset=utf-8', { Allow: 'GET, HEAD' });
  const legalPathname = ({ '/privacy-policy': '/privacy', '/en/privacy-policy': '/en/privacy', '/terms-of-service': '/terms', '/en/terms-of-service': '/en/terms' })[pathname] || pathname;
  const legalMatch = legalPathname.match(/^\/(en\/)?(terms|privacy|refund-policy|disputes|provider-terms|driver-terms|verification|restricted-activities|acceptable-use)\/?$/);
  if (legalMatch && hasLegalPage(legalMatch[2])) {
    const locale = legalMatch[1] ? 'en' : 'ar-SA';
    const body = brandedPage(locale, legalMatch[2], renderLegalPage(legalMatch[2], locale === 'en' ? 'en' : 'ar'));
    const canonical = `https://heavyar.com${locale === 'en' ? '/en' : ''}/${legalMatch[2]}`;
    const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${legalMatch[2]} | Heavyar</title><link rel="canonical" href="${canonical}"><link rel="stylesheet" href="/assets/site.css">`;
    return text(request.method === 'HEAD' ? null : shell(locale, head, body, legalMatch[2]), 200, 'text/html; charset=utf-8', { ...pageSecurityHeaders(Boolean(basePath)), 'Cache-Control': 'public, max-age=60' });
  }
  const preservedFilename = PRESERVED_DOCUMENT_ROUTES[pathname];
  if (preservedFilename) {
    const content = renderPreservedBody(preservedFilename);
    const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Heavyar</title><link rel="stylesheet" href="/assets/site.css">`;
    const html = devRewrite(shell('ar-SA', head, brandedPage('ar-SA', 'home', content), 'preserved'), basePath);
    return text(request.method === 'HEAD' ? null : html, 200, 'text/html; charset=utf-8', {
      ...pageSecurityHeaders(Boolean(basePath)),
      'Cache-Control': 'public, max-age=60',
    });
  }
  if (pathname === '/robots.txt' || pathname === '/sitemap.xml') {
    const { payload } = await getSeo(options.fetcher || fetch);
    const body = request.method === 'HEAD' ? null : (pathname === '/robots.txt' ? robotsTxt(payload) : sitemapXml(payload));
    return text(body, 200, pathname.endsWith('.xml') ? 'application/xml; charset=utf-8' : 'text/plain; charset=utf-8', { 'Cache-Control': 'public, max-age=60' });
  }
  const legacy = LEGACY_ROUTES[pathname];
  const legalAlias = {
    '/privacy-policy': '/privacy',
    '/en/privacy-policy': '/en/privacy',
    '/terms-of-service': '/terms',
    '/en/terms-of-service': '/en/terms',
  }[pathname];
  const publicAlias = {
    '/support': '/help',
    '/en/support': '/en/help',
  }[pathname];
  const cleanPath = legalAlias || publicAlias || legacy || pathname;
  const route = ROUTES[cleanPath] || (cleanPath.endsWith('/') ? ROUTES[cleanPath.slice(0, -1)] : ROUTES[`${cleanPath}/`]);
  if (route) {
    const [key, locale] = route;
    const fetcher = options.fetcher || fetch;
    const isEarlyAccessSurface = key === 'home' || key === 'early-access';
    const [{ payload, source }, earlyAccessEnabled] = await Promise.all([
      getSeo(fetcher, Date.now(), options.seoTimeoutMs),
      isEarlyAccessSurface ? getEarlyAccessEnabled(fetcher, options.earlyAccessTimeoutMs) : false,
    ]);
    const page = pageFor(payload, key, locale);
    const hasPublishedLocale = payload.pages.some(candidate => candidate.key === key && candidate.locale === locale);
    let body;
    if (isEarlyAccessSurface) {
      body = renderHome({ locale, faqs: page.faqs, earlyAccessEnabled });
      if (hasPublishedLocale && ['published', 'stale-published'].includes(source)) {
        body = body.replace(/(<h1 class="hero-title">)[\s\S]*?(<\/h1>)/, `$1${escapeHtml(page.heading)}$2`);
      }
    }
    else if (key === 'account-deletion') body = brandedPage(locale, key, accountDeletionInformation(locale));
    else body = brandedPage(locale, key, routeBody(key, locale, page));
    const extraHead = isEarlyAccessSurface ? '' : '<link rel="stylesheet" href="/assets/site.css">';
    const apiBase = basePath || API_ORIGIN;
    const integrationHead = `<meta name="heavyar-api-base" content="${escapeHtml(apiBase)}">`;
    const html = devRewrite(shell(locale, `${renderHead(page, payload.global)}${extraHead}${integrationHead}`, body, key), basePath);
    const seoSource = ['published', 'stale-published'].includes(source)
      ? (hasPublishedLocale ? source : 'published-missing-locale-noindex-fallback')
      : source === FALLBACK_REASON ? 'audited-fallback' : 'unavailable-fallback';
    const cacheControl = isEarlyAccessSurface ? 'no-store' : 'public, max-age=60';
    return text(request.method === 'HEAD' ? null : html, 200, 'text/html; charset=utf-8', { ...pageSecurityHeaders(Boolean(basePath)), 'Cache-Control': cacheControl, 'X-Robots-Tag': page.robots, 'X-SEO-Source': seoSource });
  }
  // Repository-root Pages deployments must never expose implementation, Git,
  // tests, or baseline source files through the static asset binding.
  const assetPath = pathname === '/favicon.ico' ? '/assets/icons/favicon.ico' : pathname;
  const safeStatic = assetPath.startsWith('/assets/') || STATIC_FILES.has(pathname);
  if (safeStatic && env.ASSETS?.fetch) {
    const assetRequest = assetPath === pathname ? request : new Request(new URL(assetPath, request.url), request);
    const response = await env.ASSETS.fetch(assetRequest);
    return new Response(request.method === 'HEAD' ? null : response.body, { status: response.status, headers: { ...Object.fromEntries(response.headers), ...securityHeaders } });
  }
  if (safeStatic && options.asset) {
    const response = await options.asset(assetPath, request);
    return request.method === 'HEAD' ? new Response(null, { status: response.status, headers: response.headers }) : response;
  }
  const locale = pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'ar-SA';
  const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>404 | Heavyar</title><meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/assets/site.css">`;
  return text(request.method === 'HEAD' ? null : devRewrite(shell(locale, head, notFound(locale), '404'), basePath), 404, 'text/html; charset=utf-8', pageSecurityHeaders(Boolean(basePath)));
}
