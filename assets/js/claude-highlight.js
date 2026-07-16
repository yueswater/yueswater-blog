(function () {
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, PRE: 1, CODE: 1, TEXTAREA: 1 };
  var PATTERN = /\bClaude\b/g;

  // Shape ported from https://github.com/stevysmith/clawd-react (src/Clawd.tsx), static "happy" pose
  var CLAWD_BODY = '#da7756';
  var CLAWD_DARK = '#9c553e';

  var MASCOT_MARKUP =
    '<svg class="clawd-mascot" viewBox="-3 0 34 24" aria-hidden="true" focusable="false">' +
    '<rect x="2" y="0" width="24" height="14" fill="' + CLAWD_BODY + '" />' +
    '<rect x="-1" y="6.4" width="3" height="3.6" fill="' + CLAWD_BODY + '" />' +
    '<rect x="26" y="6.4" width="3" height="3.6" fill="' + CLAWD_BODY + '" />' +
    '<rect x="7" y="3" width="2" height="4" fill="#1a1a1a" />' +
    '<rect x="19" y="3" width="2" height="4" fill="#1a1a1a" />' +
    '<rect x="4" y="14" width="2.4" height="5" fill="' + CLAWD_DARK + '" />' +
    '<rect x="7.6" y="14" width="2.4" height="5" fill="' + CLAWD_DARK + '" />' +
    '<rect x="18" y="14" width="2.4" height="5" fill="' + CLAWD_DARK + '" />' +
    '<rect x="21.6" y="14" width="2.4" height="5" fill="' + CLAWD_DARK + '" />' +
    '</svg>';

  var mascotTemplate = document.createElement('template');
  mascotTemplate.innerHTML = MASCOT_MARKUP;

  function createMascot() {
    return mascotTemplate.content.firstElementChild.cloneNode(true);
  }

  function attachRandomPeek(span, mascot) {
    span.addEventListener('mouseenter', function () {
      var left = 15 + Math.random() * 70; // keep clear of the very edges
      mascot.style.setProperty('--clawd-left', left + '%');
    });
  }

  function shouldSkip(parent) {
    while (parent) {
      if (SKIP_TAGS[parent.tagName]) return true;
      if (parent.classList && parent.classList.contains('claude-highlight')) return true;
      parent = parent.parentNode;
    }
    return false;
  }

  function highlight(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || shouldSkip(node.parentNode)) {
          return NodeFilter.FILTER_REJECT;
        }
        PATTERN.lastIndex = 0;
        return PATTERN.test(node.nodeValue)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    });

    var nodes = [];
    var n;
    while ((n = walker.nextNode())) nodes.push(n);

    nodes.forEach(function (textNode) {
      var text = textNode.nodeValue;
      var frag = document.createDocumentFragment();
      var lastIndex = 0;
      var match;

      PATTERN.lastIndex = 0;
      while ((match = PATTERN.exec(text))) {
        if (match.index > lastIndex) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }
        var span = document.createElement('span');
        span.className = 'claude-highlight';
        span.textContent = match[0];
        var mascot = createMascot();
        span.appendChild(mascot);
        attachRandomPeek(span, mascot);
        frag.appendChild(span);
        lastIndex = PATTERN.lastIndex;
      }
      if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  function init() {
    highlight(document.body);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
