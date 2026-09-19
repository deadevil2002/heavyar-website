import { fallbackPayload, FALLBACK_REASON } from './fallback.mjs';

export const SEO_ENDPOINT = 'https://heavyar-api.heavyar-official.workers.dev/api/seo/published';
export const PAGE_KEYS = ['home', 'about', 'equipment', 'drivers', 'help', 'privacy', 'terms', 'account-deletion', 'early-access'];
export const ROUTES = {
  '/': ['home', 'ar-SA'], '/en/': ['home', 'en'],
  '/about': ['about', 'ar-SA'], '/en/about': ['about', 'en'],
  '/equipment': ['equipment', 'ar-SA'], '/en/equipment': ['equipment', 'en'],
  '/drivers': ['drivers', 'ar-SA'], '/en/drivers': ['drivers', 'en'],
  '/help': ['help', 'ar-SA'], '/en/help': ['help', 'en'],
  '/privacy': ['privacy', 'ar-SA'], '/en/privacy': ['privacy', 'en'],
  '/terms': ['terms', 'ar-SA'], '/en/terms': ['terms', 'en'],
  '/account-deletion': ['account-deletion', 'ar-SA'], '/en/account-deletion': ['account-deletion', 'en'],
  '/early-access': ['early-access', 'ar-SA'], '/en/early-access': ['early-access', 'en'],
};
export const LEGACY_ROUTES = {
  '/index.html': '/', '/privacy.html': '/privacy', '/terms.html': '/terms',
  '/delete-account.html': '/account-deletion', '/faq.html': '/help',
  '/delete-account': '/account-deletion', '/en/delete-account': '/en/account-deletion',
};

const state = { payload: null, etag: null, expires: 0, pending: null, source: 'fallback' };
const isObj = value => value && typeof value === 'object' && !Array.isArray(value);
const cleanText = (value, name, max = 2048) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) throw new Error(`Invalid ${name}`);
  return value.trim();
};
const url = (value, name, origin = null) => {
  const parsed = new URL(cleanText(value, name));
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port || (origin && parsed.origin !== origin)) throw new Error(`Invalid ${name}`);
  return parsed.toString();
};
const nullableUrl = (value, name) => value == null ? null : url(value, name);

function validateSchema(raw) {
  if (!isObj(raw) || raw['@context'] !== 'https://schema.org') throw new Error('Invalid structured data');
  const type = raw['@type'];
  const allowed = {
    Organization: ['@context', '@type', 'name', 'alternateName', 'url', 'logo', 'email', 'identifier', 'sameAs'],
    WebSite: ['@context', '@type', 'name', 'url', 'inLanguage'],
    MobileApplication: ['@context', '@type', 'name', 'applicationCategory', 'operatingSystem', 'downloadUrl', 'installUrl'],
    FAQPage: ['@context', '@type', 'mainEntity'],
    BreadcrumbList: ['@context', '@type', 'itemListElement'],
  };
  if (!allowed[type] || Object.keys(raw).some(key => !allowed[type].includes(key))) throw new Error('Unsupported structured data');
  const clone = JSON.parse(JSON.stringify(raw));
  const walk = (v, depth = 0) => {
    if (depth > 8) throw new Error('Structured data too deep');
    if (typeof v === 'string') {
      if (v.length > 2048 || /[<>\u0000-\u001f]/.test(v)) throw new Error('Unsafe structured data');
    } else if (Array.isArray(v)) {
      if (v.length > 50) throw new Error('Structured data too large');
      v.forEach(x => walk(x, depth + 1));
    } else if (isObj(v)) {
      if (Object.keys(v).some(k => !/^[@A-Za-z][A-Za-z0-9@]*$/.test(k))) throw new Error('Unsafe structured data key');
      Object.values(v).forEach(x => walk(x, depth + 1));
    } else if (!['number', 'boolean'].includes(typeof v) && v !== null) throw new Error('Invalid structured data value');
  };
  walk(clone);
  const exactKeys = (value, keys) => isObj(value) && Object.keys(value).every(key => keys.includes(key)) && keys.filter(key => !key.endsWith('?')).every(key => key in value);
  const schemaUrl = value => {
    try { return typeof value === 'string' && new URL(value).protocol === 'https:'; } catch { return false; }
  };
  if (type === 'Organization' && (
    typeof clone.name !== 'string' || !schemaUrl(clone.url) ||
    (clone.logo != null && !schemaUrl(clone.logo)) ||
    (clone.sameAs != null && (!Array.isArray(clone.sameAs) || clone.sameAs.some(value => !schemaUrl(value)))) ||
    (clone.email != null && (typeof clone.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clone.email))) ||
    ['alternateName', 'identifier'].some(key => clone[key] != null && typeof clone[key] !== 'string')
  )) throw new Error('Invalid Organization');
  if (type === 'WebSite' && (typeof clone.name !== 'string' || !schemaUrl(clone.url) || !['ar-SA', 'en'].includes(clone.inLanguage))) throw new Error('Invalid WebSite');
  if (type === 'MobileApplication' && (
    typeof clone.name !== 'string' ||
    !['BusinessApplication', 'UtilitiesApplication', 'TravelApplication'].includes(clone.applicationCategory) ||
    typeof clone.operatingSystem !== 'string' || !clone.operatingSystem ||
    (clone.downloadUrl != null && !schemaUrl(clone.downloadUrl)) ||
    (clone.installUrl != null && !schemaUrl(clone.installUrl))
  )) throw new Error('Invalid MobileApplication');
  if (type === 'FAQPage' && (!Array.isArray(clone.mainEntity) || !clone.mainEntity.length || clone.mainEntity.some(q =>
    !exactKeys(q, ['@type', 'name', 'acceptedAnswer']) || q['@type'] !== 'Question' || typeof q.name !== 'string' ||
    !exactKeys(q.acceptedAnswer, ['@type', 'text']) || q.acceptedAnswer['@type'] !== 'Answer' || typeof q.acceptedAnswer.text !== 'string'
  ))) throw new Error('Invalid FAQPage');
  if (type === 'BreadcrumbList' && (!Array.isArray(clone.itemListElement) || !clone.itemListElement.length || clone.itemListElement.some(x =>
    !exactKeys(x, ['@type', 'position', 'name', 'item']) || x['@type'] !== 'ListItem' || !Number.isSafeInteger(x.position) ||
    typeof x.name !== 'string' || !schemaUrl(x.item)
  ))) throw new Error('Invalid BreadcrumbList');
  return clone;
}

