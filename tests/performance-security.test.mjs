import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { handleRequest } from '../src/handler.mjs';
import { resetSeoCache } from '../src/seo.mjs';
import { homepageCacheKey, isHomepageCacheable } from '../_worker.js';

const unpublished = async () => Response.json(
  { success: false, errorCode: 'SEO_NOT_PUBLISHED' },
  { status: 404 },
);

test('cold homepage HTML is synchronous with optional upstream work left in waitUntil', async () => {
  resetSeoCache();
  let seoCalls = 0;
  let earlyAccessCalls = 0;
  const background = [];
  const neverSettles = async url => {
    if (String(url).endsWith('/api/early-access/config')) earlyAccessCalls += 1;
    else seoCalls += 1;
    return new Promise(() => {});
  };
  const started = performance.now();
  const response = await handleRequest(new Request('https://heavyar.com/'), {}, {
    fetcher: neverSettles,
    seoTimeoutMs: 20,
    waitUntil: task => background.push(task),
  });
  const elapsed = performance.now() - started;
  assert.equal(response.status, 200);
  assert.ok(elapsed < 100, `cold HTML took ${elapsed}ms`);
  assert.equal(seoCalls, 1);
  assert.equal(earlyAccessCalls, 0);
  assert.equal(background.length, 1);
  assert.equal(response.headers.get('x-seo-source'), 'audited-fallback');
  assert.match(await response.text(), /data-ea-state="pending"/);
  await Promise.all(background);
});

test('homepage cache keys isolate locales and exclude private or mutating traffic', () => {
  const env = { CF_PAGES_COMMIT_SHA: 'release-test' };
  const ar = homepageCacheKey(new Request('https://heavyar.com/?tracking=1'), env);
  const en = homepageCacheKey(new Request('https://heavyar.com/en/?tracking=2'), env);
  assert.notEqual(ar.url, en.url);
  assert.equal(new URL(ar.url).pathname, '/');
  assert.equal(new URL(en.url).pathname, '/en/');
  assert.match(ar.url, /__release=release-test/);
  assert.equal(isHomepageCacheable(new Request('https://heavyar.com/')), true);
  assert.equal(isHomepageCacheable(new Request('https://heavyar.com/en')), true);
  assert.equal(isHomepageCacheable(new Request('https://heavyar.com/api/private')), false);
  assert.equal(isHomepageCacheable(new Request('https://heavyar.com/', { method: 'POST' })), false);
});

test('public homepage uses deliberate shared-cache policy', async () => {
  resetSeoCache();
  const response = await handleRequest(new Request('https://heavyar.com/'), {}, { fetcher: unpublished });
  assert.equal(response.headers.get('cache-control'), 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
});

test('production HTML centralizes the required document security headers without weakening CSP', async () => {
  resetSeoCache();
  const response = await handleRequest(new Request('https://heavyar.com/privacy'), {}, { fetcher: unpublished });
  assert.equal(response.headers.get('strict-transport-security'), 'max-age=31536000');
  assert.equal(response.headers.get('cross-origin-opener-policy'), 'same-origin');
  assert.equal(response.headers.get('x-xss-protection'), '0');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  assert.equal(response.headers.get('permissions-policy'), 'camera=(), microphone=(), geolocation=()');
  const csp = response.headers.get('content-security-policy');
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.doesNotMatch(csp, /script-src[^;]*(?:\*|'unsafe-inline'|'unsafe-eval')/);
  assert.doesNotMatch(csp, /connect-src[^;]*\s\*(?:\s|;)/);
});

test('HSTS covers production errors and assets but is omitted from local development', async () => {
  const notFound = await handleRequest(new Request('https://heavyar.com/not-a-real-page'));
  assert.equal(notFound.status, 404);
  assert.equal(notFound.headers.get('strict-transport-security'), 'max-age=31536000');

  const env = { ASSETS: { fetch: async () => new Response('body{}', { headers: { 'Content-Type': 'text/css' } }) } };
  const asset = await handleRequest(new Request('https://heavyar.com/assets/site.css'), env);
  assert.equal(asset.headers.get('strict-transport-security'), 'max-age=31536000');
  assert.equal(asset.headers.get('content-security-policy'), null);
  assert.equal(asset.headers.get('cross-origin-opener-policy'), null);

  const development = await handleRequest(new Request('http://localhost:3000/preview/'), {}, {
    basePath: '/preview', fetcher: unpublished,
  });
  assert.equal(development.headers.get('strict-transport-security'), null);
  assert.equal(development.headers.get('x-frame-options'), null);
});

test('landing keeps responsive AVIF/WebP hero delivery and deferred official seal loading', async () => {
  resetSeoCache();
  const html = await (await handleRequest(new Request('https://heavyar.com/'), {}, { fetcher: unpublished })).text();
  const loader = await readFile(new URL('../assets/seal-loader.js', import.meta.url), 'utf8');
  assert.match(html, /<picture><source type="image\/avif"/);
  assert.match(html, /hero-480\.avif 480w/);
  assert.match(html, /hero-768\.webp 768w/);
  assert.match(html, /imagesrcset="\/assets\/images\/hero-480\.avif/);
  assert.match(loader, /requestIdleCallback/);
  assert.match(loader, /window\.addEventListener\('load'/);
  assert.match(loader, /https:\/\/eauthenticate\.saudibusiness\.gov\.sa\/EAuthSealApi\/seal\.js/);
});
