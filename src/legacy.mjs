import { escapeHtml } from './seo.mjs';
import { LEGACY_SOURCES } from './legacy-source.mjs';

const FILES = { privacy: 'privacy.html', terms: 'terms.html', 'account-deletion': 'delete-account.html' };
export const LEGACY_SOURCE_SHA256 = {
  privacy: '60d5405b671df6f3ef8cd5b61b6f86047608ce696042f319f99616fa907790e9',
  terms: '11e5767fa9757efd6a42be1ccb8194fd7f23121eaa513afc4dbe5108d1e6a202',
  'account-deletion': '7f08eb0e03d89601775c0b8f4e5f4f4acad7a5cca340581cac0b97259e4d5325',
};
export const legacyFilename = key => FILES[key] || null;
export const legacySource = key => LEGACY_SOURCES[FILES[key]] || null;

function attr(attrs, name) {
  const match = attrs.match(new RegExp(`\\b${name}=(["'])([\\s\\S]*?)\\1`, 'i'));
  return match?.[2] || '';
}

function localize(html, locale) {
  const key = locale === 'en' ? 'en' : 'ar';
  return html.replace(/<([a-z][\w-]*)([^>]*\bdata-ar=(?:"[^"]*"|'[^']*')[^>]*\bdata-en=(?:"[^"]*"|'[^']*')[^>]*)>([^<]*)<\/\1>/gi, (all, tag, attrs) => {
    const value = attr(attrs, `data-${key}`);
    if (!value) return all;
    const safeAttrs = attrs.replace(/\sdata-(?:ar|en)=(?:"[^"]*"|'[^']*')/gi, '');
    return `<${tag}${safeAttrs}>${escapeHtml(value)}</${tag}>`;
  }).replace(/\sdata-(?:ar|en)=(?:"[^"]*"|'[^']*')/gi, '');
}

function cleanLinks(html, locale) {
  const prefix = locale === 'en' ? '/en' : '';
  const map = { 'index.html': `${prefix}/`, 'privacy.html': `${prefix}/privacy`, 'terms.html': `${prefix}/terms`, 'delete-account.html': `${prefix}/account-deletion`, 'faq.html': `${prefix}/help` };
  return html.replace(/\bhref=(["'])([^"']+)\1/gi, (all, quote, href) => map[href] ? `href=${quote}${map[href]}${quote}` : all);
}

export async function renderLegacy(key, locale, source) {
  if (!FILES[key]) throw new Error('Unsupported legacy page');
  if (typeof source !== 'string' || source.length < 100) throw new Error(`Missing preserved source for ${FILES[key]}`);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  const actual = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  if (actual !== LEGACY_SOURCE_SHA256[key]) throw new Error(`Preserved source integrity check failed for ${FILES[key]}`);
  const pattern = key === 'account-deletion' ? /<main\b[\s\S]*?<\/main>/i : /<div class="legal-page">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i;
  const body = source.match(pattern)?.[0];
  if (!body) throw new Error(`Could not isolate ${FILES[key]}`);
  const sanitized = body
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\b(?:javascript|data):/gi, '');
  const localized = cleanLinks(localize(sanitized, locale), locale);
  if (locale === 'en' && key !== 'account-deletion') {
    const documentName = key === 'privacy' ? 'Privacy Policy' : 'Terms of Service';
    return `<p class="legal-language-note">The preserved ${documentName} is currently available in Arabic. The original text appears below without alteration.</p><div lang="ar" dir="rtl">${localized}</div>`;
  }
  return localized;
}

const DOCUMENT_ROUTES = {
  'index.html': '/',
  'privacy.html': '/privacy',
  'terms.html': '/terms',
  'delete-account.html': '/account-deletion',
  'refund.html': '/refund',
  'safety.html': '/safety',
  'providers-terms.html': '/providers-terms',
  'faq.html': '/faq',
  'contact.html': '/contact',
};

export function renderPreservedDocument(filename) {
  const source = LEGACY_SOURCES[filename];
  if (!source) throw new Error(`Missing preserved source for ${filename}`);
  return source.replace(/\b(href|src)=(["'])([^"'#]+)\2/gi, (all, name, quote, value) => {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) return all;
    const [path, suffix = ''] = value.split(/(?=[?#])/);
    const target = DOCUMENT_ROUTES[path] || (path.startsWith('/') ? path : `/${path}`);
    return `${name}=${quote}${target}${suffix}${quote}`;
  });
}