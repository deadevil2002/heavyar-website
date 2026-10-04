export const FAQ_FALLBACK_AR = [
  { question: "ما هو Heavyar؟", answer: "Heavyar هي منصة وتطبيق قادم لتأجير المعدات الثقيلة بين الأفراد والشركات في المملكة العربية السعودية." },
  { question: "كيف يمكنني طلب معدة؟", answer: "عند إطلاق التطبيق، ستتمكن من البحث عن المعدات المناسبة، مقارنتها، وإرسال طلب تأجير مباشرة عبر المنصة." },
  { question: "هل يمكنني تأجير معداتي؟", answer: "نعم، سيتيح لك التطبيق التسجيل كمقدم خدمة وعرض معداتك لتلقي طلبات التأجير." },
  { question: "كيف أجد سائقاً للمعدة؟", answer: "سيوفر Heavyar ميزة للبحث عن سائقين مؤهلين للمعدات الثقيلة بناءً على الموقع والقدرات وإرسال طلبات لهم عبر التطبيق." }
];

export const FAQ_FALLBACK_EN = [
  { question: "What is Heavyar?", answer: "Heavyar is an upcoming platform and app for heavy equipment rental between individuals and companies in Saudi Arabia." },
  { question: "How can I request equipment?", answer: "Once the app launches, you will be able to search for suitable equipment, compare options, and send a rental request directly through the platform." },
  { question: "Can I rent out my equipment?", answer: "Yes, the app will allow you to register as a provider and list your equipment to receive rental requests." },
  { question: "How do I find a driver for equipment?", answer: "Heavyar will provide a feature to search for qualified heavy equipment drivers based on location and capabilities and send them requests." }
];

const esc = (str) => {
  if (!str) return '';
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
};

const icon = (name) => {
  const paths = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.25 4.25"/>',
    equipment: '<path d="M4 16.5h11.5l2.5-4.8h-5l-2-5H7.5L5.8 12H4z"/><path d="M8 6.7 9.5 3H14l2 4.5M6.5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm9 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>',
    driver: '<circle cx="12" cy="8" r="3.25"/><path d="M5.5 20c.4-4 2.6-6 6.5-6s6.1 2 6.5 6"/>',
    shield: '<path d="M12 3 5 6v5c0 4.7 2.6 8 7 10 4.4-2 7-5.3 7-10V6z"/><path d="m9 12 2 2 4-4"/>',
    pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    chart: '<path d="M4 20V10m6 10V4m6 16v-7m4 7H2"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    external: '<path d="M14 5h5v5"/><path d="m19 5-8 8"/><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
  };
  return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
};

const siteCopy = (locale) => {
  const isEn = locale === 'en';
  const pick = (ar, en) => isEn ? en : ar;
  return {
    skip: pick('تجاوز إلى المحتوى', 'Skip to content'),
    navMarketplace: pick('المنظومة', 'Marketplace'),
    navEquipment: pick('المعدات', 'Equipment'),
    navHow: pick('كيف تعمل', 'How it works'),
    navTrust: pick('الثقة', 'Trust'),
    navLanguage: pick('English', 'العربية'),
    earlyAccess: pick('سجل للوصول المبكر', 'Get Early Access'),
    footerAbout: pick('عن Heavyar', 'About Heavyar'),
    footerAboutText: pick('منصة سوق سعودية قادمة تربط العملاء ومقدمي المعدات والسائقين.', 'An upcoming Saudi marketplace connecting customers, equipment providers, and drivers.'),
    footerLinks: pick('السياسات والروابط', 'Policies & links'),
    footerContact: pick('تواصل معنا', 'Contact us'),
    terms: pick('شروط الاستخدام', 'Terms of Service'),
    privacy: pick('سياسة الخصوصية', 'Privacy Policy'),
    deleteAcc: pick('حذف الحساب', 'Delete Account'),
    crInfo: pick('السجل التجاري: 7050191290', 'Commercial Registration: 7050191290'),
    rights: pick('© 2026 Heavyar - جميع الحقوق محفوظة', '© 2026 Heavyar. All rights reserved.'),
  };
};

const localizedPath = (locale, path) => path === '/' ? (locale === 'en' ? '/en/' : '/') : (locale === 'en' ? `/en${path}` : path);

