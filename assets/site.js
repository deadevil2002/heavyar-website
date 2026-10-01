document.addEventListener('DOMContentLoaded', () => {
  // Determine API base from meta tag or default to production origin
  let apiBase = 'https://heavyar-api.heavyar-official.workers.dev';
  const apiBaseMeta = document.querySelector('meta[name="heavyar-api-base"]');
  if (apiBaseMeta && apiBaseMeta.content) {
    // Strip trailing slash if present to safely append /api/...
    apiBase = apiBaseMeta.content.replace(/\/+$/, '');
  }

  // Mobile Nav
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.querySelector('[data-nav-menu]');
  if (toggle && menu) {
    const closeMenu = () => {
      toggle.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
    };

    toggle.addEventListener('click', () => {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isExpanded));
      menu.classList.toggle('is-open', !isExpanded);
    });

    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.classList.contains('is-open')) {
        closeMenu();
        toggle.focus();
      }
    });
    document.addEventListener('click', event => {
      if (!menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
    });
  }

  // Motion is progressive enhancement: all content remains visible without JS.
  const revealItems = document.querySelectorAll('[data-reveal]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (revealItems.length && !reduceMotion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-reveal');
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealItems.forEach(item => revealObserver.observe(item));
  }

  // Lightweight depth effects use transform-only updates and never move text.
  if (!reduceMotion) {
    const nav = document.querySelector('.site-nav');
    const depthScene = document.querySelector('[data-depth-scene]');
    let scrollFrame = 0;
    const updateDepth = () => {
      scrollFrame = 0;
      nav?.classList.toggle('is-scrolled', window.scrollY > 16);
      if (!depthScene) return;
      const rect = depthScene.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -rect.top / Math.max(rect.height, 1)));
      depthScene.style.setProperty('--depth-progress', progress.toFixed(3));
    };
    const requestDepthUpdate = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(updateDepth);
    };
    updateDepth();
    window.addEventListener('scroll', requestDepthUpdate, { passive: true });

    if (window.matchMedia('(pointer: fine)').matches) {
      document.querySelectorAll('[data-tilt], [data-tilt-card]').forEach(element => {
        let pointerFrame = 0;
        let nextX = 0;
        let nextY = 0;
        const applyTilt = () => {
          pointerFrame = 0;
          element.style.setProperty('--tilt-x', `${nextY * -3.5}deg`);
          element.style.setProperty('--tilt-y', `${nextX * 3.5}deg`);
        };
        element.addEventListener('pointermove', event => {
          const rect = element.getBoundingClientRect();
          nextX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          nextY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
          if (!pointerFrame) pointerFrame = requestAnimationFrame(applyTilt);
        });
        element.addEventListener('pointerleave', () => {
          nextX = 0;
          nextY = 0;
          if (!pointerFrame) pointerFrame = requestAnimationFrame(applyTilt);
        });
      });
    }
  }

  // Early Access Config override (only if the element exists)
  const eaSection = document.querySelector('[data-early-access-section]');
  
  if (eaSection) {
    fetch(`${apiBase}/api/early-access/config`)
      .then(res => {
        if (!res.ok) throw new Error('Not OK');
        return res.json();
      })
      .then(data => {
        if (data && data.enabled === true) {
          const form = eaSection.querySelector('[data-ea-form]');
          const closed = eaSection.querySelector('[data-ea-closed-message]');
          if (form) form.style.display = '';
          if (closed) closed.style.display = 'none';
        } else {
          const form = eaSection.querySelector('[data-ea-form]');
          const closed = eaSection.querySelector('[data-ea-closed-message]');
          if (form) form.style.display = 'none';
          if (closed) closed.style.display = 'block';
        }
      })
      .catch(() => {
        // Fail closed for submission while keeping the conversion destination visible.
        const form = eaSection.querySelector('[data-ea-form]');
        const closed = eaSection.querySelector('[data-ea-closed-message]');
        if (form) form.style.display = 'none';
        if (closed) closed.style.display = 'block';
      });
  }

  // Early Access Form
  const form = document.querySelector('[data-ea-form]');
  const status = document.querySelector('[data-ea-status]');
  const submitBtn = document.querySelector('[data-ea-submit]');
  const closedMsg = document.querySelector('[data-ea-closed-message]');

  if (form && status && submitBtn) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      status.className = 'ea-status';
      status.textContent = '';
      submitBtn.disabled = true;

      const formData = new FormData(form);
      const payload = {
        email: formData.get('email'),
      };

      const name = formData.get('name');
      const country = formData.get('country');
      const language = formData.get('language');
      const consentMarketing = formData.get('consentMarketing');

      if (name && name.trim() !== '') payload.name = name.trim();
      if (country && country.trim() !== '') payload.country = country.trim();
      if (language && language.trim() !== '') payload.language = language.trim();
      payload.consentMarketing = consentMarketing === 'true';

      const isEn = document.documentElement.lang === 'en';
      const genericErrorMsg = isEn ? 'An error occurred. Please try again.' : 'حدث خطأ. يرجى المحاولة مرة أخرى.';
      const validationErrorMsg = isEn ? 'Invalid input. Please check your email and details.' : 'بيانات غير صالحة. يرجى التحقق من البريد الإلكتروني والتفاصيل.';
      const successMsg = isEn ? 'Thank you. If a confirmation is needed, check your inbox and confirm your interest. Marketing updates remain optional.' : 'شكراً لك. إذا كان التأكيد مطلوباً، تحقق من بريدك الإلكتروني وأكّد اهتمامك. تبقى الرسائل التسويقية اختيارية.';

      fetch(`${apiBase}/api/early-access/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (res.status === 403) throw { status: 403 };
        if (res.status === 400) throw { status: 400 };
        if (!res.ok) throw { status: res.status };
        return res.json();
      })
      .then(() => {
        status.className = 'ea-status success';
        status.textContent = successMsg;
        form.reset();
      })
      .catch((err) => {
        if (err.status === 403) {
          form.style.display = 'none';
          if (closedMsg) {
            closedMsg.style.display = 'block';
            closedMsg.setAttribute('aria-live', 'assertive');
          }
        } else if (err.status === 400) {
          status.className = 'ea-status error';
          status.textContent = validationErrorMsg;
        } else if (err.status === 429) {
          status.className = 'ea-status error';
          status.textContent = isEn ? 'Too many attempts. Please wait before trying again.' : 'محاولات كثيرة. يرجى الانتظار قبل المحاولة مرة أخرى.';
        } else {
          status.className = 'ea-status error';
          status.textContent = genericErrorMsg;
        }
      })
      .finally(() => {
        submitBtn.disabled = false;
      });
    });
  }
});
