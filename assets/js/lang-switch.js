(function () {
  // Every bilingual page's alternate-URL lookup comes from its own
  // <link rel="alternate" hreflang="..."> tags in <head> — emitted by
  // _filters/seo.lua from each page's `alternate-lang` frontmatter.
  // That's the single source of truth (also used for SEO), so there's
  // no separate page map to keep in sync here: add a new bilingual post
  // by setting `alternate-lang` in its frontmatter, and this just works.
  function getAltHref(isEn) {
    var wantedHreflang = isEn ? 'zh-TW' : 'en';
    var link = document.querySelector(
      'link[rel="alternate"][hreflang="' + wantedHreflang + '"]'
    );
    if (!link) return null;

    try {
      return new URL(link.href).pathname;
    } catch (e) {
      return link.getAttribute('href');
    }
  }

  // Navbar label translations: href substring → [zh, en]
  var NAV_LABELS = [
    { href: '/articles', zh: '文章', en: 'Articles' },
    { href: '/projects', zh: '專案', en: 'Projects' },
    { href: '/dsa', zh: 'DSA 筆記', en: 'DSA Notes' },
    { href: '/diary', zh: '日記', en: 'Diary' },
    { href: '/about', zh: '關於', en: 'About' },
    { href: '/glossary', zh: '術語表', en: 'Glossary' },
  ];

  // Glassmorphism navbar on scroll
  (function () {
    var header = document.getElementById('quarto-header');
    if (!header) return;
    var THRESHOLD = 80;

    function onScroll() {
      if (window.scrollY > THRESHOLD) {
        header.classList.add('navbar-glass');
      } else {
        header.classList.remove('navbar-glass');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // apply immediately in case page is already scrolled
  })();

  document.addEventListener('DOMContentLoaded', function () {
    var isEn = document.documentElement.lang === 'en';
    var altHref = getAltHref(isEn);

    // Translate navbar labels based on current language
    var allNavLinks = document.querySelectorAll('.navbar-nav .nav-link');
    allNavLinks.forEach(function (a) {
      var href = (a.getAttribute('href') || '');
      NAV_LABELS.forEach(function (entry) {
        if (href.indexOf(entry.href) !== -1) {
          a.textContent = isEn ? entry.en : entry.zh;
        }
      });
    });

    var navbarNav =
      document.querySelector('.navbar-nav.ms-auto') ||
      document.querySelector('.navbar-nav');
    if (!navbarNav) return;

    var li = document.createElement('li');
    li.className = 'nav-item lang-switcher';

    var LANG_SVG =
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" ' +
      'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/>' +
      '<path d="M2 5h12"/><path d="M7 2h1"/>' +
      '<path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>' +
      '</svg>';

    if (altHref) {
      li.innerHTML =
        '<a class="nav-link lang-icon-link" href="' + altHref + '" title="' +
        (isEn ? '切換至繁體中文' : 'Switch to English') +
        '">' + LANG_SVG + '</a>';
    } else {
      li.innerHTML =
        '<span class="nav-link lang-icon-inactive" title="' +
        (isEn ? 'English' : '繁體中文') +
        '">' + LANG_SVG + '</span>';
    }

    navbarNav.appendChild(li);
  });
})();
