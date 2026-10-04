import { handleRequest } from './src/handler.mjs';

export function isHomepageCacheable(request) {
  const url = new URL(request.url);
  const path = url.pathname === '/en' ? '/en/' : url.pathname;
  return request.method === 'GET' && (path === '/' || path === '/en/');
}

export function homepageCacheKey(request, env = {}) {
  const url = new URL(request.url);
  const path = url.pathname === '/en' ? '/en/' : url.pathname;
  const release = env.CF_PAGES_COMMIT_SHA || 'local';
  const cacheUrl = new URL(`https://heavyar.com${path}`);
  cacheUrl.searchParams.set('__release', release);
  return new Request(cacheUrl, { method: 'GET' });
}

export default {
  async fetch(request, env, ctx) {
    const cacheable = isHomepageCacheable(request);
    const cache = globalThis.caches?.default;
    if (!cacheable || !cache) return handleRequest(request, env, { executionContext: ctx });

    // caches.default is intentionally a short-lived, data-center-local HTML
    // cache. The deployment SHA prevents an older release surviving a deploy.
    const cacheKey = homepageCacheKey(request, env);
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const response = await handleRequest(request, env, { executionContext: ctx });
    if (response.ok && response.headers.get('Cache-Control')?.includes('s-maxage=')) {
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }
    return response;
  },
};
