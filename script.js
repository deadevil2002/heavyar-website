// Language switching functionality
document.addEventListener('DOMContentLoaded', function() {
  const langButtons = document.querySelectorAll('.lang-btn');
  const html = document.documentElement;
  
  // Get saved language or default to Arabic
  let currentLang = localStorage.getItem('heavyar_lang') || 'ar';
  setLanguage(currentLang);
  
  // Language toggle event listeners
  langButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const lang = this.dataset.lang;
      setLanguage(lang);
      localStorage.setItem('heavyar_lang', lang);
    });
  });
  
  function setLanguage(lang) {
    currentLang = lang;
    
    // Update HTML attributes
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    
    // Update active button
    langButtons.forEach(btn => {
      if (btn.dataset.lang === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Update all elements with data-ar and data-en attributes
    const translatableElements = document.querySelectorAll('[data-ar][data-en]');
    translatableElements.forEach(element => {
      const text = element.dataset[lang];
      if (text) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.placeholder = text;
        } else {
          element.textContent = text;
        }
      }
    });
  }
  
  // Scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe elements with animation class
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  animatedElements.forEach(el => observer.observe(el));
  
  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});
