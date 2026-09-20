(function () {
  'use strict';

  var selector = '.sbc-verify-seal';
  var observed = new WeakSet();
  var backgroundChecks = new WeakMap();

  function backgroundUrls(element) {
    var background = getComputedStyle(element).backgroundImage;
    if (!background || background === 'none') return [];
    var urls = [];
    var pattern = /url\((['"]?)(.*?)\1\)/g;
    var match;
    while ((match = pattern.exec(background)) !== null) {
      if (match[2]) urls.push(match[2]);
    }
    return urls;
  }

  function verifiedBackground(element, container) {
    var urls = backgroundUrls(element);
    if (urls.length === 0) return false;

    var key = urls.join('\n');
    var check = backgroundChecks.get(element);
    if (!check || check.key !== key) {
      check = { key: key, states: urls.map(function () { return 'pending'; }) };
      backgroundChecks.set(element, check);
      urls.forEach(function (url, index) {
        var image = new Image();
        image.onload = function () {
          check.states[index] = image.naturalWidth > 0 && image.naturalHeight > 0 ? 'loaded' : 'failed';
          update(container);
        };
        image.onerror = function () {
          check.states[index] = 'failed';
          update(container);
        };
        image.src = url;
      });
    }
    return check.states.every(function (state) { return state === 'loaded'; });
  }

  function hasSuccessfulVisual(container) {
    var images = container.querySelectorAll('img');
    if (images.length > 0) {
      for (var i = 0; i < images.length; i += 1) {
        if (!images[i].complete || images[i].naturalWidth <= 0 || images[i].naturalHeight <= 0) return false;
      }
      return true;
    }

    if (container.querySelector('canvas, svg')) return true;
    // Do not infer success from iframe load: browsers may fire it for a blocked
    // or error document whose contents cannot be inspected cross-origin.

    var candidates = [container].concat(Array.prototype.slice.call(container.querySelectorAll('*')));
    var hasBackground = false;
    var allBackgroundsLoaded = true;
    for (var j = 0; j < candidates.length; j += 1) {
      if (backgroundUrls(candidates[j]).length > 0) {
        hasBackground = true;
        if (!verifiedBackground(candidates[j], container)) allBackgroundsLoaded = false;
      }
    }
    return hasBackground && allBackgroundsLoaded;
  }

  function update(container) {
    if (!container || !container.matches(selector)) return;
    if (hasSuccessfulVisual(container)) container.setAttribute('data-seal-ready', 'true');
    else container.removeAttribute('data-seal-ready');
  }

  function observe(container) {
    if (observed.has(container)) return;
    observed.add(container);

    container.addEventListener('load', function (event) {
      update(container);
    }, true);
    container.addEventListener('error', function () {
      update(container);
    }, true);

    new MutationObserver(function () {
      update(container);
    }).observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'style', 'class'] });
    update(container);
  }

  function discover() {
    document.querySelectorAll(selector).forEach(observe);
  }

  function start() {
    discover();
    new MutationObserver(discover).observe(document.documentElement, { childList: true, subtree: true });
  }

  start();
}());