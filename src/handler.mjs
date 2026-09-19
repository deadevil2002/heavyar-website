import { renderHome } from './site.mjs';
import { getSeo, LEGACY_ROUTES, pageFor, renderHead, robotsTxt, ROUTES, sitemapXml, escapeHtml } from './seo.mjs';
import { FALLBACK_REASON } from './fallback.mjs';
import { legacySource, renderLegacy, renderPreservedDocument } from './legacy.mjs';

const API_ORIGIN = 'https://heavyar-api.heavyar-official.workers.dev';
const API_RULES = {
  '/api/early-access/config': ['GET', 'HEAD'],
  '/api/early-access/register': ['POST'],
};
const STATIC_FILES = new Set([
  '/delete-account.js', '/styles.css', '/script.js', '/site.webmanifest',
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
  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; frame-src https://heavyar-app.firebaseapp.com; form-action 'self'; script-src 'self' https://www.gstatic.com; connect-src 'self' https://heavyar-api.heavyar-official.workers.dev https://*.googleapis.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com",
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

function shell(locale, head, body, key) {
  const dir = locale === 'ar-SA' ? 'rtl' : 'ltr';
  const other = locale === 'ar-SA' ? (key === 'home' ? '/en/' : `/en/${key === 'account-deletion' ? 'account-deletion' : key}`) : (key === 'home' ? '/' : `/${key}`);
  return `<!doctype html><html lang="${locale}" dir="${dir}"><head>${head}</head><body>${body}${key === 'account-deletion' ? '<script type="module" src="/delete-account.js"></script>' : ''}<a class="language-route" href="${other}" aria-label="Language">${locale === 'ar-SA' ? 'English' : 'العربية'}</a></body></html>`;
}

function legalNavigation(locale) {
  const ar = locale === 'ar-SA', prefix = ar ? '' : '/en';
  return `<nav class="navbar"><div class="container"><a href="${prefix}/" class="navbar-brand"><img src="/assets/images/logo.png" alt="Heavyar" class="navbar-logo"><span class="navbar-title">Heavyar</span></a><div class="footer-links"><a href="${prefix}/privacy">${ar ? 'الخصوصية' : 'Privacy'}</a><a href="${prefix}/terms">${ar ? 'الشروط' : 'Terms'}</a><a href="${prefix}/account-deletion">${ar ? 'حذف الحساب' : 'Delete account'}</a></div></div></nav>`;
}

function routeBody(key, locale, page) {
  const ar = locale === 'ar-SA';
  const sections = {
    about: ar ? ['عن Heavyar', 'Heavyar منصة سوق للمعدات الثقيلة تربط العملاء ومقدمي المعدات والسائقين، وتساعدهم على البحث وإدارة الطلبات والتنسيق بكفاءة.'] : ['About Heavyar', 'Heavyar is a heavy-equipment marketplace platform connecting customers, equipment providers, and drivers for discovery, request management, and efficient coordination.'],
    equipment: ar ? ['اكتشف المعدات', 'استكشف فئات المعدات المعتمدة مثل الحفارات والرافعات واللوادر والجرافات والشاحنات والمولدات والضواغط ومعدات الخرسانة، دون عرض مخزون أو أعداد غير موثقة.'] : ['Discover equipment', 'Explore established categories such as excavators, cranes, loaders, bulldozers, trucks, generators, compressors, and concrete equipment—without unverified inventory or counts.'],
    drivers: ar ? ['اكتشاف السائقين', 'ابحث عن سائقي المعدات حسب القدرات والموقع والتوفر، ثم أرسل طلباً عبر مسار آمن دون كشف بيانات الاتصال للعامة.'] : ['Driver discovery', 'Find equipment drivers by capability, location, and availability, then use a secure request flow without exposing contact details publicly.'],
    help: ar ? ['كيف يمكننا مساعدتك؟', 'تعرّف على المنصة أو تواصل مع الدعم العام عبر heavyar.official@gmail.com.'] : ['How can we help?', 'Learn about the platform or contact public support at heavyar.official@gmail.com.'],
    'early-access': ar ? ['الوصول المبكر', 'يظهر نموذج التسجيل هنا فقط عندما تفعّل Heavyar الوصول المبكر.'] : ['Early access', 'Registration appears here only when Heavyar enables early access.'],
  };
  const [, description] = sections[key];
  const heading = page.heading;
  const faqs = page.faqs.length ? `<section class="route-faq"><h2>${ar ? 'الأسئلة الشائعة' : 'Frequently asked questions'}</h2>${page.faqs.map(f => `<details><summary>${escapeHtml(f.question)}</summary><p>${escapeHtml(f.answer)}</p></details>`).join('')}</section>` : '';
  return `<header class="simple-header"><a href="${ar ? '/' : '/en/'}">Heavyar</a></header><main class="route-main"><p class="eyebrow">Heavyar</p><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(description)}</p>${key === 'early-access' ? '<section id="early-access-root" data-early-access="false" hidden></section>' : ''}${faqs}</main>`;
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
  const preservedFilename = PRESERVED_DOCUMENT_ROUTES[pathname];
  if (preservedFilename) {
    const html = devRewrite(renderPreservedDocument(preservedFilename), basePath);
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
  const cleanPath = legacy || pathname;
  const route = ROUTES[cleanPath] || (cleanPath.endsWith('/') ? ROUTES[cleanPath.slice(0, -1)] : ROUTES[`${cleanPath}/`]);
  if (route) {
    const [key, locale] = route;
    const { payload, source } = await getSeo(options.fetcher || fetch);
    const page = pageFor(payload, key, locale);
    const hasPublishedLocale = payload.pages.some(candidate => candidate.key === key && candidate.locale === locale);
    let body;
    if (key === 'home' || key === 'early-access') {
      body = renderHome({ locale, faqs: page.faqs, earlyAccessEnabled: false });
      if (hasPublishedLocale && ['published', 'stale-published'].includes(source)) {
        body = body.replace(/(<h1 class="hero-title">)[\s\S]*?(<\/h1>)/, `$1${escapeHtml(page.heading)}$2`);
      }
    }
    else if (['privacy', 'terms', 'account-deletion'].includes(key)) {
      body = `${legalNavigation(locale)}${await renderLegacy(key, locale, legacySource(key))}`;
    }
    else body = routeBody(key, locale, page);
    const extraHead = ['privacy', 'terms', 'account-deletion'].includes(key) ? '<link rel="stylesheet" href="/styles.css">' : '';
    const apiBase = basePath || API_ORIGIN;
    const integrationHead = `<meta name="heavyar-api-base" content="${escapeHtml(apiBase)}">`;
    const html = devRewrite(shell(locale, `${renderHead(page, payload.global)}${extraHead}${integrationHead}`, body, key), basePath);
    const seoSource = ['published', 'stale-published'].includes(source)
      ? (hasPublishedLocale ? source : 'published-missing-locale-noindex-fallback')
      : source === FALLBACK_REASON ? 'audited-fallback' : 'unavailable-fallback';
    return text(request.method === 'HEAD' ? null : html, 200, 'text/html; charset=utf-8', { ...pageSecurityHeaders(Boolean(basePath)), 'Cache-Control': 'public, max-age=60', 'X-Robots-Tag': page.robots, 'X-SEO-Source': seoSource });
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
  return text(request.method === 'HEAD' ? null : 'Not found', 404);
}