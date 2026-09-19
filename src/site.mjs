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
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

export function renderHome({ locale, faqs = [], earlyAccessEnabled = false }) {
  const isEn = locale === 'en';
  const faqList = faqs && faqs.length > 0 ? faqs : (isEn ? FAQ_FALLBACK_EN : FAQ_FALLBACK_AR);

  const t = {
    brand: "Heavyar",
    navEquipment: isEn ? "Equipment" : "المعدات",
    navDrivers: isEn ? "Drivers" : "السائقين",
    navAbout: isEn ? "About" : "من نحن",
    navLanguage: isEn ? "العربية" : "English",
    navLanguageLink: isEn ? "/" : "/en/",
    
    heroTitle: isEn ? "Heavy Equipment Closer Than You Think" : "المعدات الثقيلة أقرب مما تتوقع",
    heroSubtitle: isEn ? "Your smart platform connecting equipment owners, renters, and drivers to easily find and manage heavy equipment and services." : "منصتك الذكية التي تربط أصحاب المعدات والعملاء والسائقين لتسهيل العثور على المعدات والخدمات وإدارتها.",
    heroCtaPrimary: isEn ? "Register for Early Access" : "سجل للوصول المبكر",
    heroCtaSecondary: isEn ? "Discover Heavyar" : "اكتشف Heavyar",
    
    whatIsTitle: isEn ? "What is Heavyar?" : "ما هو Heavyar؟",
    whatIsText: isEn ? "Heavyar is a Saudi marketplace platform connecting the heavy equipment industry. Whether you are looking to rent machinery, offer your equipment, or find qualified operators, Heavyar provides the tools to coordinate requests, availability, and direct communication securely and efficiently." : "Heavyar هي منصة سوق سعودية تربط قطاع المعدات الثقيلة. سواء كنت تبحث عن استئجار آليات، أو عرض معداتك، أو العثور على سائقين مؤهلين، توفر Heavyar الأدوات لتنسيق الطلبات والتواصل المباشر بأمان وكفاءة.",

    howItWorksTitle: isEn ? "How it Works" : "كيف يعمل Heavyar؟",
    hiwCustomerTitle: isEn ? "For Customers" : "للعملاء",
    hiwCustomerSteps: isEn ? ["Search equipment", "Compare options", "Send request", "Coordinate and rent"] : ["ابحث عن المعدات", "قارن الخيارات", "أرسل الطلب", "نسق واستأجر"],
    hiwProviderTitle: isEn ? "For Providers" : "لمقدمي الخدمة",
    hiwProviderSteps: isEn ? ["Create profile", "Add equipment", "Receive requests", "Manage activity"] : ["أنشئ ملفك", "أضف معداتك", "استقبل الطلبات", "أدر نشاطك"],
    hiwDriverTitle: isEn ? "For Drivers" : "للسائقين",
    hiwDriverSteps: isEn ? ["Create driver profile", "Add capabilities", "Set availability", "Receive requests"] : ["أنشئ ملف السائق", "أضف قدراتك", "حدد توافرك", "استقبل الطلبات"],

    equipmentTitle: isEn ? "Equipment Discovery" : "اكتشف المعدات",
    equipmentText: isEn ? "Browse a wide range of heavy machinery provided by owners across the market." : "تصفح مجموعة واسعة من الآليات الثقيلة المقدمة من أصحاب المعدات في السوق.",
    categories: isEn ? 
      ["Excavators", "Cranes", "Loaders", "Bulldozers", "Trucks", "Generators", "Compressors", "Concrete", "Other"] : 
      ["الحفارات", "الرافعات", "اللوادر", "البلدوزرات", "الشاحنات", "المولدات", "الضواغط", "معدات الخرسانة", "أخرى"],
      
    driverTitle: isEn ? "Driver Discovery" : "اكتشاف السائقين",
    driverText: isEn ? "Need a qualified operator? Heavyar allows you to search for heavy equipment drivers based on capabilities, location, and availability, and send them secure requests." : "هل تحتاج إلى مشغل مؤهل؟ يتيح لك Heavyar البحث عن سائقي المعدات الثقيلة بناءً على قدراتهم وموقعهم وتوافرهم، وإرسال طلبات آمنة لهم.",

    providerTitle: isEn ? "Grow Your Business" : "نمّ أعمالك",
    providerText: isEn ? "Empower your business with a digital presence. List your machinery, manage rental requests, update availability, and get discovered in a growing marketplace." : "نُمكّن أصحاب المعدات من بناء حضور رقمي. اعرض معداتك، أدر طلبات التأجير، حدّث توافرك، وكن جزءاً من سوق متنامٍ.",

    gccTitle: isEn ? "Saudi First, GCC Ready" : "للسوق السعودي، بجاهزية خليجية",
    gccText: isEn ? "We are building Heavyar for the Saudi market with readiness for regional GCC expansion." : "نبني Heavyar للسوق السعودي مع جاهزية للتوسع الخليجي مستقبلاً.",

    trustTitle: isEn ? "Trust and Safety" : "الثقة والأمان",
    trustText: isEn ? "We prioritize security through active moderation of equipment listings, strict account policies, and privacy controls for a reliable marketplace experience." : "نعطي الأولوية للأمان من خلال المراجعة المستمرة لعروض المعدات، سياسات الحساب الصارمة، وضوابط الخصوصية لضمان تجربة موثوقة.",

    earlyTitle: isEn ? "Be Among the First" : "كن من أوائل مستخدمي Heavyar",
    earlySubtitle: isEn ? "Register for Early Access and get notified when the app launches." : "سجل للوصول المبكر واحصل على إشعار عند إطلاق التطبيق.",
    eaClosedMsg: isEn ? "Early access registration is currently closed. Please check back later." : "التسجيل للوصول المبكر مغلق حالياً. يرجى التحقق لاحقاً.",
    eaEmail: isEn ? "Email Address" : "البريد الإلكتروني",
    eaName: isEn ? "Name (Optional)" : "الاسم (اختياري)",
    eaCountry: isEn ? "Country (Optional)" : "الدولة (اختياري)",
    eaLang: isEn ? "Preferred Language (Optional)" : "اللغة المفضلة (اختياري)",
    eaConsent: isEn ? "I agree to receive occasional updates and marketing communications about Heavyar's launch." : "أوافق على تلقي التحديثات ورسائل التسويق المتعلقة بإطلاق Heavyar.",
    eaSubmit: isEn ? "Register" : "تسجيل",
    eaPrivacyNotice: isEn ? "Your data is safe. Read our" : "بياناتك بأمان. اقرأ",
    eaPrivacyLink: isEn ? "Privacy Policy" : "سياسة الخصوصية",

    faqTitle: isEn ? "Frequently Asked Questions" : "الأسئلة الشائعة",

    appTitle: isEn ? "Heavyar app coming soon" : "تطبيق Heavyar قادم قريباً",
    
    footerAbout: isEn ? "About Heavyar" : "عن Heavyar",
    footerAboutText: isEn ? "A marketplace platform for heavy equipment rental between individuals and companies." : "منصة سعودية لتأجير المعدات الثقيلة بين الأفراد والشركات.",
    footerLinks: isEn ? "Quick Links" : "روابط سريعة",
    terms: isEn ? "Terms of Service" : "شروط الاستخدام",
    privacy: isEn ? "Privacy Policy" : "سياسة الخصوصية",
    deleteAcc: isEn ? "Delete Account" : "حذف الحساب",
    footerContact: isEn ? "Contact Us" : "تواصل معنا",
    crInfo: isEn ? "Commercial Registration: 7050191290" : "السجل التجاري: 7050191290",
    rights: isEn ? "© 2026 Heavyar. All rights reserved." : "© 2026 Heavyar - جميع الحقوق محفوظة"
  };

  const navPath = (p) => {
    if (p === '/') return isEn ? '/en/' : '/';
    return isEn ? `/en${p}` : p;
  };

  return `
    <nav class="site-nav" aria-label="${isEn ? 'Main Navigation' : 'الملاحة الرئيسية'}">
      <div class="site-container nav-inner">
        <a href="${navPath('/')}" class="nav-brand">
          <img src="/assets/icons/brand.png" alt="${t.brand}" width="32" height="32" class="nav-logo">
          <span class="nav-title">${t.brand}</span>
        </a>
        <button class="nav-toggle" aria-expanded="false" aria-label="${isEn ? 'Toggle menu' : 'تبديل القائمة'}" data-nav-toggle>
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <div class="nav-menu" data-nav-menu>
          <a href="#equipment" class="nav-link">${t.navEquipment}</a>
          <a href="#drivers" class="nav-link">${t.navDrivers}</a>
          <a href="#about" class="nav-link">${t.navAbout}</a>
          <a href="${t.navLanguageLink}" class="nav-lang" hreflang="${isEn ? 'ar' : 'en'}">${t.navLanguage}</a>
        </div>
      </div>
    </nav>

    <main class="site-main">
      <section class="section hero">
        <div class="hero-bg"></div>
        <div class="site-container hero-content">
          <h1 class="hero-title">${esc(t.heroTitle)}</h1>
          <p class="hero-subtitle">${esc(t.heroSubtitle)}</p>
          <div class="hero-ctas">
            <a href="#early-access" class="btn btn-primary" data-early-access-cta ${!earlyAccessEnabled ? 'style="display:none;"' : ''}>${esc(t.heroCtaPrimary)}</a>
            <a href="#about" class="btn btn-secondary">${esc(t.heroCtaSecondary)}</a>
          </div>
        </div>
      </section>

      <section id="about" class="section section-light">
        <div class="site-container section-inner">
          <h2 class="section-title">${esc(t.whatIsTitle)}</h2>
          <p class="section-text">${esc(t.whatIsText)}</p>
        </div>
      </section>

      <section class="section section-dark">
        <div class="site-container">
          <h2 class="section-title text-center">${esc(t.howItWorksTitle)}</h2>
          <div class="grid grid-3">
            <div class="card hiw-card">
              <h3>${esc(t.hiwCustomerTitle)}</h3>
              <ol class="hiw-list">
                ${t.hiwCustomerSteps.map(s => `<li>${esc(s)}</li>`).join('')}
              </ol>
            </div>
            <div class="card hiw-card">
              <h3>${esc(t.hiwProviderTitle)}</h3>
              <ol class="hiw-list">
                ${t.hiwProviderSteps.map(s => `<li>${esc(s)}</li>`).join('')}
              </ol>
            </div>
            <div class="card hiw-card">
              <h3>${esc(t.hiwDriverTitle)}</h3>
              <ol class="hiw-list">
                ${t.hiwDriverSteps.map(s => `<li>${esc(s)}</li>`).join('')}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section id="equipment" class="section section-light">
        <div class="site-container">
          <div class="text-center section-header">
            <h2 class="section-title">${esc(t.equipmentTitle)}</h2>
            <p class="section-text">${esc(t.equipmentText)}</p>
          </div>
          <div class="tags-cloud">
            ${t.categories.map(c => `<span class="tag">${esc(c)}</span>`).join('')}
          </div>
        </div>
      </section>

      <section id="drivers" class="section section-gray">
        <div class="site-container section-inner">
          <h2 class="section-title">${esc(t.driverTitle)}</h2>
          <p class="section-text">${esc(t.driverText)}</p>
        </div>
      </section>

      <section class="section section-light">
        <div class="site-container">
          <div class="grid grid-3">
            <div class="card info-card">
              <h3>${esc(t.providerTitle)}</h3>
              <p>${esc(t.providerText)}</p>
            </div>
            <div class="card info-card">
              <h3>${esc(t.gccTitle)}</h3>
              <p>${esc(t.gccText)}</p>
            </div>
            <div class="card info-card">
              <h3>${esc(t.trustTitle)}</h3>
              <p>${esc(t.trustText)}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="section section-primary banner-app">
        <div class="site-container text-center">
          <h2 class="app-title">${esc(t.appTitle)}</h2>
        </div>
      </section>

      <section id="early-access" class="section section-light ea-section" data-early-access-section ${!earlyAccessEnabled ? 'style="display:none;"' : ''}>
        <div class="site-container section-inner ea-container">
          <h2 class="section-title">${esc(t.earlyTitle)}</h2>
          <p class="section-text">${esc(t.earlySubtitle)}</p>
          
          <div data-ea-closed-message style="display:none;" class="ea-status error text-center">
            ${esc(t.eaClosedMsg)}
          </div>
          
          <form class="ea-form" data-ea-form>
            <div class="ea-status" data-ea-status aria-live="polite"></div>
            
            <div class="form-group">
              <label for="ea-email">${esc(t.eaEmail)}</label>
              <input type="email" id="ea-email" name="email" maxlength="254" required class="form-control">
            </div>
            
            <div class="form-group">
              <label for="ea-name">${esc(t.eaName)}</label>
              <input type="text" id="ea-name" name="name" maxlength="100" class="form-control">
            </div>
            
            <div class="grid grid-2">
              <div class="form-group">
                <label for="ea-country">${esc(t.eaCountry)}</label>
                <select id="ea-country" name="country" class="form-control">
                  <option value="">${isEn ? 'Choose a country (optional)' : 'اختر الدولة (اختياري)'}</option>
                  ${[['SA', 'السعودية', 'Saudi Arabia'], ['AE', 'الإمارات', 'UAE'], ['KW', 'الكويت', 'Kuwait'], ['QA', 'قطر', 'Qatar'], ['BH', 'البحرين', 'Bahrain'], ['OM', 'عُمان', 'Oman']].map(([code, ar, en]) => `<option value="${code}">${isEn ? en : ar}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="ea-lang">${esc(t.eaLang)}</label>
                <select id="ea-lang" name="language" class="form-control">
                  <option value="">-</option>
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            <div class="form-check">
              <input type="checkbox" id="ea-consent" name="consentMarketing" value="true">
              <label for="ea-consent">${esc(t.eaConsent)}</label>
            </div>
            <button type="submit" class="btn btn-primary btn-block ea-submit" data-ea-submit>
              ${esc(t.eaSubmit)}
            </button>
            <div class="ea-privacy text-center">
              ${esc(t.eaPrivacyNotice)} <a href="${navPath('/privacy')}">${esc(t.eaPrivacyLink)}</a>
            </div>
          </form>
        </div>
      </section>

      <section class="section section-gray">
        <div class="site-container">
          <h2 class="section-title text-center">${esc(t.faqTitle)}</h2>
          <div class="faq-list">
            ${faqList.map(faq => `
              <details class="faq-item">
                <summary class="faq-q">${esc(faq.question)}</summary>
                <div class="faq-a"><p>${esc(faq.answer)}</p></div>
              </details>
            `).join('')}
          </div>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="site-container">
        <div class="footer-grid">
          <div class="footer-col">
            <h3>${esc(t.footerAbout)}</h3>
            <p>${esc(t.footerAboutText)}</p>
          </div>
          <div class="footer-col">
            <h3>${esc(t.footerLinks)}</h3>
            <ul class="footer-links">
              <li><a href="${navPath('/terms')}">${esc(t.terms)}</a></li>
              <li><a href="${navPath('/privacy')}">${esc(t.privacy)}</a></li>
              <li><a href="${navPath('/account-deletion')}">${esc(t.deleteAcc)}</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h3>${esc(t.footerContact)}</h3>
            <p><a href="mailto:heavyar.official@gmail.com">heavyar.official@gmail.com</a></p>
            <div class="footer-cert">
              <a href="https://eauthenticate.saudibusiness.gov.sa/certificate-details/0000195630" target="_blank" rel="noopener noreferrer" aria-label="Commercial Registration Certificate">
                <img src="/assets/cert/sbc-certificate.png" alt="SBC Certificate" width="60" class="cert-img" loading="lazy">
              </a>
              <span class="cr-text">${esc(t.crInfo)}</span>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>${esc(t.rights)}</p>
        </div>
      </div>
    </footer>
    <script src="/assets/site.js"></script>
  `;
}
