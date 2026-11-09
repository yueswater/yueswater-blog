// Tiny toast: window.siteToast('message'). Slides in from the right, fades out leftwards.
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
    el.textContent = message;
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
