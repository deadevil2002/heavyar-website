import { renderHome, renderSiteFooter, renderSiteHeader, renderSiteScripts } from './site.mjs';
import { getSeo, getSeoSnapshot, LEGACY_ROUTES, pageFor, renderHead, robotsTxt, ROUTES, sitemapXml, escapeHtml } from './seo.mjs';
import { FALLBACK_REASON } from './fallback.mjs';
import { renderPreservedBody } from './legacy.mjs';
import { hasLegalPage, renderLegalPage } from './legal-pages.mjs';

const API_ORIGIN = 'https://heavyar-api.heavyar-official.workers.dev';
const API_RULES = {
  '/api/early-access/config': ['GET', 'HEAD'],
  '/api/early-access/register': ['POST'],
};
const STATIC_FILES = new Set([
  '/styles.css', '/script.js', '/site.webmanifest',
  '/favicon.ico',
  '/refund.html', '/safety.html', '/providers-terms.html', '/contact.html',
]);
const PRESERVED_DOCUMENT_ROUTES = {
  '/refund': 'refund.html', '/refund.html': 'refund.html',
  '/safety': 'safety.html', '/safety.html': 'safety.html',
  '/providers-terms': 'providers-terms.html', '/providers-terms.html': 'providers-terms.html',
  '/faq': 'faq.html', '/faq.html': 'faq.html',
  '/contact': 'contact.html', '/contact.html': 'contact.html',
};
const text = (body, status = 200, type = 'text/plain; charset=utf-8', extra = {}) => new Response(body, { status, headers: { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', ...extra } });
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; frame-src https://heavyar-app.firebaseapp.com https://eauthenticate.saudibusiness.gov.sa; form-action 'self'; script-src 'self' https://www.gstatic.com https://static.cloudflareinsights.com https://eauthenticate.saudibusiness.gov.sa; connect-src 'self' https://heavyar-api.heavyar-official.workers.dev https://*.googleapis.com https://cloudflareinsights.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-XSS-Protection': '0',
};
function pageSecurityHeaders(development = false) {
  if (!development) return securityHeaders;
  const { 'X-Frame-Options': _frameOptions, ...developmentHeaders } = securityHeaders;
  return {
    ...developmentHeaders,
    'Content-Security-Policy': securityHeaders['Content-Security-Policy'].replace("frame-ancestors 'none'; ", ''),
  };
}

function typographyHead(locale) {
  const family = locale === 'ar-SA'
    ? 'IBM+Plex+Sans+Arabic:wght@400;500;600;700'
    : 'IBM+Plex+Sans:wght@400;500;600;700';
  return `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${family}&amp;display=swap">`;
}

function secureResponse(request, response, development = false) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  const url = new URL(request.url);
  if (!development && url.protocol === 'https:') {
    // Intentionally omit includeSubDomains and preload: the public DNS
    // namespace cannot be proven exhaustively safe from repository state.
    headers.set('Strict-Transport-Security', 'max-age=31536000');
  }
  if ((headers.get('Content-Type') || '').toLowerCase().startsWith('text/html')) {
    for (const [name, value] of Object.entries(pageSecurityHeaders(development))) headers.set(name, value);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function shell(locale, head, body, key) {
  const dir = locale === 'ar-SA' ? 'rtl' : 'ltr';
  return `<!doctype html><html lang="${locale}" dir="${dir}"><head>${typographyHead(locale)}${head}</head><body>${body}</body></html>`;
}

function brandedPage(locale, key, content) {
  const siteLocale = locale === 'en' ? 'en' : 'ar-SA';
  return `${renderSiteHeader(siteLocale, { key })}${content}${renderSiteFooter(siteLocale)}${renderSiteScripts()}`;
}

function routeBody(key, locale, page) {
  const ar = locale === 'ar-SA';
  const sections = {
    about: ar ? ['عن Heavyar', 'Heavyar منصة سوق للمعدات الثقيلة تربط العملاء ومقدمي المعدات والسائقين، وتساعدهم على البحث وإدارة الطلبات والتنسيق بكفاءة.'] : ['About Heavyar', 'Heavyar is a heavy-equipment marketplace platform connecting customers, equipment providers, and drivers for discovery, request management, and efficient coordination.'],
    equipment: ar ? ['اكتشف المعدات', 'استكشف فئات المعدات المعتمدة مثل الحفارات والرافعات واللوادر والجرافات والشاحنات والمولدات والضواغط ومعدات الخرسانة، دون عرض مخزون أو أعداد غير موثقة.'] : ['Discover equipment', 'Explore established categories such as excavators, cranes, loaders, bulldozers, trucks, generators, compressors, and concrete equipment, without unverified inventory or counts.'],
    drivers: ar ? ['اكتشاف السائقين', 'ابحث عن سائقي المعدات حسب القدرات والموقع والتوفر، ثم أرسل طلباً عبر مسار آمن دون كشف بيانات الاتصال للعامة.'] : ['Driver discovery', 'Find equipment drivers by capability, location, and availability, then use a secure request flow without exposing contact details publicly.'],
    help: ar ? ['كيف يمكننا مساعدتك؟', 'تعرّف على المنصة أو تواصل مع الدعم العام عبر heavyar.official@gmail.com.'] : ['How can we help?', 'Learn about the platform or contact public support at heavyar.official@gmail.com.'],
    'early-access': ar ? ['الوصول المبكر', 'يظهر نموذج التسجيل هنا فقط عندما تفعّل Heavyar الوصول المبكر.'] : ['Early access', 'Registration appears here only when Heavyar enables early access.'],
  };
  const [, description] = sections[key];
  const heading = page.heading;
  const faqs = page.faqs.length ? `<section class="route-faq"><h2>${ar ? 'الأسئلة الشائعة' : 'Frequently asked questions'}</h2>${page.faqs.map(f => `<details><summary>${escapeHtml(f.question)}</summary><p>${escapeHtml(f.answer)}</p></details>`).join('')}</section>` : '';
  return `<main class="content-page" id="main-content"><header class="inner-hero"><div class="site-container inner-hero-copy"><p class="eyebrow eyebrow-light">Heavyar</p><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(description)}</p></div></header><div class="site-container route-content">${key === 'early-access' ? '<section id="early-access-root" data-early-access="false" hidden></section>' : ''}${faqs}</div></main>`;
}

const supportIcon = (name) => {
  const paths = {
    mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
    account: '<circle cx="12" cy="8" r="3.25"/><path d="M5.5 20c.4-4 2.6-6 6.5-6s6.1 2 6.5 6"/>',
    equipment: '<path d="M4 16.5h11.5l2.5-4.8h-5l-2-5H7.5L5.8 12H4z"/><path d="M8 6.7 9.5 3H14l2 4.5M6.5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm9 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>',
    provider: '<path d="M4 9h16v11H4zM7 9V5h10v4M8 14h8M8 17h5"/>',
    driver: '<circle cx="12" cy="8" r="3.25"/><path d="M5.5 20c.4-4 2.6-6 6.5-6s6.1 2 6.5 6"/><path d="M9 17h6"/>',
    payment: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h3"/>',
    privacy: '<path d="M12 3 5 6v5c0 4.7 2.6 8 7 10 4.4-2 7-5.3 7-10V6z"/><path d="m9 12 2 2 4-4"/>',
    shield: '<path d="M12 3 5 6v5c0 4.7 2.6 8 7 10 4.4-2 7-5.3 7-10V6z"/><path d="m9 12 2 2 4-4"/>',
    safety: '<path d="M12 3 2.8 20h18.4z"/><path d="M12 9v4m0 3h.01"/>',
    feedback: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  };
  return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.feedback}</svg>`;
};

function renderSupportPage(locale) {
  const en = locale === 'en';
  const path = value => en ? `/en${value}` : value;
  const pick = (ar, english) => en ? english : ar;
  const email = 'heavyar.official@gmail.com';
  const topics = [
    {
      icon: 'account',
      title: pick('الحساب وتسجيل الدخول', 'Account & sign-in'),
      items: en ? ['Registration and account setup', 'Sign-in assistance', 'Password reset from the login screen', 'Profile and settings'] : ['التسجيل وإعداد الحساب', 'المساعدة في تسجيل الدخول', 'إعادة تعيين كلمة المرور من شاشة الدخول', 'الملف الشخصي والإعدادات'],
    },
    {
      icon: 'equipment',
      title: pick('المعدات وطلبات التأجير', 'Equipment & rental requests'),
      items: en ? ['Finding suitable equipment', 'Creating a rental request', 'Availability and dates', 'Following request status in the app'] : ['البحث عن المعدة المناسبة', 'إنشاء طلب تأجير', 'التوافر والتواريخ', 'متابعة حالة الطلب داخل التطبيق'],
    },
    {
      icon: 'provider',
      title: pick('مقدمو المعدات', 'Equipment providers'),
      items: en ? ['Provider account setup', 'Equipment listings', 'Availability management', 'Incoming rental requests'] : ['إعداد حساب مقدم الخدمة', 'إدارة عروض المعدات', 'تحديث التوافر', 'طلبات التأجير الواردة'],
      links: [[path('/provider-terms'), pick('شروط مقدمي الخدمة', 'Provider Terms')]],
    },
    {
      icon: 'driver',
      title: pick('السائقون والمشغلون', 'Drivers & operators'),
      items: en ? ['Driver profile', 'Availability status', 'Driver requests', 'Driver workflow'] : ['ملف السائق', 'حالة التوافر', 'طلبات السائقين', 'مسار عمل السائق'],
      links: [[path('/driver-terms'), pick('شروط السائقين', 'Driver Terms')]],
    },
    {
      icon: 'payment',
      title: pick('الدفع والإلغاء والاسترجاع', 'Payments, cancellations & refunds'),
      text: pick('عندما يتوفر الدفع في المسار المطبق، يتم عبر صفحة دفع Tap المستضافة. لا تطلب Heavyar رقم البطاقة الكامل أو رمز CVV عبر البريد. تخضع طلبات الإلغاء والاسترجاع للمراجعة وفق السياسة، وقد يتطلب التنفيذ معالجة يدوية.', 'When payment is available in the applicable flow, it uses Tap hosted checkout. Heavyar never asks for your full card number or CVV by email. Cancellation and refund requests are reviewed under the policy, and execution may require manual processing.'),
      links: [[path('/refund-policy'), pick('سياسة الإلغاء والاسترجاع', 'Cancellation & Refund Policy')], [path('/disputes'), pick('الشكاوى والنزاعات', 'Complaints & Disputes')]],
    },
    {
      icon: 'privacy',
      title: pick('الخصوصية وإدارة الحساب', 'Privacy & account management'),
      text: pick('راجع حقوق الخصوصية وإدارة البيانات. يبدأ طلب حذف الحساب من داخل تطبيق Heavyar بعد تسجيل الدخول، ولا توجد حقول دخول أو حذف للحساب على هذه الصفحة.', 'Review privacy rights and data management. Account deletion starts inside the authenticated Heavyar app; this page has no sign-in or account-deletion credential fields.'),
      links: [[path('/privacy'), pick('سياسة الخصوصية', 'Privacy Policy')], [path('/account-deletion'), pick('تعليمات حذف الحساب', 'Account Deletion Instructions')]],
    },
    {
      icon: 'safety',
      title: pick('السلامة والإبلاغ عن مشكلة', 'Safety & reporting an issue'),
      text: pick('أبلغنا عن عرض مشبوه، أو سلوك غير مناسب، أو حادث مرتبط بطلب، أو مخالفة للسياسات. أرسل رقم الطلب إن وجد ووصفًا موجزًا دون مشاركة بيانات حساسة.', 'Report a suspicious listing, inappropriate behavior, a request-related incident, or a policy violation. Include the request number if available and a concise description without sensitive data.'),
      links: [[path('/acceptable-use'), pick('الاستخدام المقبول', 'Acceptable Use')], [path('/restricted-activities'), pick('الأنشطة المقيدة', 'Restricted Activities')]],
      notice: pick('في الحالات الطارئة أو التي تهدد السلامة، تواصل مع الجهات المختصة مباشرة.', 'For emergencies or immediate safety threats, contact the appropriate authorities directly.'),
    },
    {
      icon: 'feedback',
      title: pick('الملاحظات واقتراحات التطوير', 'Feedback & feature requests'),
      text: pick('نرحب بملاحظاتك حول تجربة Heavyar واقتراحات تحسين التطبيق والميزات المستقبلية.', 'We welcome feedback about the Heavyar experience and suggestions for improving the app and future features.'),
      links: [[`mailto:${email}`, pick('أرسل ملاحظتك عبر البريد', 'Email your feedback')]],
    },
  ];
  const faqs = en ? [
    ['How do I contact Heavyar Support?', `Email ${email}. Include a brief description and the request number, if one exists. Never send a password, OTP, full card number, or CVV.`],
    ['How do I delete my account?', 'Open the Heavyar app, sign in, then go to Profile or Settings and select Delete account. Read the public Account Deletion Instructions for more information.'],
    ['I forgot my password. What should I do?', 'From the Heavyar login screen, enter the email address or supported phone number associated with your account and use Forgot password. Follow the recovery message shown by the app.'],
    ['How do I follow a rental request?', 'Sign in to the Heavyar app and open Requests. Select the relevant request to review its current status and available actions.'],
    ['How do I report an equipment or user issue?', 'Email Heavyar Support with the request or listing reference, a concise description, and only the evidence needed to understand the issue. Contact the appropriate authorities directly for emergencies.'],
    ['How do I request a payment or refund review?', 'Contact Support with the request number, payment date, amount, reason, and relevant evidence. Eligibility is reviewed under the Cancellation & Refund Policy; refunds are not promised as automatic or immediate.'],
    ['Should I send card details or a verification code to Support?', 'No. Never email your password, OTP, full card number, or CVV. Heavyar does not need those details to review a support request.'],
  ] : [
    ['كيف أتواصل مع دعم Heavyar؟', `راسلنا عبر ${email}، وأرسل وصفًا مختصرًا للمشكلة ورقم الطلب إن وجد. لا ترسل كلمة المرور أو رمز التحقق أو رقم البطاقة الكامل أو CVV.`],
    ['كيف أحذف حسابي؟', 'افتح تطبيق Heavyar وسجّل الدخول، ثم انتقل إلى الملف الشخصي أو الإعدادات واختر حذف الحساب. راجع صفحة تعليمات حذف الحساب لمزيد من المعلومات.'],
    ['نسيت كلمة المرور، ماذا أفعل؟', 'من شاشة تسجيل الدخول في تطبيق Heavyar، أدخل البريد الإلكتروني أو رقم الجوال المدعوم المرتبط بحسابك، ثم استخدم خيار نسيت كلمة المرور واتبع رسالة الاسترداد التي يعرضها التطبيق.'],
    ['كيف أتابع طلب تأجير؟', 'سجّل الدخول إلى تطبيق Heavyar وافتح قسم الطلبات، ثم اختر الطلب المطلوب لمراجعة حالته الحالية والإجراءات المتاحة.'],
    ['كيف أبلغ عن مشكلة في معدة أو مستخدم؟', 'راسل دعم Heavyar مع مرجع الطلب أو العرض، ووصف موجز، والأدلة اللازمة فقط لفهم المشكلة. تواصل مع الجهات المختصة مباشرة في الحالات الطارئة.'],
    ['كيف أطلب مراجعة عملية دفع أو استرجاع؟', 'تواصل مع الدعم وأرسل رقم الطلب وتاريخ الدفع والمبلغ والسبب والأدلة ذات الصلة. تراجع الأهلية وفق سياسة الإلغاء والاسترجاع، ولا يُضمن استرجاع آلي أو فوري.'],
    ['هل أرسل بيانات البطاقة أو رمز التحقق للدعم؟', 'لا. لا ترسل كلمة المرور أو رمز التحقق OTP أو رقم البطاقة الكامل أو CVV عبر البريد. لا تحتاج Heavyar هذه البيانات لمراجعة طلب الدعم.'],
  ];
  const quickLinks = [
    [path('/privacy'), pick('سياسة الخصوصية', 'Privacy Policy')],
    [path('/terms'), pick('شروط الاستخدام', 'Terms of Service')],
    [path('/account-deletion'), pick('حذف الحساب', 'Account Deletion')],
    [path('/refund-policy'), pick('الإلغاء والاسترجاع', 'Cancellation & Refunds')],
    [path('/disputes'), pick('الشكاوى والنزاعات', 'Complaints & Disputes')],
    [path('/provider-terms'), pick('شروط مقدمي الخدمة', 'Provider Terms')],
    [path('/driver-terms'), pick('شروط السائقين', 'Driver Terms')],
    [path('/acceptable-use'), pick('الاستخدام المقبول', 'Acceptable Use')],
  ];
  const topicCards = topics.map(topic => `<article class="support-topic-card"><span class="support-topic-icon">${supportIcon(topic.icon)}</span><h3>${escapeHtml(topic.title)}</h3>${topic.text ? `<p>${escapeHtml(topic.text)}</p>` : ''}${topic.items ? `<ul>${topic.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}${topic.notice ? `<p class="support-topic-notice">${escapeHtml(topic.notice)}</p>` : ''}${topic.links ? `<div class="support-topic-links">${topic.links.map(([href, label]) => `<a href="${href}">${escapeHtml(label)} ${supportIcon('arrow')}</a>`).join('')}</div>` : ''}</article>`).join('');
  const faqItems = faqs.map(([question, answer]) => `<details class="support-faq-item"><summary>${escapeHtml(question)}</summary><div><p>${escapeHtml(answer)}</p></div></details>`).join('');
  return `<main class="content-page support-page" id="main-content"><header class="inner-hero support-hero"><div class="site-container support-hero-grid"><div class="inner-hero-copy"><p class="eyebrow eyebrow-light">${pick('دعم Heavyar', 'Heavyar Support')}</p><h1>${pick('كيف نقدر نساعدك؟', 'How can we help?')}</h1><p>${pick('مركز الدعم لمستخدمي Heavyar من العملاء ومقدمي المعدات والسائقين. اختر نوع المساعدة أو تواصل معنا مباشرة.', 'Support for Heavyar customers, equipment providers, and drivers. Choose a help topic or contact us directly.')}</p><div class="support-hero-actions"><a class="btn btn-primary" href="mailto:${email}">${supportIcon('mail')} ${pick('تواصل مع الدعم', 'Contact Support')}</a><a class="btn btn-ghost" href="#support-topics">${pick('استعرض مواضيع الدعم', 'Browse help topics')}</a></div></div><aside class="support-hero-proof" aria-label="${pick('معلومات مركز الدعم', 'Support Center information')}"><span>${supportIcon('shield')}</span><strong>${pick('صفحة الدعم الرسمية لـ Heavyar', 'Official Heavyar Support Center')}</strong><p>${pick('مساعدة عامة ومتخصصة دون الحاجة إلى تسجيل الدخول في الموقع.', 'General and role-specific help without requiring a website login.')}</p></aside></div></header><div class="site-container support-layout"><section class="support-contact-card" aria-labelledby="support-contact-title"><div class="support-contact-main"><span class="support-contact-icon">${supportIcon('mail')}</span><div><p class="support-section-kicker">${pick('قناة الدعم المباشرة', 'Direct support channel')}</p><h2 id="support-contact-title">${pick('تواصل معنا', 'Contact us')}</h2><p>${pick('عند التواصل معنا، أرسل وصفًا مختصرًا للمشكلة ورقم الطلب إن وجد.', 'When contacting us, include a brief description of the issue and the request number, if available.')}</p><a class="support-email" href="mailto:${email}" aria-label="${pick('إرسال بريد إلكتروني إلى دعم Heavyar', 'Email Heavyar Support')}"><bdi dir="ltr">${email}</bdi> ${supportIcon('arrow')}</a><p class="support-response-note">${pick('نعمل على مراجعة رسائل الدعم والشكاوى بأسرع وقت ممكن حسب طبيعة الحالة.', 'We review support requests and complaints as promptly as possible based on the nature of the case.')}</p></div></div><aside class="support-safety-note" aria-labelledby="support-safety-title"><span>${supportIcon('safety')}</span><div><h3 id="support-safety-title">${pick('احمِ بياناتك', 'Protect your information')}</h3><p>${pick('لن نطلب منك عبر البريد:', 'Never send by email:')}</p><ul><li>${pick('كلمة المرور', 'Password')}</li><li>${pick('رمز التحقق OTP', 'Verification code / OTP')}</li><li>${pick('رقم البطاقة الكامل', 'Full card number')}</li><li>CVV</li></ul><p>${pick('لا تحتاج Heavyar هذه البيانات لمعالجة طلب الدعم.', 'Heavyar never needs those details to handle a support request.')}</p></div></aside></section><section class="support-topics" id="support-topics" aria-labelledby="support-topics-title"><div class="support-section-heading"><p class="support-section-kicker">${pick('اختر نوع المساعدة', 'Choose a help topic')}</p><h2 id="support-topics-title">${pick('كيف يمكننا مساعدتك؟', 'What can we help with?')}</h2><p>${pick('معلومات عملية تغطي أهم مسارات التطبيق لجميع أدوار منصة Heavyar.', 'Practical guidance covering the main app workflows for every Heavyar role.')}</p></div><div class="support-topic-grid">${topicCards}</div></section><section class="support-quick-links" aria-labelledby="support-links-title"><div><p class="support-section-kicker">${pick('سياسات وتعليمات', 'Policies & instructions')}</p><h2 id="support-links-title">${pick('روابط مهمة', 'Useful links')}</h2></div><nav aria-label="${pick('روابط الدعم المهمة', 'Useful support links')}">${quickLinks.map(([href, label]) => `<a href="${href}">${escapeHtml(label)} ${supportIcon('arrow')}</a>`).join('')}</nav></section><section class="support-faq" aria-labelledby="support-faq-title"><div class="support-section-heading"><p class="support-section-kicker">${pick('إجابات مباشرة', 'Direct answers')}</p><h2 id="support-faq-title">${pick('الأسئلة الشائعة', 'Frequently asked questions')}</h2></div><div class="support-faq-list">${faqItems}</div></section><section class="support-business" aria-labelledby="support-business-title"><div><p class="support-section-kicker">${pick('عن مركز الدعم', 'About Heavyar Support')}</p><h2 id="support-business-title">Heavyar</h2><p>${pick('منصة سوق سعودية للمعدات الثقيلة تربط العملاء ومقدمي المعدات والسائقين.', 'A Saudi heavy-equipment marketplace connecting customers, equipment providers, and drivers.')}</p></div><dl><div><dt>${pick('البريد الإلكتروني', 'Support email')}</dt><dd><a href="mailto:${email}"><bdi dir="ltr">${email}</bdi></a></dd></div><div><dt>${pick('رقم الدعم', 'Support phone')}</dt><dd><a href="tel:+966570758881"><bdi dir="ltr">+966570758881</bdi></a></dd></div><div><dt>${pick('السجل التجاري', 'Commercial Registration')}</dt><dd><bdi dir="ltr">7050191290</bdi></dd></div><div><dt>${pick('العنوان التجاري', 'Business address')}</dt><dd>${pick('الجبيل 35513', 'Jubail 35513, Saudi Arabia')}</dd></div></dl></section></div></main>`;
}

function accountDeletionInformation(locale) {
  const ar = locale === 'ar-SA';
  const copy = ar ? {
    eyebrow: 'إدارة الحساب',
    title: 'حذف حساب Heavyar',
    intro: 'يمكنك طلب حذف حسابك مباشرة من تطبيق Heavyar. لا ترسل كلمة المرور أو بيانات الدخول عبر البريد الإلكتروني أو الدعم.',
    stepsTitle: 'طريقة طلب حذف الحساب',
    steps: [
      'افتح تطبيق Heavyar.',
      'سجّل الدخول إلى حسابك.',
      'افتح «الملف الشخصي» أو «الإعدادات».',
      'اختر «حذف الحساب».',
      'راجع التنبيه وأكد طلب الحذف.',
    ],
    processTitle: 'ماذا يحدث بعد الطلب؟',
    process: 'يبدأ الطلب من داخل التطبيق. يتم قفل الحساب وبدء معالجة طلب الحذف وفق سياسة الخصوصية. قد يتم الاحتفاظ بسجلات محدودة عندما يكون الاحتفاظ مطلوباً لأغراض نظامية أو محاسبية أو نزاعات.',
    accessTitle: 'لا تستطيع الوصول إلى حسابك؟',
    access: 'تواصل مع دعم Heavyar للمساعدة. لا ترسل كلمة المرور أو أي بيانات دخول.',
    privacy: 'سياسة الخصوصية',
    support: 'الدعم',
  } : {
    eyebrow: 'Account management',
    title: 'Delete your Heavyar account',
    intro: 'You can request deletion of your account directly in the Heavyar app. Never send your password or sign-in credentials by email or to support.',
    stepsTitle: 'How to request account deletion',
    steps: [
      'Open the Heavyar app.',
      'Sign in to your account.',
      'Open “Profile” or “Settings”.',
      'Select “Delete account”.',
      'Review the notice and confirm the deletion request.',
    ],
    processTitle: 'What happens after the request?',
    process: 'The request starts inside the app. Your account is locked and the deletion process begins under the Privacy Policy. Limited records may be retained when required for legal, accounting, or dispute purposes.',
    accessTitle: 'Cannot access your account?',
    access: 'Contact Heavyar Support for assistance. Never send your password or other sign-in credentials.',
    privacy: 'Privacy Policy',
    support: 'Support',
  };
  const steps = copy.steps.map((step, index) => `<li><span aria-hidden="true">${index + 1}</span><p>${escapeHtml(step)}</p></li>`).join('');
  return `<main class="content-page account-information" id="main-content"><header class="inner-hero"><div class="site-container inner-hero-copy"><p class="eyebrow eyebrow-light">${escapeHtml(copy.eyebrow)}</p><h1>${escapeHtml(copy.title)}</h1><p>${escapeHtml(copy.intro)}</p></div></header><div class="site-container account-information-layout"><section class="account-information-card" aria-labelledby="deletion-steps"><h2 id="deletion-steps">${escapeHtml(copy.stepsTitle)}</h2><ol class="account-deletion-steps">${steps}</ol></section><aside class="account-information-aside"><section><h2>${escapeHtml(copy.processTitle)}</h2><p>${escapeHtml(copy.process)}</p><a href="/privacy">${escapeHtml(copy.privacy)}</a></section><section><h2>${escapeHtml(copy.accessTitle)}</h2><p>${escapeHtml(copy.access)}</p><a href="mailto:heavyar.official@gmail.com">heavyar.official@gmail.com</a><a href="/support">${escapeHtml(copy.support)}</a></section></aside></div></main>`;
}

function notFound(locale) {
  const en = locale === 'en';
  const home = en ? '/en/' : '/';
  return brandedPage(locale, 'home', `<main class="not-found-page" id="main-content"><div class="site-container not-found-card"><span class="not-found-code">404</span><p class="eyebrow">${en ? 'Page not found' : 'الصفحة غير موجودة'}</p><h1>${en ? 'This route is not available' : 'هذا الرابط غير متاح'}</h1><p>${en ? 'The page may have moved or the address may be incorrect.' : 'ربما نُقلت الصفحة أو أن العنوان غير صحيح.'}</p><a class="btn btn-primary" href="${home}">${en ? 'Return home' : 'العودة للرئيسية'}</a></div></main>`);
}

function devRewrite(html, basePath) {
  if (!basePath) return html;
  return html.replace(/<(a|link|script|img)\b([^>]*?)\s(href|src)="(\/(?!\/)[^"]*)"/gi, (all, tag, attrs, name, value) => {
    if (tag.toLowerCase() === 'link' && /\brel="(?:canonical|alternate)"/i.test(attrs)) return all;
    return `<${tag}${attrs} ${name}="${basePath}${value}"`;
  });
}

