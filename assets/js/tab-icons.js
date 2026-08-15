(function () {
  // Map of tab-label text (lowercased) -> devicons glyph class.
  // These are plain monochrome glyphs that follow currentColor by default
  // (no "colored" modifier applied), from the @dev.icons/core webfont.
  var LANG_ICON_CLASS = {
    python: 'devicons-python',
    nodejs: 'devicons-nodejs-icon',
    'c++': 'devicons-c-plusplus',
    c: 'devicons-c',
  };

  function makeIcon(cls) {
    var i = document.createElement('i');
    i.className = 'tab-lang-icon devicons ' + cls;
    i.setAttribute('aria-hidden', 'true');
    return i;
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.panel-tabset .nav-link').forEach(function (tab) {
      var key = tab.textContent.trim().toLowerCase();
      var cls = LANG_ICON_CLASS[key];
      if (!cls) return;
      tab.insertBefore(makeIcon(cls), tab.firstChild);
    });
  });
})();
