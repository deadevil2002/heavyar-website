/*
 * Audited fallback provenance:
 * - Arabic home title/description/social copy: index.html at baseline
 *   f6cb67e5a47d9c210f084ac3c949aabd86f8c5c9.
 * - Legal/account routes: titles and descriptions describe the preserved files.
 * This is deliberately a small emergency baseline, not a second editable CMS.
 */
export const FALLBACK_REASON = 'audited-baseline:f6cb67e5a47d9c210f084ac3c949aabd86f8c5c9';

const registry = {
  home: ['/', '/en/'],
  about: ['/about', '/en/about'],
  equipment: ['/equipment', '/en/equipment'],
  drivers: ['/drivers', '/en/drivers'],
  help: ['/help', '/en/help'],
  privacy: ['/privacy', '/en/privacy'],
  terms: ['/terms', '/en/terms'],
  'account-deletion': ['/account-deletion', '/en/account-deletion'],
  'early-access': ['/early-access', '/en/early-access'],
};

const copy = {
  home: {
    ar: ['Heavyar | منصة تأجير المعدات الثقيلة بين الأفراد والشركات في السعودية', 'Heavyar هي منصة وتطبيق سعودي لتأجير المعدات الثقيلة بين الأفراد والشركات داخل المملكة العربية السعودية. تصفح العروض، أرسل طلبات التأجير، وتابع التواصل مع مقدمي الخدمة بكل سهولة وأمان من خلال التطبيق.'],
    en: ['Heavyar | Heavy equipment rental marketplace in Saudi Arabia', 'Heavyar connects customers, heavy-equipment providers, and equipment drivers in Saudi Arabia. Discover equipment and coordinate rental requests efficiently.'],
  },
  about: { ar: ['عن Heavyar', 'تعرّف على منصة Heavyar السعودية للمعدات الثقيلة وخدمات التأجير والسائقين.'], en: ['About Heavyar', 'Learn about Heavyar, a Saudi marketplace platform for heavy equipment, rental requests, and equipment drivers.'] },
  equipment: { ar: ['المعدات الثقيلة | Heavyar', 'اكتشف فئات المعدات الثقيلة وخيارات البحث وطلبات التأجير عبر Heavyar.'], en: ['Heavy equipment | Heavyar', 'Explore heavy-equipment categories, discovery, and rental-request workflows with Heavyar.'] },
  drivers: { ar: ['سائقو المعدات | Heavyar', 'تعرّف على البحث عن سائقي المعدات حسب القدرات والموقع والتوفر عبر Heavyar.'], en: ['Equipment drivers | Heavyar', 'Learn how Heavyar supports equipment-driver discovery by capability, location, and availability.'] },
  help: { ar: ['المساعدة | Heavyar', 'إجابات ومعلومات تساعدك على فهم منصة Heavyar والتواصل مع الدعم.'], en: ['Help | Heavyar', 'Answers and support information to help you understand Heavyar.'] },
  privacy: { ar: ['سياسة الخصوصية – Heavyar', 'اقرأ سياسة خصوصية Heavyar وكيفية جمع البيانات واستخدامها وحمايتها.'], en: ['Privacy Policy – Heavyar', 'Read the Heavyar Privacy Policy covering collection, use, protection, and retention of data.'] },
  terms: { ar: ['شروط وأحكام استخدام المنصة – Heavyar', 'اقرأ شروط وأحكام استخدام منصة Heavyar.'], en: ['Terms of Service – Heavyar', 'Read the terms and conditions governing use of the Heavyar platform.'] },
  'account-deletion': { ar: ['حذف حساب Heavyar', 'اطلب حذف حساب Heavyar بأمان بعد تسجيل الدخول.'], en: ['Delete your Heavyar account', 'Request deletion of your Heavyar account securely after signing in.'] },
  'early-access': { ar: ['الوصول المبكر | Heavyar', 'معلومات الوصول المبكر إلى Heavyar عند إتاحة التسجيل.'], en: ['Early access | Heavyar', 'Heavyar early-access information when registration becomes available.'] },
};

export function fallbackPayload() {
  const pages = Object.entries(registry).flatMap(([key, paths]) => ['ar-SA', 'en'].map((locale, i) => {
    const [title, description] = copy[key][locale === 'ar-SA' ? 'ar' : 'en'];
    const canonical = `https://heavyar.com${paths[i]}`;
    const privatePage = key === 'account-deletion';
    const early = key === 'early-access';
    return {
      key, locale, title, description, heading: title.split(/[|–]/)[0].trim(),
      canonical, robots: privatePage ? 'noindex,nofollow' : early ? 'noindex,follow' : 'index,follow',
      openGraph: { title, description, image: 'https://heavyar.com/assets/social/heavyar-og.jpg', locale, siteName: 'Heavyar' },
      twitter: { title, description, image: 'https://heavyar.com/assets/social/heavyar-og.jpg', card: 'summary_large_image' },
      sitemap: { include: !privatePage && !early, priority: key === 'home' ? 1 : null, changeFrequency: key === 'home' ? 'weekly' : 'monthly', lastmod: null },
      alternates: [
        { locale: 'ar-SA', href: `https://heavyar.com${paths[0]}` },
        { locale: 'en', href: `https://heavyar.com${paths[1]}` },
        { locale: 'x-default', href: `https://heavyar.com${paths[0]}` },
      ],
      structuredData: [], faqs: [],
    };
  }));
  return {
    success: true, schemaVersion: 1, fallback: true,
    global: {
      siteName: 'Heavyar', canonicalOrigin: 'https://heavyar.com',
      assets: {
        faviconIco: 'https://heavyar.com/favicon.ico', faviconPng: 'https://heavyar.com/assets/icons/favicon-32.png',
        icon192: 'https://heavyar.com/assets/icons/icon-192.png', icon512: 'https://heavyar.com/assets/icons/icon-512.png', appleTouchIcon: 'https://heavyar.com/assets/icons/apple-touch-icon.png',
        socialShare: 'https://heavyar.com/assets/social/heavyar-og.jpg',
      },
    },
    crawlerPolicy: { mainstreamIndexing: true, googlebot: true, bingbot: true, oaiSearchBot: true },
    pages,
  };
}