export function validatePublishedPayload(raw) {
  if (!isObj(raw) || raw.success !== true || raw.schemaVersion !== 1 || !isObj(raw.global) || raw.global.canonicalOrigin !== 'https://heavyar.com' || !isObj(raw.crawlerPolicy) || !Array.isArray(raw.pages)) throw new Error('Invalid published SEO payload');
  const pages = raw.pages.map((p, index) => {
    if (!isObj(p) || !PAGE_KEYS.includes(p.key) || !['ar-SA', 'en'].includes(p.locale)) throw new Error(`Invalid page ${index}`);
    const canonical = url(p.canonical, 'canonical', 'https://heavyar.com').replace(/\/$/, p.canonical.endsWith('/') ? '/' : '');
    const route = Object.entries(ROUTES).find(([, x]) => x[0] === p.key && x[1] === p.locale)?.[0];
    if (!route || new URL(canonical).pathname !== route) throw new Error('Canonical outside controlled registry');
    if (!['index,follow', 'noindex,follow', 'noindex,nofollow'].includes(p.robots)) throw new Error('Invalid robots');
    const social = (x, kind) => {
      if (!isObj(x)) throw new Error(`Invalid ${kind}`);
      return { title: cleanText(x.title, `${kind} title`, 500), description: cleanText(x.description, `${kind} description`, 1000), image: nullableUrl(x.image, `${kind} image`), ...(kind === 'openGraph' ? { locale: p.locale, siteName: cleanText(x.siteName, 'siteName', 100) } : { card: ['summary', 'summary_large_image'].includes(x.card) ? x.card : 'summary' }) };
    };
    const faqs = Array.isArray(p.faqs) ? p.faqs.map(f => ({ question: cleanText(f?.question, 'FAQ question', 500), answer: cleanText(f?.answer, 'FAQ answer', 2000), order: Number.isSafeInteger(f?.order) ? f.order : 0 })) : [];
    const schemas = Array.isArray(p.structuredData) ? p.structuredData.map(validateSchema) : [];
    if (schemas.some(x => x['@type'] === 'FAQPage') && !faqs.length) throw new Error('Schema-only FAQ is forbidden');
    const faqSchema = schemas.find(x => x['@type'] === 'FAQPage');
    if (faqSchema) {
      const visible = faqs.map(f => [f.question, f.answer]);
      const encoded = faqSchema.mainEntity.map(q => [q.name, q.acceptedAnswer.text]);
      if (JSON.stringify(visible) !== JSON.stringify(encoded)) throw new Error('FAQ schema must exactly match visible FAQ content');
    }
    const alternates = Array.isArray(p.alternates) ? p.alternates.map(a => {
      if (!isObj(a) || !['ar-SA', 'en', 'x-default'].includes(a.locale)) throw new Error('Invalid alternate');
      return { locale: a.locale, href: url(a.href, 'alternate', 'https://heavyar.com') };
    }) : [];
    const sitemap = isObj(p.sitemap) ? {
      include: p.sitemap.include === true && p.robots === 'index,follow',
      priority: typeof p.sitemap.priority === 'number' && p.sitemap.priority >= 0 && p.sitemap.priority <= 1 ? p.sitemap.priority : null,
      changeFrequency: ['', 'daily', 'weekly', 'monthly', 'yearly'].includes(p.sitemap.changeFrequency) ? p.sitemap.changeFrequency : '',
      lastmod: typeof p.sitemap.lastmod === 'string' && Number.isFinite(Date.parse(p.sitemap.lastmod)) ? new Date(p.sitemap.lastmod).toISOString() : null,
    } : { include: false, priority: null, changeFrequency: '', lastmod: null };
    return { key: p.key, locale: p.locale, title: cleanText(p.title, 'title', 500), description: cleanText(p.description, 'description', 1000), heading: cleanText(p.heading, 'heading', 500), canonical, robots: p.key === 'account-deletion' ? 'noindex,nofollow' : p.key === 'early-access' ? 'noindex,follow' : p.robots, openGraph: social(p.openGraph, 'openGraph'), twitter: social(p.twitter, 'twitter'), sitemap: p.key === 'account-deletion' || p.key === 'early-access' ? { ...sitemap, include: false } : sitemap, alternates, structuredData: schemas, faqs };
  });
  if (new Set(pages.map(p => `${p.key}:${p.locale}`)).size !== pages.length) throw new Error('Duplicate pages');
  const supportedLanguages = Array.isArray(raw.global.supportedLanguages)
    ? raw.global.supportedLanguages.filter(locale => ['ar-SA', 'en'].includes(locale))
    : [...new Set(pages.map(page => page.locale))];
  if (!supportedLanguages.length || supportedLanguages.length !== new Set(supportedLanguages).size ||
      pages.length !== PAGE_KEYS.length * supportedLanguages.length ||
      PAGE_KEYS.some(key => !supportedLanguages.every(locale => pages.some(page => page.key === key && page.locale === locale))) ||
      pages.some(page => !supportedLanguages.includes(page.locale))) {
    throw new Error('Published payload must contain every controlled page for each supported language');
  }
  const crawlerPolicy = Object.fromEntries(['mainstreamIndexing', 'googlebot', 'bingbot', 'oaiSearchBot'].map(k => [k, raw.crawlerPolicy[k] === true]));
  if (!crawlerPolicy.mainstreamIndexing && (crawlerPolicy.googlebot || crawlerPolicy.bingbot || crawlerPolicy.oaiSearchBot)) throw new Error('Invalid crawler policy');
  return {
    success: true, schemaVersion: 1, version: raw.version,
    global: { siteName: cleanText(raw.global.siteName, 'siteName', 100), canonicalOrigin: 'https://heavyar.com', supportedLanguages, assets: Object.fromEntries(['faviconIco', 'faviconPng', 'icon192', 'icon512', 'appleTouchIcon', 'socialShare'].map(k => [k, nullableUrl(raw.global.assets?.[k], `asset ${k}`)])) },
    crawlerPolicy,
    pages,
  };
}

