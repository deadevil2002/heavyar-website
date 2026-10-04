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
  assert.equal(response.headers.get('x-seo-source'), 'audited-fallback');
});

test('homepage never calls Early Access config before returning pending hydration HTML', async () => {
  resetSeoCache();
  let configCalls = 0;
  const fetcher = async url => {
    if (String(url).endsWith('/api/early-access/config')) {
      configCalls += 1;
      return new Promise(() => {});
    }
    return unpublished();
  };
  const response = await withinGuard(handleRequest(new Request('https://heavyar.com/'), {}, requestOptions(fetcher)), 'Early-Access-stalled home');
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.equal(configCalls, 0);
  assert.match(html, /data-ea-state="pending"/);
  assert.match(html, /data-ea-form aria-hidden="true" inert/);
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

test('published SEO refreshes after the non-blocking first render', async () => {
  resetSeoCache();
  const background = [];
  const fetcher = async url => String(url).endsWith('/api/seo/published')
    ? Response.json(fallbackPayload(), { headers: { ETag: '"published-fixture"' } })
    : Response.json({ enabled: true });
  const options = { ...requestOptions(fetcher), waitUntil: task => background.push(task) };
  const first = await withinGuard(handleRequest(new Request('https://heavyar.com/'), {}, options), 'healthy home');
  assert.equal(first.status, 200);
  assert.equal(first.headers.get('x-seo-source'), 'audited-fallback');
  assert.match(await first.text(), /data-ea-state="pending"/);
  await Promise.all(background);
  const refreshed = await handleRequest(new Request('https://heavyar.com/'), {}, options);
  assert.equal(refreshed.headers.get('x-seo-source'), 'published');
});

test('SEO_NOT_PUBLISHED retains the audited fallback behavior', async () => {
  resetSeoCache();
  const result = await withinGuard(getSeo(unpublished, 1, TEST_DEADLINE_MS), 'unpublished SEO');
  assert.match(result.source, /^audited-baseline:/);
  assert.equal(result.error?.message, 'SEO_NOT_PUBLISHED');
});
