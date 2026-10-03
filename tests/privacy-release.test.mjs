import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLegalPage } from '../src/legal-pages.mjs';

test('public privacy policy matches the current iOS collection boundary', () => {
  const english = renderLegalPage('privacy', 'en');
  assert.match(english, /does not request a national-ID or passport number/i);
  assert.match(english, /bank-account number, IBAN, or payout-bank details/i);
  assert.match(english, /Tap&#39;s hosted experience/i);
  assert.match(english, /does not store card numbers or CVV/i);
  assert.match(english, /commercial-registration number/i);
  assert.doesNotMatch(english, /We may process identity, contact, profile/i);

  const arabic = renderLegalPage('privacy', 'ar-SA');
  assert.match(arabic, /لا يطلب إصدار iOS الحالي رقم هوية وطنية/);
  assert.match(arabic, /رقم حساب بنكي أو IBAN/);
  assert.match(arabic, /لا تخزن Heavyar رقم البطاقة أو رمز CVV/);
});