export async function getSeo(fetcher = fetch, now = Date.now()) {
  if (state.payload && now < state.expires) return { payload: state.payload, source: state.source };
  if (state.pending) return state.pending;
  state.pending = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new Error('SEO_TIMEOUT')), 2_000);
    try {
      const headers = state.etag ? { 'If-None-Match': state.etag } : {};
      const response = await fetcher(SEO_ENDPOINT, { headers, signal: controller.signal });
      if (response.status === 304 && state.payload && ['published', 'stale-published'].includes(state.source)) {
        state.expires = now + 60_000;
        state.source = 'published';
        return { payload: state.payload, source: state.source };
      }
      if (response.status === 404) {
        const reason = await response.json();
        if (reason?.errorCode !== 'SEO_NOT_PUBLISHED') throw new Error('SEO_UNAVAILABLE');
        state.payload = fallbackPayload(); state.etag = null; state.expires = now + 60_000; state.source = FALLBACK_REASON;
        return { payload: state.payload, source: state.source, error: new Error('SEO_NOT_PUBLISHED') };
      }
      if (!response.ok) throw new Error('SEO_UNAVAILABLE');
      const payload = validatePublishedPayload(await response.json());
      // Commit payload and validator-matched ETag together.
      const etag = response.headers.get('etag');
      state.payload = payload; state.etag = etag; state.expires = now + 60_000; state.source = 'published';
      return { payload, source: 'published' };
    } catch (error) {
      if (state.payload && ['published', 'stale-published'].includes(state.source)) {
        state.expires = now + 5_000; state.source = 'stale-published';
        return { payload: state.payload, source: state.source, error };
      }
      const conservative = fallbackPayload();
      conservative.crawlerPolicy = { mainstreamIndexing: false, googlebot: false, bingbot: false, oaiSearchBot: false };
      conservative.pages = conservative.pages.map(page => ({ ...page, robots: 'noindex,nofollow', sitemap: { ...page.sitemap, include: false }, structuredData: [] }));
      state.payload = conservative; state.etag = null; state.expires = now + 5_000; state.source = 'unavailable-fallback';
      return { payload: state.payload, source: state.source, error };
    } finally {
      clearTimeout(timeout);
      state.pending = null;
    }
  })();
  return state.pending;
}

