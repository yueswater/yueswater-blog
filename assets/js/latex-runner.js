(function () {
  var _uid = 0;

  function initRunners() {
    document.querySelectorAll('.latex-runner:not([data-init])').forEach(function (el) {
      el.setAttribute('data-init', '1');
      var id = 'lr' + (++_uid);

      var pre = el.querySelector('.latex-source');
      var source = pre ? pre.textContent.replace(/^\n/, '').trimEnd() : '';
      if (pre) pre.remove();

      /* ── header ── */
      var defaultEngine = el.getAttribute('data-engine') || 'pdflatex';
      var header = document.createElement('div');
      header.className = 'latex-runner-header';
      header.innerHTML =
        '<span class="latex-runner-label">LaTeX</span>' +
        '<select class="latex-runner-engine">' +
          ['pdflatex', 'lualatex', 'xelatex'].map(function (e) {
            return '<option value="' + e + '"' +
              (e === defaultEngine ? ' selected' : '') + '>' + e + '</option>';
          }).join('') +
        '</select>' +
        '<button class="latex-runner-run">' +
          '<i class="fa-solid fa-play"></i> Run' +
        '</button>';

      /* ── CodeMirror container ── */
      var cmWrap = document.createElement('div');

      /* ── hidden form → iframe ── */
      var form = document.createElement('form');
      form.method  = 'POST';
      form.action  = 'https://texlive.net/cgi-bin/latexcgi';
      form.enctype = 'multipart/form-data';
      form.target  = id + '-frame';
      form.style.display = 'none';
      ['filecontents[]', 'filename[]', 'engine', 'return'].forEach(function (name) {
        var inp = document.createElement('input');
        inp.type = 'hidden';
        inp.name = name;
        form.appendChild(inp);
      });
      form.querySelector('[name="filename[]"]').value = 'document.tex';
      form.querySelector('[name="return"]').value     = 'pdf';

      /* ── output iframe ── */
      var iframe = document.createElement('iframe');
      iframe.name = id + '-frame';

      el.insertBefore(header, el.firstChild);
      el.appendChild(cmWrap);
      el.appendChild(form);
      el.appendChild(iframe);

      /* ── init CodeMirror ── */
      var cm = CodeMirror(cmWrap, {
        value:          source,
        mode:           'stex',
        theme:          'dracula',
        lineNumbers:    true,
        lineWrapping:   false,
        tabSize:        2,
        indentWithTabs: false,
        viewportMargin: Infinity,
        extraKeys: {
          Tab: function (cm) { cm.replaceSelection('  '); }
        }
      });

      /* ── wire up button ── */
      var btn = header.querySelector('.latex-runner-run');
      btn.addEventListener('click', function () {
        var engine = header.querySelector('.latex-runner-engine').value;
        form.querySelector('[name="filecontents[]"]').value = cm.getValue();
        form.querySelector('[name="engine"]').value         = engine;

        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Compiling…';
        btn.disabled  = true;
        iframe.classList.add('visible');

        iframe.onload = function () {
          btn.innerHTML = '<i class="fa-solid fa-play"></i> Run';
          btn.disabled  = false;
        };

        form.submit();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRunners);
  } else {
    initRunners();
  }
})();
