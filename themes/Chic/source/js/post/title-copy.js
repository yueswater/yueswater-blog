// A title with inline math ($Nash$ in the front matter) is typeset on the page, but copying it should
// give plain text ("Nash"), not whatever MathJax's markup flattens to. Each typeset piece is wrapped in
// <span class="title-math" data-plain="..."> (see scripts/titleHtml.js): on copy, swap it for data-plain.
(function () {
  document.addEventListener('copy', function (e) {
    var sel = window.getSelection && window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount || !e.clipboardData) return;
    var holder = document.createElement('div');
    for (var i = 0; i < sel.rangeCount; i++) holder.appendChild(sel.getRangeAt(i).cloneContents());
    var marks = holder.querySelectorAll('.title-math');
    if (!marks.length) return;
    marks.forEach(function (mark) {
      mark.replaceWith(document.createTextNode(mark.getAttribute('data-plain') || ''));
    });
    // innerText (which keeps the line breaks between rows) only works on an element that is rendered
    holder.style.cssText = 'position:fixed;left:-9999px;top:0;white-space:pre-wrap';
    document.body.appendChild(holder);
    var text = holder.innerText;
    var html = holder.innerHTML;
    document.body.removeChild(holder);
    e.clipboardData.setData('text/plain', text);
    e.clipboardData.setData('text/html', html);
    e.preventDefault();
  });
})();
