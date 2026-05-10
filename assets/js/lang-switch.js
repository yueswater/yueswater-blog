(function () {
  // Keys are full URL pathnames.
  // Trailing-slash paths are included so directory URLs are handled too.
  var PAGE_MAP = {
    // Root
    '/': '/index-en.html',
    '/index.html': '/index-en.html',
    '/index-en.html': '/index.html',
    // About
    '/about.html': '/about-en.html',
    '/about-en.html': '/about.html',
    // Articles listing
    '/articles/': '/articles/index-en.html',
    '/articles/index.html': '/articles/index-en.html',
    '/articles/index-en.html': '/articles/index.html',
    // Diary listing
    '/diary/': '/diary/index-en.html',
    '/diary/index.html': '/diary/index-en.html',
    '/diary/index-en.html': '/diary/index.html',
    // Projects listing
    '/projects/': '/projects/index-en.html',
    '/projects/index.html': '/projects/index-en.html',
    '/projects/index-en.html': '/projects/index.html',
    // Projects – econ-viz
    '/projects/posts/econ-viz/econ-viz.html': '/projects/posts/econ-viz/econ-viz-en.html',
    '/projects/posts/econ-viz/econ-viz-en.html': '/projects/posts/econ-viz/econ-viz.html',
    // Articles — LaTeX series
    '/articles/posts/latex/intro/latex-intro.html': '/articles/posts/latex/intro/latex-intro-en.html',
    '/articles/posts/latex/intro/latex-intro-en.html': '/articles/posts/latex/intro/latex-intro.html',
    '/articles/posts/latex/first-doc/latex-first-doc.html': '/articles/posts/latex/first-doc/latex-first-doc-en.html',
    '/articles/posts/latex/first-doc/latex-first-doc-en.html': '/articles/posts/latex/first-doc/latex-first-doc.html',
    '/articles/posts/latex/basic-setting/latex-basic-setting.html': '/articles/posts/latex/basic-setting/latex-basic-setting-en.html',
    '/articles/posts/latex/basic-setting/latex-basic-setting-en.html': '/articles/posts/latex/basic-setting/latex-basic-setting.html',
    // Articles — Python series
    '/articles/posts/python/id-function/python-id-function.html': '/articles/posts/python/id-function/python-id-function-en.html',
    '/articles/posts/python/id-function/python-id-function-en.html': '/articles/posts/python/id-function/python-id-function.html',
    '/articles/posts/python/zip-enum/python-zip-enum.html': '/articles/posts/python/zip-enum/python-zip-enum-en.html',
    '/articles/posts/python/zip-enum/python-zip-enum-en.html': '/articles/posts/python/zip-enum/python-zip-enum.html',
    // latex/math
    '/articles/posts/latex/math/math.html': '/articles/posts/latex/math/math-en.html',
    '/articles/posts/latex/math/math-en.html': '/articles/posts/latex/math/math.html',
    // python/lambda-filter-map-reduce
    '/articles/posts/python/lambda-filter-map-reduce/lambda-filter-map-reduce.html':    '/articles/posts/python/lambda-filter-map-reduce/lambda-filter-map-reduce-en.html',
    '/articles/posts/python/lambda-filter-map-reduce/lambda-filter-map-reduce-en.html': '/articles/posts/python/lambda-filter-map-reduce/lambda-filter-map-reduce.html',
  };

  // Navbar label translations: href substring → [zh, en]
  var NAV_LABELS = [
    { href: '/articles', zh: '文章', en: 'Articles' },
    { href: '/projects', zh: '專案', en: 'Projects' },
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

  function getPath() {
    var p = window.location.pathname;
    return p === '' ? '/' : p;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var path = getPath();
    var altHref = PAGE_MAP[path];
    var isEn = path.endsWith('-en.html') || path.endsWith('-en/');

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
