(function () {
  // Font Awesome Free (CC BY 4.0): regular/copy.svg, solid/check.svg
  var COPY_ICON = '<svg class="code-copy-icon code-copy-icon-copy" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-hidden="true"><path fill="currentColor" d="M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l133.5 0c4.2 0 8.3 1.7 11.3 4.7l58.5 58.5c3 3 4.7 7.1 4.7 11.3L400 320c0 8.8-7.2 16-16 16zM192 384l192 0c35.3 0 64-28.7 64-64l0-197.5c0-17-6.7-33.3-18.7-45.3L370.7 18.7C358.7 6.7 342.5 0 325.5 0L192 0c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-16-48 0 0 16c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l16 0 0-48-16 0z"/></svg>';
  var CHECK_ICON = '<svg class="code-copy-icon code-copy-icon-check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-hidden="true"><path fill="currentColor" d="M434.8 70.1c14.3 10.4 17.5 30.4 7.1 44.7l-256 352c-5.5 7.6-14 12.3-23.4 13.1s-18.5-2.7-25.1-9.3l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l101.5 101.5 234-321.7c10.4-14.3 30.4-17.5 44.7-7.1z"/></svg>';

  document.addEventListener('DOMContentLoaded', function () {
    var figures = document.querySelectorAll('figure.highlight');
    if (!figures.length) return;

    figures.forEach(function (figure, i) {
      var codeCell = figure.querySelector('.code');
      if (!codeCell) return;

      var lines = codeCell.querySelectorAll('.line');
      var text = lines.length
        ? Array.prototype.map.call(lines, function (l) { return l.textContent; }).join('\n')
        : codeCell.textContent;

      var btn = document.createElement('button');
      btn.className = 'code-copy-btn';
      btn.type = 'button';
      btn.setAttribute('aria-label', '複製程式碼');
      btn.setAttribute('data-clipboard-text', text);
      btn.innerHTML = COPY_ICON + CHECK_ICON;
      btn.id = 'code-copy-btn-' + i;

      figure.appendChild(btn);
    });

    var clipboard = new ClipboardJS('.code-copy-btn');

    clipboard.on('success', function (e) {
      var btn = e.trigger;
      btn.classList.add('copied');
      setTimeout(function () {
        btn.classList.remove('copied');
      }, 1500);
      e.clearSelection();
    });
  });
})();
