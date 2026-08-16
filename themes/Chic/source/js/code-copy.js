(function () {
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
      btn.textContent = '複製';
      btn.id = 'code-copy-btn-' + i;

      figure.appendChild(btn);
    });

    var clipboard = new ClipboardJS('.code-copy-btn');

    clipboard.on('success', function (e) {
      var btn = e.trigger;
      var original = btn.textContent;
      btn.textContent = '已複製';
      btn.classList.add('copied');
      setTimeout(function () {
        btn.textContent = original;
        btn.classList.remove('copied');
      }, 1500);
      e.clearSelection();
    });
  });
})();
