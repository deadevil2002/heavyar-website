import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../src/handler.mjs';
import { resetSeoCache } from '../src/seo.mjs';

const unpublished = async () => Response.json(
  { errorCode: 'SEO_NOT_PUBLISHED' },
  { status: 404 },
);

test('App Store support aliases serve localized Help content for GET and HEAD', async () => {
  for (const [path, locale, direction, content, canonical] of [
    ['/support', 'ar-SA', 'rtl', '<h1>المساعدة</h1>', 'https://heavyar.com/help'],
    ['/en/support', 'en', 'ltr', '<h1>Help</h1>', 'https://heavyar.com/en/help'],
  ]) {
    resetSeoCache();
    const getResponse = await handleRequest(
      new Request(`https://heavyar.com${path}`),
      {},
      { fetcher: unpublished },
    );
    const html = await getResponse.text();
    assert.equal(getResponse.status, 200, `GET ${path}`);
    assert.match(html, new RegExp(`<html lang="${locale}" dir="${direction}">`));
    assert.ok(html.includes(content));
    assert.match(html, /heavyar\.official@gmail\.com/);
    assert.match(html, /class="site-nav"/);
    assert.match(html, /class="site-footer"/);
    assert.match(html, new RegExp(`canonical" href="${canonical.replaceAll('/', '\\/')}"`));

    resetSeoCache();
    const headResponse = await handleRequest(
      new Request(`https://heavyar.com${path}`, { method: 'HEAD' }),
      {},
      { fetcher: unpublished },
    );
    assert.equal(headResponse.status, 200, `HEAD ${path}`);
    assert.equal(await headResponse.text(), '');
  }
});

test('existing Help and Privacy routes remain available', async () => {
  for (const path of ['/help', '/en/help', '/privacy', '/en/privacy']) {
    resetSeoCache();
    const response = await handleRequest(
      new Request(`https://heavyar.com${path}`),
      {},
      { fetcher: unpublished },
    );
    assert.equal(response.status, 200, path);
  }
});
