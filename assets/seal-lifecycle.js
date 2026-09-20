(function () {
  'use strict';

  var frameSelector = 'iframe.sbc-seal-frame';
  var officialOrigin = 'https://eauthenticate.saudibusiness.gov.sa';
  var officialPath = '/EAuthSealApi/seal';
  var expectedToken = 'eTlYY0g1Z0x3OUM2QmFkdmUyNk5rZz09';
  var observed = new WeakSet();

  function isOfficialFrame(frame) {
    try {
      var url = new URL(frame.getAttribute('src'), document.baseURI);
      var expectedLang = String(document.documentElement.lang || '').substring(0, 2).toLowerCase();
      return (expectedLang === 'ar' || expectedLang === 'en') &&
        url.origin === officialOrigin &&
        url.pathname === officialPath &&
        url.hash === '' &&
        Array.from(url.searchParams).length === 3 &&
        url.searchParams.get('token') === expectedToken &&
        url.searchParams.get('lang') === expectedLang &&
        url.searchParams.get('pos') === 'bottom';
    } catch (_error) {
      return false;
    }
  }

  function hide(frame) {
    frame.removeAttribute('data-seal-ready');
  }

  function observe(frame) {
    if (observed.has(frame)) return;
    observed.add(frame);
    hide(frame);

    // A blocked or error document can still dispatch load, so load is not a
    // readiness or reset signal. Only the provider message reveals the frame.
    frame.addEventListener('error', function () { hide(frame); });
    new MutationObserver(function () { hide(frame); })
      .observe(frame, { attributes: true, attributeFilter: ['src'] });
  }

  function discover() {
    document.querySelectorAll(frameSelector).forEach(observe);
  }

  window.addEventListener('message', function (event) {
    if (event.origin !== officialOrigin || !event.data || event.data.sbcSeal !== true) return;
    document.querySelectorAll(frameSelector).forEach(function (frame) {
      if (isOfficialFrame(frame) && frame.contentWindow === event.source) {
        frame.setAttribute('data-seal-ready', 'true');
      }
    });
  });

  discover();
  new MutationObserver(discover).observe(document.documentElement, { childList: true, subtree: true });
}());