async function proxyApi(request, pathname, fetcher) {
  const methods = API_RULES[pathname];
  if (!methods) return text('Not found', 404);
  if (!methods.includes(request.method)) return text('Method not allowed', 405, 'text/plain; charset=utf-8', { Allow: methods.join(', ') });
  const headers = new Headers();
  for (const name of ['accept', 'accept-language', 'content-type', 'user-agent']) {
    const value = request.headers.get(name); if (value) headers.set(name, value);
  }
  // req.cf proves this request passed through Cloudflare. Never trust a client-
  // supplied forwarding header in Node/dev or non-Cloudflare environments.
  if (request.cf && request.headers.get('cf-connecting-ip')) headers.set('CF-Connecting-IP', request.headers.get('cf-connecting-ip'));
  const upstreamMethod = request.method === 'HEAD' ? 'GET' : request.method;
  const init = { method: upstreamMethod, headers, redirect: 'manual' };
  if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = request.body;
    init.duplex = 'half';
  }
  const response = await fetcher(`${API_ORIGIN}${pathname}`, init);
  if (request.method !== 'HEAD') return response;
  return new Response(null, { status: response.status, headers: response.headers });
}

function refreshSeoInBackground(fetcher, options) {
  const task = getSeo(fetcher, Date.now(), options.seoTimeoutMs).catch(() => undefined);
  const waitUntil = options.executionContext?.waitUntil?.bind(options.executionContext) || options.waitUntil;
  if (waitUntil) waitUntil(task);
}

