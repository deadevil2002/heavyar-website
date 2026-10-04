import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../src/handler.mjs';
import { legalSectionCount, renderLegalPage } from '../src/legal-pages.mjs';

const keys = ['terms', 'privacy', 'refund-policy', 'disputes', 'provider-terms', 'driver-terms', 'verification', 'restricted-activities', 'acceptable-use'];

test('comprehensive policy suite has stable section depth and navigation structure', () => {
  assert.ok(legalSectionCount('terms') >= 25);
  assert.ok(legalSectionCount('privacy') >= 20);
  assert.ok(legalSectionCount('refund-policy') >= 10);
  assert.ok(legalSectionCount('provider-terms') >= 12);
  assert.ok(legalSectionCount('driver-terms') >= 10);
  for (const key of keys) {
    for (const locale of ['ar', 'en']) {
      const html = renderLegalPage(key, locale);
      assert.match(html, /class="legal-meta"/);
      assert.match(html, /class="legal-toc"/);
      assert.match(html, /class="legal-related"/);
      assert.match(html, /heavyar\.official@gmail\.com/);
    }
  }
});

test('commercial and payment facts cannot drift into future-state claims', () => {
  const terms = renderLegalPage('terms', 'en');
  const provider = renderLegalPage('provider-terms', 'en');
  const refund = renderLegalPage('refund-policy', 'en');
  assert.match(terms, /current effective commission is 10%/i);
  assert.match(terms, /20% rule is draft only and not active/i);
  assert.match(terms, /Tap&#39;s hosted flow/i);
  assert.match(terms, /does not receive or store the full card number or CVV/i);
  assert.match(terms, /Returning from checkout does not prove success/i);
  assert.match(terms, /Tap Marketplace or Split is not currently enabled or verified/i);
  assert.match(provider, /Tap Marketplace or Split is not enabled or verified/i);
  assert.match(refund, /not automated or operationally complete/i);
  assert.match(refund, /does not promise guaranteed or instant refunds/i);
});

test('privacy and verification preserve current iOS collection boundaries', () => {
  const privacy = renderLegalPage('privacy', 'en');
  const verification = renderLegalPage('verification', 'en');
  assert.match(privacy, /National ID, passport or government identity document/i);
  assert.match(privacy, /Bank-account number, IBAN or payout-bank details/i);
  assert.match(privacy, /Precise geolocation, contacts or microphone data/i);
  assert.match(privacy, /Data for cross-app advertising tracking/i);
  assert.match(verification, /Nafath is not active/i);
  assert.match(verification, /not government endorsement/i);
});

test('mandatory Saudi rights and in-app deletion remain explicit', () => {
  const terms = renderLegalPage('terms', 'en');
  const privacy = renderLegalPage('privacy', 'en');
  const refund = renderLegalPage('refund-policy', 'en');
  assert.match(terms, /laws of the Kingdom of Saudi Arabia/i);
  assert.match(terms, /greater non-waivable statutory right prevails/i);
  assert.match(refund, /greater mandatory right under Saudi law prevails/i);
  assert.match(terms, /Deletion starts in-app from Profile or Settings/i);
  assert.match(privacy, /Deletion starts in-app from Profile or Settings/i);
});

test('all expanded legal routes render in Arabic and English without upstream data', async () => {
  for (const key of keys) {
    for (const prefix of ['', '/en']) {
      const response = await handleRequest(new Request(`https://heavyar.com${prefix}/${key}`));
      const html = await response.text();
      assert.equal(response.status, 200, `${prefix}/${key}`);
      assert.match(html, prefix ? /<html lang="en" dir="ltr">/ : /<html lang="ar-SA" dir="rtl">/);
      assert.match(html, /class="site-footer"/);
      assert.match(html, /heavyar\.official@gmail\.com/);
    }
  }
});

test('legal footer exposes Driver Terms and Acceptable Use in both locales', async () => {
  for (const path of ['/terms', '/en/terms']) {
    const response = await handleRequest(new Request(`https://heavyar.com${path}`));
    const html = await response.text();
    assert.match(html, /href="(?:\/en)?\/driver-terms"/);
    assert.match(html, /href="(?:\/en)?\/acceptable-use"/);
  }
});
