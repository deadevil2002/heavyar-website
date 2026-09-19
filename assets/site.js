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
    toggle.addEventListener('click', () => {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !isExpanded);
      menu.classList.toggle('is-open');
    });
  }

  // Early Access Config override (only if the element exists)
  const eaSection = document.querySelector('[data-early-access-section]');
  const eaCtas = document.querySelectorAll('[data-early-access-cta]');
  
  if (eaSection) {
    fetch(`${apiBase}/api/early-access/config`)
      .then(res => {
        if (!res.ok) throw new Error('Not OK');
        return res.json();
      })
      .then(data => {
        if (data && data.enabled === true) {
          eaSection.style.display = '';
          eaCtas.forEach(cta => cta.style.display = '');
        } else {
          eaSection.style.display = 'none';
          eaCtas.forEach(cta => cta.style.display = 'none');
        }
      })
      .catch(err => {
        // Fail closed on network error or not OK status
        eaSection.style.display = 'none';
        eaCtas.forEach(cta => cta.style.display = 'none');
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
          eaCtas.forEach(cta => cta.style.display = 'none');
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
