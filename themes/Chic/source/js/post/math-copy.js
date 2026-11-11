// Double-click a formula in a post to copy its LaTeX source (with a toast).
(function () {
  // the toast text around the LaTeX wordmark: [before, after]
  var MESSAGE = {
    zh: ['已複製 ', ' 原始碼 '],
    en: ['', ' source copied']
  };

  // the LaTeX wordmark in plain HTML (see .tex-wordmark in toast.css)
  function wordmark() {
    var span = document.createElement('span');
    span.className = 'tex-wordmark';
    span.setAttribute('role', 'img');
    span.setAttribute('aria-label', 'LaTeX');
    span.innerHTML = 'L<span class="texhtml-upper texhtml-a">a</span>T<span class="texhtml-upper texhtml-e">e</span>X';
    return span;
  }

  function toastMessage(lang) {
    var frag = document.createDocumentFragment();
    frag.appendChild(document.createTextNode(MESSAGE[lang][0]));
    frag.appendChild(wordmark());
    frag.appendChild(document.createTextNode(MESSAGE[lang][1]));
    return frag;
  }

  // the TeX MathJax was given for this container (without the \( \) / \[ \] delimiters)
  function sourceOf(container) {
    var MJ = window.MathJax;
    var doc = MJ && MJ.startup && MJ.startup.document;
    if (!doc || !doc.math) return null;
    var items = typeof doc.math.toArray === 'function' ? doc.math.toArray() : Array.from(doc.math);
    for (var i = 0; i < items.length; i++) {
      if (items[i].typesetRoot === container) return items[i].math;
    }
    return null;
  }

  // a numbered equation is stored as \begin{equation}\label{..} ... \end{equation}: copy
  // only the formula. aligned / gather and the like are kept whole, they are the formula.
  function clean(tex) {
    tex = tex.replace(/\\label\{[^}]*\}/g, '');
    var m = tex.match(/^\s*\\begin\{(equation\*?)\}([\s\S]*)\\end\{\1\}\s*$/);
    if (m) tex = m[2];
    return tex.trim();
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('copy failed'));
    });
  }

  document.addEventListener('dblclick', function (e) {
    var container = e.target.closest && e.target.closest('mjx-container');
    if (!container || !container.closest('.post-content')) return;
    // "式 (3)" links are inline formulas too, but double-clicking them is not a copy request
    if (container.closest('a')) return;
    var tex = sourceOf(container);
    if (!tex) return;
    var sel = window.getSelection && window.getSelection();
    if (sel) sel.removeAllRanges();
    copyText(clean(tex)).then(function () {
      var lang = (document.documentElement.lang || '').indexOf('zh') === 0 ? 'zh' : 'en';
      if (window.siteToast) window.siteToast(toastMessage(lang));
    }, function () { });
  });
})();
