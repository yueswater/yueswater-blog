// Tiny toast: window.siteToast('message') or window.siteToast(node). Slides in from the right, fades out leftwards.
(function () {
  var STAY = 2200;
  var host;

  function getHost() {
    if (host && document.body.contains(host)) return host;
    host = document.createElement('div');
    host.className = 'site-toasts';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    document.body.appendChild(host);
    return host;
  }

  window.siteToast = function (message) {
    if (!message) return;
    var el = document.createElement('div');
    el.className = 'site-toast';
    // one inner span, so mixed content (text + an inline element) is a single flex item
    // and the toast's gap does not open spaces inside the sentence
    var text = document.createElement('span');
    text.className = 'site-toast-text';
    if (typeof message === 'string') text.textContent = message;
    else text.appendChild(message); // a Node / DocumentFragment
    el.appendChild(text);
    getHost().appendChild(el);
    // next frame, so the starting (off-right, transparent) state is painted first
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add('is-in'); });
    });
    setTimeout(function () {
      el.classList.remove('is-in');
      el.classList.add('is-out');
      var remove = function () { if (el.parentNode) el.parentNode.removeChild(el); };
      el.addEventListener('transitionend', remove, { once: true });
      setTimeout(remove, 800); // fallback if the transition never fires
    }, STAY);
  };
})();