export function renderSiteHeader(locale, { key = 'home', homeAnchors = false } = {}) {
  const isEn = locale === 'en';
  const t = siteCopy(locale);
  const home = localizedPath(locale, '/');
  const anchor = id => `${homeAnchors ? '' : home}#${id}`;
  const other = isEn ? (key === 'home' ? '/' : `/${key}`) : (key === 'home' ? '/en/' : `/en/${key}`);
  const pick = (ar, en) => isEn ? en : ar;
  return `<a class="skip-link" href="#main-content">${esc(t.skip)}</a>
    <nav class="site-nav" aria-label="${pick('الملاحة الرئيسية', 'Main navigation')}">
      <div class="site-container nav-inner">
        <a href="${home}" class="nav-brand" aria-label="${pick('Heavyar، الرئيسية', 'Heavyar, Home')}"><span class="brand-mark"><img src="/assets/icons/brand.png" alt="" width="36" height="36" class="nav-logo"></span><span class="nav-title">Heavyar</span></a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation" aria-label="${pick('فتح القائمة', 'Open menu')}" data-nav-toggle><span></span><span></span><span></span></button>
        <div class="nav-menu" id="primary-navigation" data-nav-menu>
          <a href="${anchor('marketplace')}" class="nav-link">${esc(t.navMarketplace)}</a><a href="${anchor('equipment')}" class="nav-link">${esc(t.navEquipment)}</a><a href="${anchor('how-it-works')}" class="nav-link">${esc(t.navHow)}</a><a href="${anchor('trust')}" class="nav-link">${esc(t.navTrust)}</a>
          <a href="${anchor('early-access')}" class="nav-cta" data-early-access-cta>${esc(t.earlyAccess)}</a>
          <a href="${other}" class="nav-lang" hreflang="${isEn ? 'ar-SA' : 'en'}" lang="${isEn ? 'ar' : 'en'}" aria-label="${isEn ? 'عرض هذه الصفحة بالعربية' : 'View this page in English'}"><svg class="nav-lang-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg><span>${t.navLanguage}</span></a>
        </div>
      </div>
    </nav>`;
}

export function renderSiteFooter(locale) {
  const isEn = locale === 'en';
  const pick = (ar, en) => isEn ? en : ar;
  const t = siteCopy(locale);
  const path = value => localizedPath(locale, value);
  const home = path('/');
  const registryUrl = 'https://dgp.sdaia.gov.sa/wps/portal/pdp/services/certificate/75001f5a-d0bf-f111-b136-005056ab7918/!ut/p/z1/jY_RCoIwFIafpQcY52xjUy9XCGktCtFsNzGJmVAqIl309I0uk6xz98P3_5wPDJRgWvtoajs2XWtvPp-MPCcqlmuaIaPFUqDkeifEhjOMORw_gLyIPHBgOlUJxz0H808fv5zCX_30F-AN2KBXugbT2_FKmtZ1UAYCkTphyQUrRxyllFSUS4IoUEhbBREN_W9mdj1kE2Cq_wZm_DI7QH_Py-fWZQlRixcdwYwR/';
  return `<footer class="site-footer"><div class="site-container"><div class="footer-top"><a href="${home}" class="footer-brand"><span class="brand-mark"><img src="/assets/icons/brand.png" alt="" width="36" height="36"></span><span>Heavyar</span></a><p>${esc(t.footerAboutText)}</p></div><div class="footer-grid"><div class="footer-col"><h3>${esc(t.footerAbout)}</h3><a href="${home}#marketplace">${esc(t.navMarketplace)}</a><a href="${home}#equipment">${esc(t.navEquipment)}</a><a href="${home}#how-it-works">${esc(t.navHow)}</a></div><div class="footer-col"><h3>${esc(t.footerLinks)}</h3><a href="${path('/terms')}">${esc(t.terms)}</a><a href="${path('/privacy')}">${esc(t.privacy)}</a><a href="${path('/account-deletion')}">${esc(t.deleteAcc)}</a><a href="${path('/refund-policy')}">${pick('الإلغاء والاسترجاع', 'Cancellation & refunds')}</a><a href="${path('/acceptable-use')}">${pick('الاستخدام المقبول', 'Acceptable use')}</a></div><div class="footer-col"><h3>${esc(t.footerLinks)}</h3><a href="${path('/disputes')}">${pick('النزاعات', 'Disputes')}</a><a href="${path('/provider-terms')}">${pick('شروط مقدمي الخدمة', 'Provider terms')}</a><a href="${path('/driver-terms')}">${pick('شروط السائقين', 'Driver terms')}</a><a href="${path('/verification')}">${pick('التحقق', 'Verification')}</a><a href="${path('/restricted-activities')}">${pick('الأنشطة المقيدة', 'Restricted activities')}</a></div><div class="footer-col footer-contact"><h3>${esc(t.footerContact)}</h3><a href="mailto:heavyar.official@gmail.com">heavyar.official@gmail.com</a><span class="cr-text">${esc(t.crInfo)}</span></div></div><div class="footer-registry-trust"><span class="footer-registry-icon">${icon('shield')}</span><div class="footer-registry-copy"><span>${pick('مسجل في السجل الوطني لحماية البيانات الشخصية', 'Registered in the National Register for Personal Data Protection')}</span><span class="footer-registry-separator" aria-hidden="true">·</span><span>${pick('رقم التسجيل:', 'Registration No.:')} <bdi dir="ltr">3260008515</bdi></span><span class="footer-registry-separator" aria-hidden="true">·</span><a href="${registryUrl}" target="_blank" rel="noopener noreferrer">${pick('التحقق من التسجيل', 'Verify registration')} ${icon('external')}</a></div></div><div class="footer-bottom"><p>${esc(t.rights)}</p><span>${pick('صنع للسوق السعودي', 'Built for Saudi Arabia')}</span></div></div></footer>`;
}

