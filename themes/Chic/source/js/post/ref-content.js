// What a link inside a post points at, as a copy that can be shown in a tooltip (js/post/footnote-tip.js).
// ChicRefContent.preview(a) -> { kind, node } or null when the link is not one of these:
//   footnote   a footnote number              -> the footnote's text
//   cite       a citation (.citation-link)    -> its entry in the reference list
//   figure     "圖 1" / "表 1" / "Figure 1"   -> the figure or table itself, caption included
//   equation   "式 (1)" / "Eq. (1)"           -> the display equation
//   section    a link to a heading            -> the heading and its first paragraph
// Outside links (http…) are never touched; the copy has no ids, so the page keeps unique ids.
(function () {
  function targetOf(a) {
    var raw = a.getAttribute('href') || '';
    if (raw.charAt(0) !== '#' || raw.length < 2) return null;
    try { return document.getElementById(decodeURIComponent(raw.slice(1))); } catch (e) { return null; }
  }

  function stripIds(root) {
    if (root.removeAttribute) root.removeAttribute('id');
    if (root.querySelectorAll) Array.prototype.forEach.call(root.querySelectorAll('[id]'), function (n) { n.removeAttribute('id'); });
    return root;
  }

  function wrap(kids) {
    var frag = document.createDocumentFragment();
    kids.forEach(function (k) { frag.appendChild(stripIds(k)); });
    return frag;
  }

  // the footnote's own content: without its leading "1." and the back-link arrow
  function footnote(note) {
    var seenSup = false;
    var kids = [];
    Array.prototype.forEach.call(note.childNodes, function (node) {
      if (!seenSup && node.nodeType === 1 && node.tagName === 'SUP') { seenSup = true; return; }
      if (node.nodeType === 1 && node.tagName === 'A' && /^#reffn_/.test(node.getAttribute('href') || '')) return;
      var copy = node.cloneNode(true);
      if (seenSup && copy.nodeType === 3) {
        copy.nodeValue = copy.nodeValue.replace(/^\s*[.．。]\s*/, '');
        seenSup = false;
      }
      kids.push(copy);
    });
    return wrap(kids);
  }

  function section(heading) {
    var title = heading.cloneNode(true);
    Array.prototype.forEach.call(title.querySelectorAll('.headerlink'), function (n) { n.remove(); });
    var kids = [title];
    var next = heading.nextElementSibling;
    if (next && next.tagName === 'P') kids.push(next.cloneNode(true));
    var frag = wrap(kids);
    // a heading keeps its own page-sized style; here it is only the first line of the card
    var h = frag.firstChild;
    h.className = 'fn-tip-heading';
    return frag;
  }

  function preview(a) {
    var target = targetOf(a);
    if (!target) return null;
    if (/^reffn_/.test(a.id || '')) return { kind: 'footnote', node: footnote(target) };
    if (target.classList.contains('reference-entry')) return { kind: 'cite', node: wrap([target.cloneNode(true)]) };
    if (target.tagName === 'FIGURE') return { kind: 'figure', node: wrap([target.cloneNode(true)]) };
    if (/^mjx-eqn:/.test(target.id || '')) {
      var box = target.closest('mjx-container');
      return box ? { kind: 'equation', node: wrap([box.cloneNode(true)]) } : null;
    }
    if (/^H[1-6]$/.test(target.tagName)) return { kind: 'section', node: section(target) };
    return null;
  }

  window.ChicRefContent = { preview: preview };
})();
