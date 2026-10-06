import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../src/handler.mjs';
import { resetSeoCache } from '../src/seo.mjs';

const unpublished = async () => Response.json(
  { errorCode: 'SEO_NOT_PUBLISHED' },
  { status: 404 },
);

test('App Store support aliases serve the complete localized Support Center for GET and HEAD', async () => {
  for (const [path, locale, direction, title, canonical] of [
    ['/support', 'ar-SA', 'rtl', 'كيف نقدر نساعدك؟', 'https://heavyar.com/help'],
    ['/en/support', 'en', 'ltr', 'How can we help?', 'https://heavyar.com/en/help'],
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
    assert.ok(html.includes(`<h1>${title}</h1>`));
    assert.match(html, /heavyar\.official@gmail\.com/);
    assert.match(html, /href="mailto:heavyar\.official@gmail\.com"/);
    assert.match(html, /class="site-nav"/);
    assert.match(html, /class="site-footer"/);
    assert.match(html, new RegExp(`canonical" href="${canonical.replaceAll('/', '\\/')}"`));
    assert.equal(getResponse.headers.get('x-robots-tag'), 'index,follow');
    assert.equal(getResponse.headers.get('strict-transport-security'), 'max-age=31536000');
    assert.equal(getResponse.headers.get('cross-origin-opener-policy'), 'same-origin');
    assert.equal(getResponse.headers.get('x-xss-protection'), '0');

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

test('Support Center exposes role help, safety, policies, and FAQ without collecting credentials or payment data', async () => {
  const pages = [
    {
      path: '/support',
      required: ['دعم Heavyar', 'تواصل معنا', 'الحساب وتسجيل الدخول', 'المعدات وطلبات التأجير', 'مقدمو المعدات', 'السائقون والمشغلون', 'الدفع والإلغاء والاسترجاع', 'الخصوصية وإدارة الحساب', 'حذف الحساب', 'السلامة والإبلاغ عن مشكلة', 'الملاحظات واقتراحات التطوير', 'الأسئلة الشائعة', 'رقم الدعم', '+966570758881', 'العنوان التجاري', 'الجبيل 35513'],
    },
    {
      path: '/en/support',
      required: ['Heavyar Support', 'Contact us', 'Account &amp; sign-in', 'Equipment &amp; rental requests', 'Equipment providers', 'Drivers &amp; operators', 'Payments, cancellations &amp; refunds', 'Privacy &amp; account management', 'Account Deletion', 'Safety &amp; reporting an issue', 'Feedback &amp; feature requests', 'Frequently asked questions', 'Support phone', '+966570758881', 'Business address', 'Jubail 35513, Saudi Arabia'],
    },
  ];
  for (const page of pages) {
    resetSeoCache();
    const response = await handleRequest(new Request(`https://heavyar.com${page.path}`), {}, { fetcher: unpublished });
    const html = await response.text();
    for (const text of page.required) assert.ok(html.includes(text), `${page.path}: ${text}`);
    for (const target of ['privacy', 'account-deletion', 'refund-policy', 'disputes', 'acceptable-use']) {
      const prefix = page.path.startsWith('/en/') ? '/en' : '';
      assert.match(html, new RegExp(`href="${prefix}/${target}"`));
    }
    assert.doesNotMatch(html, /<input\b/i);
    assert.doesNotMatch(html, /<form\b/i);
    assert.doesNotMatch(html, /name=["'](?:password|otp|cvv|card|governmentId|nationalId|iban)["']/i);
    assert.match(html, /href="tel:\+966570758881"/);
    assert.match(html, /7050191290/);
    assert.match(html, /dgp\.sdaia\.gov\.sa/);
    assert.match(html, /class="sbc-verify-seal"/);
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