export function resetSeoCache() {
  state.payload = null; state.etag = null; state.expires = 0; state.pending = null; state.source = 'fallback';
}

export function pageFor(payload, key, locale) {
  const resolved = payload.pages.find(page => page.key === key && page.locale === locale);
  if (resolved) return resolved;
  const fallback = fallbackPayload().pages.find(page => page.key === key && page.locale === locale);
  return { ...fallback, robots: 'noindex,follow', sitemap: { ...fallback.sitemap, include: false }, structuredData: [] };
}

export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export const escapeJson = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

export function renderHead(page, global) {
  const e = escapeHtml;
  const icons = global.assets || {};
  const iconTags = [
    icons.faviconIco && `<link rel="icon" href="${e(icons.faviconIco)}" sizes="any">`,
    icons.faviconPng && `<link rel="icon" type="image/png" href="${e(icons.faviconPng)}">`,
    icons.icon192 && `<link rel="icon" type="image/png" sizes="192x192" href="${e(icons.icon192)}">`,
    icons.icon512 && `<link rel="icon" type="image/png" sizes="512x512" href="${e(icons.icon512)}">`,
    icons.appleTouchIcon && `<link rel="apple-touch-icon" href="${e(icons.appleTouchIcon)}">`,
  ].filter(Boolean).join('\n');
  const alternateTags = page.alternates.map(a => `<link rel="alternate" hreflang="${e(a.locale)}" href="${e(a.href)}">`).join('\n');
  const ogImage = page.openGraph.image ? `<meta property="og:image" content="${e(page.openGraph.image)}">` : '';
  const xImage = page.twitter.image ? `<meta name="twitter:image" content="${e(page.twitter.image)}">` : '';
  const schemas = page.structuredData.map(schema => `<script type="application/ld+json">${escapeJson(schema)}</script>`).join('\n');
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${e(page.title)}</title>
<meta name="description" content="${e(page.description)}">
<meta name="robots" content="${e(page.robots)}">
<link rel="canonical" href="${e(page.canonical)}">
${alternateTags}
<meta property="og:type" content="website">
<meta property="og:locale" content="${page.locale === 'ar-SA' ? 'ar_SA' : 'en_US'}">
<meta property="og:title" content="${e(page.openGraph.title)}">
<meta property="og:description" content="${e(page.openGraph.description)}">
<meta property="og:url" content="${e(page.canonical)}">
<meta property="og:site_name" content="${e(page.openGraph.siteName)}">
${ogImage}
<meta name="twitter:card" content="${e(page.twitter.card)}">
<meta name="twitter:title" content="${e(page.twitter.title)}">
<meta name="twitter:description" content="${e(page.twitter.description)}">
${xImage}
${iconTags}
<link rel="manifest" href="/site.webmanifest">
<link rel="stylesheet" href="/assets/site.css">
${schemas}`;
}

export function robotsTxt(payload) {
  const c = payload.crawlerPolicy;
  const privateRules = ['Disallow: /api/', 'Disallow: /admin/', 'Disallow: /auth/', 'Disallow: /account-deletion', 'Disallow: /en/account-deletion'];
  const group = (agent, allowed) => [`User-agent: ${agent}`, allowed ? 'Allow: /' : 'Disallow: /', ...privateRules, ''];
  const lines = [...group('*', c.mainstreamIndexing), ...group('Googlebot', c.googlebot), ...group('Bingbot', c.bingbot), ...group('OAI-SearchBot', c.oaiSearchBot), 'Sitemap: https://heavyar.com/sitemap.xml'];
  return `${lines.join('\n')}\n`;
}

export function sitemapXml(payload) {
  const pages = payload.pages.filter(p => p.sitemap.include && p.robots === 'index,follow' && p.key !== 'early-access' && p.key !== 'account-deletion');
  const urls = pages.map(p => `<url><loc>${escapeHtml(p.canonical)}</loc>${p.sitemap.lastmod ? `<lastmod>${escapeHtml(p.sitemap.lastmod.slice(0, 10))}</lastmod>` : ''}${p.sitemap.changeFrequency ? `<changefreq>${p.sitemap.changeFrequency}</changefreq>` : ''}${p.sitemap.priority != null ? `<priority>${p.sitemap.priority}</priority>` : ''}</url>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`;
}