export const renderSiteScripts = () => `<script src="/assets/site.js"></script>
    <div class="sbc-verify-seal" data-token="eTlYY0g1Z0x3OUM2QmFkdmUyNk5rZz09" data-position="bottom-left"></div>
    <script src="/assets/seal-lifecycle.js"></script>
    <script src="https://eauthenticate.saudibusiness.gov.sa/EAuthSealApi/seal.js" async></script>`;

export function renderHome({ locale, faqs = [], earlyAccessEnabled = false }) {
  const isEn = locale === 'en';
  const faqList = faqs && faqs.length > 0 ? faqs : (isEn ? FAQ_FALLBACK_EN : FAQ_FALLBACK_AR);
  const pick = (ar, en) => isEn ? en : ar;
  const t = {
    skip: pick('تجاوز إلى المحتوى', 'Skip to content'), brand: 'Heavyar',
    navMarketplace: pick('المنظومة', 'Marketplace'), navEquipment: pick('المعدات', 'Equipment'), navHow: pick('كيف تعمل', 'How it works'), navTrust: pick('الثقة', 'Trust'),
    navLanguage: pick('English', 'العربية'), navLanguageLink: isEn ? '/' : '/en/',
    heroEyebrow: pick('منظومة سعودية للمعدات الثقيلة', 'A Saudi heavy-equipment ecosystem'),
    heroTitle: pick('المعدات الثقيلة أقرب مما تتوقع', 'Heavy Equipment Closer Than You Think'),
    heroSubtitle: pick('منصة واحدة تربط الباحثين عن المعدات بمقدمي الخدمة والسائقين، لتجعل رحلة البحث والطلب والتنسيق أوضح من البداية.', 'One platform connects equipment customers, providers, and drivers, making discovery, requests, and coordination clearer from the start.'),
    heroCtaPrimary: pick('سجل للوصول المبكر', 'Get Early Access'), heroCtaSecondary: pick('استكشف المنظومة', 'Explore the marketplace'),
    heroStatus: pick('تطبيق Heavyar، قريباً', 'Heavyar app, coming soon'),
    heroImageAlt: pick('معدات ثقيلة في موقع عمل تمثل سوق Heavyar', 'Heavy equipment at a worksite representing the Heavyar marketplace'),
    roleCustomer: pick('باحث عن معدة', 'Equipment customer'), roleProvider: pick('مالك ومقدم خدمة', 'Owner & provider'), roleDriver: pick('سائق ومشغل', 'Driver & operator'),
    trustSaudi: pick('مصممة للسوق السعودي', 'Built for Saudi Arabia'), trustNetwork: pick('ثلاثة أطراف في منظومة واحدة', 'Three sides, one marketplace'), trustCoordination: pick('مسار طلب وتنسيق واضح', 'Clear request coordination'),
    introKicker: pick('سوق واحد. فرص أكثر.', 'One marketplace. More opportunity.'), introTitle: pick('كل أطراف العمل الميداني، في مكان واحد', 'Every side of the job, connected'),
    introText: pick('تجمع Heavyar الأطراف التي تحرك قطاع المعدات الثقيلة ضمن تجربة رقمية واضحة، دون تعقيد أو تشتت بين القنوات.', 'Heavyar brings the people who move the heavy-equipment industry into one clear digital experience, without fragmented channels.'),
    customerTitle: pick('للباحثين عن المعدات', 'For equipment customers'), customerText: pick('اكتشف الفئات المناسبة، قارن الخيارات، وأرسل طلبك ضمن مسار منظم.', 'Discover the right categories, compare options, and send a structured request.'),
    providerTitle: pick('لملاك المعدات', 'For equipment owners'), providerText: pick('اعرض معداتك، حدّث توافرها، واستقبل طلبات التأجير في واجهة واحدة.', 'List equipment, manage availability, and receive rental requests in one place.'),
    driverTitle: pick('للسائقين والمشغلين', 'For drivers & operators'), driverText: pick('أنشئ ملف قدراتك وتوافرك لتظهر للطلبات المناسبة عند إطلاق التطبيق.', 'Present your capabilities and availability for relevant requests when the app launches.'), learnMore: pick('اعرف المزيد', 'Learn more'),
    equipmentKicker: pick('فئات السوق', 'Marketplace categories'), equipmentTitle: pick('معدات تناسب طبيعة العمل', 'Equipment for the work ahead'),
    equipmentText: pick('من أعمال الحفر والرفع إلى النقل والطاقة، تبني Heavyar نقطة اكتشاف منظمة لفئات المعدات الأساسية.', 'From excavation and lifting to transport and power, Heavyar is building an organized discovery layer for essential equipment categories.'),
    categories: isEn ? ['Excavators', 'Cranes', 'Loaders', 'Bulldozers', 'Trucks', 'Generators', 'Compressors', 'Concrete equipment'] : ['الحفارات', 'الرافعات', 'اللوادر', 'البلدوزرات', 'الشاحنات', 'المولدات', 'الضواغط', 'معدات الخرسانة'],
    categoryNote: pick('وفئات أخرى حسب احتياج المشروع', 'And more categories for different project needs'),
    howKicker: pick('من البحث إلى التنسيق', 'From discovery to coordination'), howTitle: pick('رحلة أبسط للعمل الثقيل', 'A simpler path for heavy work'), howText: pick('خطوات مفهومة تساعد كل طرف على معرفة ما يحتاجه وما الذي يأتي بعده.', 'A clear journey so every participant knows what they need and what comes next.'),
    steps: isEn ? [['01', 'Discover', 'Browse equipment or driver capabilities based on the job requirement.'], ['02', 'Request', 'Share the relevant request details through a structured flow.'], ['03', 'Coordinate', 'Align on availability and next steps through the platform.']] : [['01', 'اكتشف', 'تصفح المعدات أو قدرات السائقين بما يناسب متطلبات العمل.'], ['02', 'أرسل الطلب', 'شارك تفاصيل الطلب المهمة ضمن مسار واضح ومنظم.'], ['03', 'نسّق', 'تابع التوافر والخطوات التالية من خلال المنصة.']],
    trustKicker: pick('الثقة أولاً', 'Trust by design'), trustTitle: pick('منظومة مهنية تُبنى للسوق الحقيقي', 'A professional marketplace built for real work'), trustText: pick('Heavyar منصة سعودية قادمة تركز على وضوح الحسابات والعروض، حماية الخصوصية، وتنظيم التواصل بين الأطراف.', 'Heavyar is an upcoming Saudi platform focused on clear profiles and listings, privacy controls, and organized communication between participants.'),
    trustPoints: isEn ? ['Account and listing policies', 'Privacy-conscious communication', 'Saudi-first, GCC-ready foundation'] : ['سياسات واضحة للحسابات والعروض', 'تواصل يراعي الخصوصية', 'انطلاقة سعودية بجاهزية خليجية'],
    trustCardLabel: pick('مصمم ليجمع', 'Designed to connect'), trustCardTitle: pick('المعدة المناسبة، الشخص المناسب، والطلب المناسب.', 'The right equipment, the right people, and the right request.'),
    appEyebrow: pick('الخطوة القادمة', 'What comes next'), appTitle: pick('تطبيق Heavyar قادم قريباً', 'The Heavyar app is coming soon'), appText: pick('نعمل على تجربة تربط سوق المعدات الثقيلة السعودي في منصة واحدة احترافية وسهلة الاستخدام.', 'We are building a professional, easy-to-use platform for Saudi Arabia’s heavy-equipment marketplace.'),
    faqKicker: pick('إجابات واضحة', 'Straight answers'), faqTitle: pick('الأسئلة الشائعة', 'Frequently asked questions'),
    earlyTitle: pick('كن من أوائل مستخدمي Heavyar', 'Be among the first'), earlySubtitle: pick('سجل للوصول المبكر واحصل على إشعار عند إطلاق التطبيق.', 'Register for Early Access and get notified when the app launches.'), eaClosedMsg: pick('التسجيل للوصول المبكر مغلق حالياً. يرجى التحقق لاحقاً.', 'Early access registration is currently closed. Please check back later.'),
    eaEmail: pick('البريد الإلكتروني', 'Email Address'), eaName: pick('الاسم (اختياري)', 'Name (Optional)'), eaCountry: pick('الدولة (اختياري)', 'Country (Optional)'), eaLang: pick('اللغة المفضلة (اختياري)', 'Preferred Language (Optional)'), eaConsent: pick('أوافق على تلقي التحديثات ورسائل التسويق المتعلقة بإطلاق Heavyar.', "I agree to receive occasional updates and marketing communications about Heavyar's launch."), eaSubmit: pick('تسجيل', 'Register'), eaPrivacyNotice: pick('بياناتك بأمان. اقرأ', 'Your data is safe. Read our'), eaPrivacyLink: pick('سياسة الخصوصية', 'Privacy Policy'),
    footerAbout: pick('عن Heavyar', 'About Heavyar'), footerAboutText: pick('منصة سوق سعودية قادمة تربط العملاء ومقدمي المعدات والسائقين.', 'An upcoming Saudi marketplace connecting customers, equipment providers, and drivers.'), footerLinks: pick('السياسات والروابط', 'Policies & links'), footerContact: pick('تواصل معنا', 'Contact us'), terms: pick('شروط الاستخدام', 'Terms of Service'), privacy: pick('سياسة الخصوصية', 'Privacy Policy'), deleteAcc: pick('حذف الحساب', 'Delete Account'), crInfo: pick('السجل التجاري: 7050191290', 'Commercial Registration: 7050191290'), rights: pick('© 2026 Heavyar - جميع الحقوق محفوظة', '© 2026 Heavyar. All rights reserved.')
  };

  const navPath = (p) => p === '/' ? (isEn ? '/en/' : '/') : (isEn ? `/en${p}` : p);
  const roleCards = [['search', t.customerTitle, t.customerText, navPath('/equipment')], ['equipment', t.providerTitle, t.providerText, '#how-it-works'], ['driver', t.driverTitle, t.driverText, navPath('/drivers')]];

  return `
    ${renderSiteHeader(locale, { key: 'home', homeAnchors: true })}

    <main class="site-main" id="main-content">
      <section class="hero" data-depth-scene>
        <div class="hero-brand-echo" aria-hidden="true"><img src="/assets/icons/brand.png" alt="" width="512" height="512"></div>
        <div class="hero-orb hero-orb-one" aria-hidden="true" data-depth-layer="back"></div><div class="hero-orb hero-orb-two" aria-hidden="true" data-depth-layer="mid"></div>
        <div class="site-container hero-grid">
          <div class="hero-copy" data-reveal><div class="eyebrow eyebrow-light">${esc(t.heroEyebrow)}</div><h1 class="hero-title">${esc(t.heroTitle)}</h1><p class="hero-subtitle">${esc(t.heroSubtitle)}</p>
            <div class="hero-ctas"><a href="#early-access" class="btn btn-primary btn-shine" data-early-access-cta>${esc(t.heroCtaPrimary)} ${icon('arrow')}</a><a href="#marketplace" class="btn btn-ghost">${esc(t.heroCtaSecondary)}</a></div>
            <div class="hero-status"><span class="status-dot" aria-hidden="true"></span>${esc(t.heroStatus)}</div>
          </div>
          <div class="hero-visual" data-reveal data-reveal-delay="1" data-depth-layer="front"><div class="hero-image-frame" data-tilt><span class="hero-depth-ring" aria-hidden="true"></span><img src="/assets/images/hero.webp" alt="${esc(t.heroImageAlt)}" width="1024" height="1024" fetchpriority="high" decoding="async"><div class="hero-image-shade"></div><div class="visual-label visual-label-top" data-float-layer="1">${icon('equipment')}<span>${esc(t.roleProvider)}</span></div><div class="visual-label visual-label-bottom" data-float-layer="2">${icon('driver')}<span>${esc(t.roleDriver)}</span></div><div class="visual-search-card" data-float-layer="3"><span class="visual-search-icon">${icon('search')}</span><span><small>${pick('ابحث. قارن. اطلب.', 'Search. Compare. Request.')}</small><strong>${esc(t.roleCustomer)}</strong></span></div></div></div>
        </div>
        <div class="site-container trust-ribbon" aria-label="${pick('مزايا المنصة', 'Platform principles')}"><span>${icon('pin')}${esc(t.trustSaudi)}</span><span>${icon('layers')}${esc(t.trustNetwork)}</span><span>${icon('check')}${esc(t.trustCoordination)}</span></div>
      </section>

      <section id="marketplace" class="section section-cream curved-section"><div class="site-container"><div class="section-heading split-heading" data-reveal><div><p class="eyebrow">${esc(t.introKicker)}</p><h2 class="section-title">${esc(t.introTitle)}</h2></div><p class="section-text">${esc(t.introText)}</p></div><div class="role-grid">${roleCards.map(([iconName, title, text, href], index) => `<article class="role-card" data-reveal data-reveal-delay="${index}" data-tilt-card><div class="role-card-top"><span class="role-icon">${icon(iconName)}</span><span class="role-index">0${index + 1}</span></div><h3>${esc(title)}</h3><p>${esc(text)}</p><a href="${href}" class="text-link">${esc(t.learnMore)} ${icon('arrow')}</a></article>`).join('')}</div></div></section>

      <section id="equipment" class="section section-white story-section"><div class="site-container equipment-layout"><div class="equipment-copy" data-reveal><p class="eyebrow">${esc(t.equipmentKicker)}</p><h2 class="section-title">${esc(t.equipmentTitle)}</h2><p class="section-text">${esc(t.equipmentText)}</p><div class="category-note">${icon('layers')}<span>${esc(t.categoryNote)}</span></div></div><div class="category-stage" data-reveal data-reveal-delay="1"><span class="category-stage-glow" aria-hidden="true"></span><div class="category-grid">${t.categories.map((category, index) => `<div class="category-card" data-depth-card><span>${String(index + 1).padStart(2, '0')}</span><strong>${esc(category)}</strong>${icon(index % 3 === 0 ? 'equipment' : index % 3 === 1 ? 'chart' : 'layers')}</div>`).join('')}</div></div></div></section>

      <section id="how-it-works" class="section section-ink"><div class="site-container"><div class="section-heading centered-heading" data-reveal><p class="eyebrow eyebrow-light">${esc(t.howKicker)}</p><h2 class="section-title">${esc(t.howTitle)}</h2><p class="section-text">${esc(t.howText)}</p></div><div class="steps-grid">${t.steps.map(([number, title, text], index) => `<article class="step-card" data-reveal data-reveal-delay="${index}"><span class="step-number">${number}</span><div class="step-icon">${icon(index === 0 ? 'search' : index === 1 ? 'chart' : 'check')}</div><h3>${esc(title)}</h3><p>${esc(text)}</p></article>`).join('')}</div></div></section>

      <section id="trust" class="section section-cream trust-section"><div class="site-container trust-layout"><div class="trust-copy" data-reveal><p class="eyebrow">${esc(t.trustKicker)}</p><h2 class="section-title">${esc(t.trustTitle)}</h2><p class="section-text">${esc(t.trustText)}</p><ul class="check-list">${t.trustPoints.map(point => `<li><span>${icon('check')}</span>${esc(point)}</li>`).join('')}</ul></div><div class="trust-panel" data-reveal data-reveal-delay="1" data-tilt><span class="trust-panel-label">${esc(t.trustCardLabel)}</span><div class="trust-nodes" aria-hidden="true"><span>${icon('search')}</span><span>${icon('equipment')}</span><span>${icon('driver')}</span></div><h3>${esc(t.trustCardTitle)}</h3><span class="trust-watermark">H</span></div></div></section>

      <section class="section app-cta"><div class="site-container app-cta-inner" data-reveal><div><p class="eyebrow eyebrow-light">${esc(t.appEyebrow)}</p><h2>${esc(t.appTitle)}</h2><p>${esc(t.appText)}</p></div><div class="app-cta-actions"><div class="app-badge" aria-label="${esc(t.appTitle)}"><span>${icon('clock')}</span><strong>${pick('قريباً', 'Coming soon')}</strong><small>iOS · Android</small></div><a href="#early-access" class="btn btn-primary" data-early-access-cta>${esc(t.heroCtaPrimary)}</a></div></div></section>

      <section id="early-access" class="section ea-section" data-early-access-section data-ea-initial-enabled="${earlyAccessEnabled}"><div class="site-container ea-shell" data-reveal><div class="ea-intro"><span class="ea-logo"><img src="/assets/icons/brand.png" alt="" width="92" height="92"></span><p class="eyebrow eyebrow-light">Heavyar Early Access</p><h2 class="section-title">${esc(t.earlyTitle)}</h2><p class="section-text">${esc(t.earlySubtitle)}</p><div class="ea-role-pills"><span>${icon('search')}${esc(t.roleCustomer)}</span><span>${icon('equipment')}${esc(t.roleProvider)}</span><span>${icon('driver')}${esc(t.roleDriver)}</span></div></div><div class="ea-form-panel"><div data-ea-closed-message ${earlyAccessEnabled ? 'style="display:none;"' : ''} class="ea-status error text-center">${esc(t.eaClosedMsg)}</div><form class="ea-form" data-ea-form ${!earlyAccessEnabled ? 'style="display:none;"' : ''}><div class="ea-status" data-ea-status aria-live="polite"></div><div class="form-group"><label for="ea-email">${esc(t.eaEmail)}</label><input type="email" id="ea-email" name="email" maxlength="254" autocomplete="email" required class="form-control"></div><div class="form-group"><label for="ea-name">${esc(t.eaName)}</label><input type="text" id="ea-name" name="name" maxlength="100" autocomplete="name" class="form-control"></div><div class="grid grid-2"><div class="form-group"><label for="ea-country">${esc(t.eaCountry)}</label><select id="ea-country" name="country" autocomplete="country" class="form-control"><option value="">${pick('اختر الدولة (اختياري)', 'Choose a country (optional)')}</option>${[['SA', 'السعودية', 'Saudi Arabia'], ['AE', 'الإمارات', 'UAE'], ['KW', 'الكويت', 'Kuwait'], ['QA', 'قطر', 'Qatar'], ['BH', 'البحرين', 'Bahrain'], ['OM', 'عُمان', 'Oman']].map(([code, ar, en]) => `<option value="${code}">${isEn ? en : ar}</option>`).join('')}</select></div><div class="form-group"><label for="ea-lang">${esc(t.eaLang)}</label><select id="ea-lang" name="language" class="form-control"><option value="">-</option><option value="ar">العربية</option><option value="en">English</option></select></div></div><div class="form-check"><input type="checkbox" id="ea-consent" name="consentMarketing" value="true"><label for="ea-consent">${esc(t.eaConsent)}</label></div><button type="submit" class="btn btn-primary btn-block ea-submit" data-ea-submit>${esc(t.eaSubmit)}</button><div class="ea-privacy text-center">${esc(t.eaPrivacyNotice)} <a href="${navPath('/privacy')}">${esc(t.eaPrivacyLink)}</a></div></form></div></div></section>

      <section class="section section-white faq-section"><div class="site-container faq-layout"><div class="faq-heading" data-reveal><p class="eyebrow">${esc(t.faqKicker)}</p><h2 class="section-title">${esc(t.faqTitle)}</h2></div><div class="faq-list" data-reveal data-reveal-delay="1">${faqList.map(faq => `<details class="faq-item"><summary class="faq-q">${esc(faq.question)}</summary><div class="faq-a"><p>${esc(faq.answer)}</p></div></details>`).join('')}</div></div></section>
      <section class="final-cta"><div class="site-container final-cta-inner" data-reveal><div><p class="eyebrow eyebrow-light">${esc(t.appEyebrow)}</p><h2>${esc(t.earlyTitle)}</h2><p>${esc(t.earlySubtitle)}</p></div><a href="#early-access" class="btn btn-primary btn-shine" data-early-access-cta>${esc(t.heroCtaPrimary)} ${icon('arrow')}</a></div></section>
    </main>

    ${renderSiteFooter(locale)}
    ${renderSiteScripts()}
  `;
}
