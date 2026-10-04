(function () {
  'use strict';

  var loaded = false;
  var sealSource = 'https://eauthenticate.saudibusiness.gov.sa/EAuthSealApi/seal.js';

  function loadOfficialSeal() {
    if (loaded) return;
    loaded = true;
    var script = document.createElement('script');
    script.src = sealSource;
    script.async = true;
    script.referrerPolicy = 'strict-origin-when-cross-origin';
    document.head.appendChild(script);
  }

  function schedule() {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(loadOfficialSeal, { timeout: 2500 });
    } else {
      window.setTimeout(loadOfficialSeal, 500);
    }
  }

  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
}());