async function routeRequest(request, env = {}, options = {}) {
  const url = new URL(request.url);
  const basePath = options.basePath || '';
  let pathname = url.pathname;
  if (basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))) pathname = pathname.slice(basePath.length) || '/';
  // Production browsers call the fixed API Worker directly. A same-origin
  // proxy would cross Cloudflare zones and lose the visitor IP semantics used
  // by backend rate limiting. The proxy exists only for the local dev server.
  if (pathname.startsWith('/api/')) {
    if (options.enableDevApiProxy === true) return proxyApi(request, pathname, options.fetcher || fetch);
    return text(request.method === 'HEAD' ? null : 'Not found', 404);
  }
  if (!['GET', 'HEAD'].includes(request.method)) return text('Method not allowed', 405, 'text/plain; charset=utf-8', { Allow: 'GET, HEAD' });
  const legalPathname = ({ '/privacy-policy': '/privacy', '/en/privacy-policy': '/en/privacy', '/terms-of-service': '/terms', '/en/terms-of-service': '/en/terms' })[pathname] || pathname;
  const legalMatch = legalPathname.match(/^\/(en\/)?(terms|privacy|refund-policy|disputes|provider-terms|driver-terms|verification|restricted-activities|acceptable-use)\/?$/);
  if (legalMatch && hasLegalPage(legalMatch[2])) {
    const locale = legalMatch[1] ? 'en' : 'ar-SA';
    const body = brandedPage(locale, legalMatch[2], renderLegalPage(legalMatch[2], locale === 'en' ? 'en' : 'ar'));
    const canonical = `https://heavyar.com${locale === 'en' ? '/en' : ''}/${legalMatch[2]}`;
    const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${legalMatch[2]} | Heavyar</title><link rel="canonical" href="${canonical}"><link rel="stylesheet" href="/assets/site.css">`;
    return text(request.method === 'HEAD' ? null : shell(locale, head, body, legalMatch[2]), 200, 'text/html; charset=utf-8', { ...pageSecurityHeaders(Boolean(basePath)), 'Cache-Control': 'public, max-age=60' });
  }
  const preservedFilename = PRESERVED_DOCUMENT_ROUTES[pathname];
  if (preservedFilename) {
    const content = renderPreservedBody(preservedFilename);
    const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Heavyar</title><link rel="stylesheet" href="/assets/site.css">`;
    const html = devRewrite(shell('ar-SA', head, brandedPage('ar-SA', 'home', content), 'preserved'), basePath);
    return text(request.method === 'HEAD' ? null : html, 200, 'text/html; charset=utf-8', {
      ...pageSecurityHeaders(Boolean(basePath)),
      'Cache-Control': 'public, max-age=60',
    });
  }
  if (pathname === '/robots.txt' || pathname === '/sitemap.xml') {
    const { payload } = await getSeo(options.fetcher || fetch);
    const body = request.method === 'HEAD' ? null : (pathname === '/robots.txt' ? robotsTxt(payload) : sitemapXml(payload));
    return text(body, 200, pathname.endsWith('.xml') ? 'application/xml; charset=utf-8' : 'text/plain; charset=utf-8', { 'Cache-Control': 'public, max-age=60' });
  }
  const legacy = LEGACY_ROUTES[pathname];
  const legalAlias = {
    '/privacy-policy': '/privacy',
    '/en/privacy-policy': '/en/privacy',
    '/terms-of-service': '/terms',
    '/en/terms-of-service': '/en/terms',
  }[pathname];
  const publicAlias = {
    '/support': '/help',
    '/en/support': '/en/help',
  }[pathname];
  const cleanPath = legalAlias || publicAlias || legacy || pathname;
  const route = ROUTES[cleanPath] || (cleanPath.endsWith('/') ? ROUTES[cleanPath.slice(0, -1)] : ROUTES[`${cleanPath}/`]);
  if (route) {
    const [key, locale] = route;
    const fetcher = options.fetcher || fetch;
    const isEarlyAccessSurface = key === 'home' || key === 'early-access';
    const { payload, source } = getSeoSnapshot();
    refreshSeoInBackground(fetcher, options);
    const page = pageFor(payload, key, locale);
    const hasPublishedLocale = payload.pages.some(candidate => candidate.key === key && candidate.locale === locale);
    let body;
    if (isEarlyAccessSurface) {
      body = renderHome({ locale, faqs: page.faqs });
      if (hasPublishedLocale && ['published', 'stale-published'].includes(source)) {
        body = body.replace(/(<h1 class="hero-title">)[\s\S]*?(<\/h1>)/, `$1${escapeHtml(page.heading)}$2`);
      }
    }
    else if (key === 'help') body = brandedPage(locale, 'support', renderSupportPage(locale));
    else if (key === 'account-deletion') body = brandedPage(locale, key, accountDeletionInformation(locale));
    else body = brandedPage(locale, key, routeBody(key, locale, page));
    const heroPreload = '<link rel="preload" as="image" href="/assets/images/hero-768.avif" imagesrcset="/assets/images/hero-480.avif 480w, /assets/images/hero-768.avif 768w, /assets/images/hero-1024.avif 1024w" imagesizes="(max-width: 560px) calc(100vw - 38px), (max-width: 820px) calc(100vw - 52px), 52vw" type="image/avif" fetchpriority="high">';
    const extraHead = isEarlyAccessSurface ? heroPreload : '<link rel="stylesheet" href="/assets/site.css">';
    const apiBase = basePath || API_ORIGIN;
    const integrationHead = `<meta name="heavyar-api-base" content="${escapeHtml(apiBase)}">`;
    const html = devRewrite(shell(locale, `${renderHead(page, payload.global)}${extraHead}${integrationHead}`, body, key), basePath);
    const seoSource = ['published', 'stale-published'].includes(source)
      ? (hasPublishedLocale ? source : 'published-missing-locale-noindex-fallback')
      : source === FALLBACK_REASON ? 'audited-fallback' : 'unavailable-fallback';
    const cacheControl = isEarlyAccessSurface ? 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' : 'public, max-age=60';
    return text(request.method === 'HEAD' ? null : html, 200, 'text/html; charset=utf-8', { ...pageSecurityHeaders(Boolean(basePath)), 'Cache-Control': cacheControl, 'X-Robots-Tag': page.robots, 'X-SEO-Source': seoSource });
  }
  // Repository-root Pages deployments must never expose implementation, Git,
  // tests, or baseline source files through the static asset binding.
  const assetPath = pathname === '/favicon.ico' ? '/assets/icons/favicon.ico' : pathname;
  const safeStatic = assetPath.startsWith('/assets/') || STATIC_FILES.has(pathname);
  if (safeStatic && env.ASSETS?.fetch) {
    const assetRequest = assetPath === pathname ? request : new Request(new URL(assetPath, request.url), request);
    const response = await env.ASSETS.fetch(assetRequest);
    return new Response(request.method === 'HEAD' ? null : response.body, { status: response.status, headers: response.headers });
  }
  if (safeStatic && options.asset) {
    const response = await options.asset(assetPath, request);
    return request.method === 'HEAD' ? new Response(null, { status: response.status, headers: response.headers }) : response;
  }
  const locale = pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'ar-SA';
  const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>404 | Heavyar</title><meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/assets/site.css">`;
  return text(request.method === 'HEAD' ? null : devRewrite(shell(locale, head, notFound(locale), '404'), basePath), 404, 'text/html; charset=utf-8', pageSecurityHeaders(Boolean(basePath)));
}

export async function handleRequest(request, env = {}, options = {}) {
  return secureResponse(request, await routeRequest(request, env, options), Boolean(options.basePath));
}
