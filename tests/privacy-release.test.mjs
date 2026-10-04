import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLegalPage } from '../src/legal-pages.mjs';

test('public privacy policy matches the current iOS collection boundary', () => {
  const english = renderLegalPage('privacy', 'en');
  assert.match(english, /National ID, passport or government identity document/i);
  assert.match(english, /Bank-account number, IBAN or payout-bank details/i);
  assert.match(english, /Tap in a hosted flow/i);
  assert.match(english, /does not store the full card number or CVV/i);
  assert.match(english, /commercial-registration number/i);
  assert.doesNotMatch(english, /We may process identity, contact, profile/i);

  const arabic = renderLegalPage('privacy', 'ar-SA');
  assert.match(arabic, /هوية وطنية أو جواز سفر أو مستند هوية حكومي/);
  assert.match(arabic, /رقم حساب بنكي أو IBAN/);
  assert.match(arabic, /لا تخزن Heavyar رقم البطاقة الكامل أو CVV/);
});
