import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../src/handler.mjs';
import { fetchWithDeadline } from '../src/deadline.mjs';
import { fallbackPayload } from '../src/fallback.mjs';
import { getSeo, resetSeoCache } from '../src/seo.mjs';

const TEST_DEADLINE_MS = 20;
const TEST_GUARD_MS = 750;
const neverSettles = async () => new Promise(() => {});
const unpublished = async () => Response.json(
  { success: false, errorCode: 'SEO_NOT_PUBLISHED' },
  { status: 404 },
);

async function withinGuard(promise, label) {
  let guard;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        guard = setTimeout(() => reject(new Error(`${label} exceeded test guard`)), TEST_GUARD_MS);
      }),
    ]);
  } finally {
    clearTimeout(guard);
  }
}

function requestOptions(fetcher) {
  return { fetcher, seoTimeoutMs: TEST_DEADLINE_MS, earlyAccessTimeoutMs: TEST_DEADLINE_MS };
}

test('deadline aborts best-effort and safely handles a later upstream rejection', async () => {
  let signal;
  let rejectUpstream;
  const upstream = new Promise((_, reject) => { rejectUpstream = reject; });
  await assert.rejects(
    withinGuard(fetchWithDeadline(async (_url, init) => {
      signal = init.signal;
      return upstream;
    }, 'https://example.test', {}, TEST_DEADLINE_MS, 'test'), 'bounded fetch'),
    error => error?.code === 'UPSTREAM_DEADLINE_EXCEEDED',
  );
  assert.equal(signal.aborted, true);
  rejectUpstream(new Error('late losing rejection'));
  await new Promise(resolve => setImmediate(resolve));
});

test('getSeo hard deadline settles when fetch never settles and ignores AbortSignal', async () => {
  resetSeoCache();
  const result = await withinGuard(getSeo(neverSettles, 1, TEST_DEADLINE_MS), 'getSeo');
  assert.equal(result.source, 'unavailable-fallback');
  assert.ok(result.payload.pages.length > 0);
});

test('SEO pending state clears after timeout so a later request executes normally', async () => {
  resetSeoCache();
  await withinGuard(getSeo(neverSettles, 1, TEST_DEADLINE_MS), 'timed-out getSeo');
  let calls = 0;
  const result = await withinGuard(getSeo(async () => {
    calls += 1;
    return unpublished();
  }, 6_001, TEST_DEADLINE_MS), 'recovered getSeo');
  assert.equal(calls, 1);
  assert.match(result.source, /^audited-baseline:/);
});

test('concurrent getSeo callers share one bounded request and both resolve', async () => {
  resetSeoCache();
  let calls = 0;
  const fetcher = async () => {
    calls += 1;
    return new Promise(() => {});
  };
  const results = await withinGuard(Promise.all([
    getSeo(fetcher, 1, TEST_DEADLINE_MS),
    getSeo(fetcher, 1, TEST_DEADLINE_MS),
  ]), 'concurrent getSeo');
  assert.equal(calls, 1);
  assert.deepEqual(results.map(result => result.source), ['unavailable-fallback', 'unavailable-fallback']);
});

test('homepage returns 200 when only SEO never settles', async () => {
  resetSeoCache();
  const fetcher = async url => String(url).endsWith('/api/seo/published')
    ? new Promise(() => {})
    : Response.json({ enabled: true });
  const response = await withinGuard(handleRequest(new Request('https://heavyar.com/'), {}, requestOptions(fetcher)), 'SEO-stalled home');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-seo-source'), 'unavailable-fallback');
});

test('homepage returns 200 with Early Access disabled when only config never settles', async () => {
  resetSeoCache();
  const fetcher = async url => String(url).endsWith('/api/early-access/config')
    ? new Promise(() => {})
    : unpublished();
  const response = await withinGuard(handleRequest(new Request('https://heavyar.com/'), {}, requestOptions(fetcher)), 'Early-Access-stalled home');
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /data-ea-initial-enabled="false"/);
  assert.match(html, /data-ea-form style="display:none;"/);
});

test('homepage returns 200 when both upstream fetches never settle', async () => {
  resetSeoCache();
  const response = await withinGuard(handleRequest(new Request('https://heavyar.com/'), {}, requestOptions(neverSettles)), 'fully-stalled home');
  assert.equal(response.status, 200);
});

for (const path of ['/support', '/help']) {
  test(`${path} returns 200 when SEO never settles`, async () => {
    resetSeoCache();
    const response = await withinGuard(handleRequest(new Request(`https://heavyar.com${path}`), {}, requestOptions(neverSettles)), `${path} stalled SEO`);
    assert.equal(response.status, 200);
  });
}

test('normal fast published SEO and enabled Early Access behavior is unchanged', async () => {
  resetSeoCache();
  const fetcher = async url => String(url).endsWith('/api/seo/published')
    ? Response.json(fallbackPayload(), { headers: { ETag: '"published-fixture"' } })
    : Response.json({ enabled: true });
  const response = await withinGuard(handleRequest(new Request('https://heavyar.com/'), {}, requestOptions(fetcher)), 'healthy home');
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-seo-source'), 'published');
  assert.match(html, /data-ea-initial-enabled="true"/);
});

test('SEO_NOT_PUBLISHED retains the audited fallback behavior', async () => {
  resetSeoCache();
  const result = await withinGuard(getSeo(unpublished, 1, TEST_DEADLINE_MS), 'unpublished SEO');
  assert.match(result.source, /^audited-baseline:/);
  assert.equal(result.error?.message, 'SEO_NOT_PUBLISHED');
});
