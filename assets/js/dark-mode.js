(function () {
  /* ── Lucide SVGs ──────────────────────────────────────────── */
  var SVG_SUN =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" ' +
    'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="12" cy="12" r="4"/>' +
    '<path d="M12 2v2"/><path d="M12 20v2"/>' +
    '<path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>' +
    '<path d="M2 12h2"/><path d="M20 12h2"/>' +
    '<path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>' +
    '</svg>';

  var SVG_MOON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" ' +
    'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>' +
    '</svg>';

  /* ── Helpers ──────────────────────────────────────────────── */
  function isDark() {
    // Quarto stores 'default' (light) or 'alternate' (dark)
    return localStorage.getItem('quarto-color-scheme') === 'alternate';
  }

  function updateBtn(btn) {
    var dark = isDark();
    btn.innerHTML = dark ? SVG_SUN : SVG_MOON;
    btn.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
  }

  /* ── Init ─────────────────────────────────────────────────── */
  function init() {
    // Find the search button – try Quarto's known IDs/classes
    var anchor =
      document.getElementById('quarto-search') ||
      document.querySelector('.quarto-navbar-tools') ||
      document.querySelector('[id^="quarto-search"]');

    if (!anchor) return;

    var btn = document.createElement('button');
    btn.id    = 'dark-mode-toggle';
    btn.className = 'nav-link dark-mode-btn';
    btn.setAttribute('type', 'button');
    updateBtn(btn);

    btn.addEventListener('click', function () {
      if (typeof window.quartoToggleColorScheme === 'function') {
        window.quartoToggleColorScheme();
      }
      updateBtn(btn);
    });

    anchor.parentNode.insertBefore(btn, anchor);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
