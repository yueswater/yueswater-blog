// Hover (or focus) a link inside a post that points at something on the same page (a footnote,
// a citation, a figure or table, an equation, a heading; see ref-content.js): what it points at
// pops up in a square-cornered tooltip that unfolds out of the link like the macOS "genie"
// minimise effect (and folds back into it when it closes). Clicking the link still jumps there.
// The tooltip goes above or below the link, whichever side of the viewport has the room.
(function () {
  if (!window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;

  var SHOW_DELAY = 120;
  var HIDE_DELAY = 220;
  var GAP = 10;
  var MARGIN = 8;
  var TOP = 80;          // the fixed site header covers the top of the viewport
  var OPEN_MS = 460;
  var CLOSE_MS = 260;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var tip = null;      // { root, body, ref, anim }
  var showTimer = 0;
  var hideTimer = 0;

  function clearTimers() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
  }

  function destroy() {
    if (!tip) return;
    if (tip.anim) tip.anim.cancel();
    if (tip.root.parentNode) tip.root.parentNode.removeChild(tip.root);
    tip = null;
  }

  // clip-path polygon: a funnel whose narrow end sits on the footnote number (ax = its x in
  // % of the tooltip width), opening into the full rectangle. `up` = the tooltip is above
  // the number, so the funnel's tip is on the bottom edge.
  function polygon(ax, up, stage) {
    var y = up ? 100 : 0;                 // the edge touching the number
    var far = up ? 0 : 100;               // the opposite edge
    var mid = up ? 55 : 45;               // how far the body has climbed in the middle frame
    var pinch = 7;                        // half-width of the funnel's neck, in %
    if (stage === 0) return 'polygon(' + ax + '% ' + y + '%, ' + ax + '% ' + y + '%, ' + ax + '% ' + y + '%, ' + ax + '% ' + y + '%)';
    if (stage === 1) {
      return 'polygon(' + (ax - 30) + '% ' + mid + '%, ' + (ax + 30) + '% ' + mid + '%, ' +
             (ax + pinch) + '% ' + y + '%, ' + (ax - pinch) + '% ' + y + '%)';
    }
    return 'polygon(0% ' + far + '%, 100% ' + far + '%, 100% ' + y + '%, 0% ' + y + '%)';
  }

  function open(ref) {
    var pv = window.ChicRefContent && window.ChicRefContent.preview(ref);
    if (!pv) return;
    if (tip && tip.ref === ref) { clearTimeout(hideTimer); if (tip.closing) reopen(); return; }
    destroy();

    var root = document.createElement('div');
    root.className = 'fn-tip fn-tip-' + pv.kind;
    root.setAttribute('role', 'tooltip');
    var body = document.createElement('div');
    body.className = 'fn-tip-body';
    if (pv.kind !== 'footnote' && pv.kind !== 'cite' && pv.kind !== 'section') body.classList.add('post-content');
    body.appendChild(pv.node);
    root.appendChild(body);
    root.style.visibility = 'hidden';
    document.body.appendChild(root);

    // place it where the room is: above the link when it fits there, else below when it fits
    // there, else on the roomier side with the card capped to that room (it scrolls inside)
    var r = ref.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var vh = document.documentElement.clientHeight;
    var roomAbove = r.top - GAP - TOP;
    var roomBelow = vh - r.bottom - GAP - MARGIN;
    var h = root.offsetHeight;
    var up = h <= roomAbove || (h > roomBelow && roomAbove > roomBelow);
    var room = up ? roomAbove : roomBelow;
    if (h > room) {
      body.style.maxHeight = Math.max(80, room) + 'px';
      body.style.overflowY = 'auto';
      h = root.offsetHeight;
    }
    var w = root.offsetWidth;
    var top = up ? r.top - h - GAP : r.bottom + GAP;
    top = Math.max(TOP, Math.min(top, vh - h - MARGIN));
    var cx = r.left + r.width / 2;
    var left = Math.max(MARGIN, Math.min(cx - w / 2, vw - w - MARGIN));
    root.style.left = left + 'px';
    root.style.top = top + 'px';
    var ax = Math.max(4, Math.min(96, ((cx - left) / w) * 100));
    root.style.visibility = '';

    tip = { root: root, body: body, ref: ref, ax: ax, up: up, anim: null, closing: false };
    ref.setAttribute('aria-describedby', 'fn-tip-live');
    root.id = 'fn-tip-live';

    var drift = up ? 10 : -10;
    if (reduceMotion.matches || !body.animate) {
      tip.anim = body.animate ? body.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, fill: 'both' }) : null;
      return;
    }
    tip.anim = body.animate([
      { clipPath: polygon(ax, up, 0), transform: 'translateY(' + drift + 'px)', opacity: 0 },
      { clipPath: polygon(ax, up, 1), transform: 'translateY(' + drift / 2 + 'px)', opacity: 1, offset: 0.45 },
      { clipPath: polygon(ax, up, 2), transform: 'translateY(0)', opacity: 1 }
    ], { duration: OPEN_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' });
  }

  // the pointer came back while it was folding away: unfold again from where it is
  function reopen() {
    if (!tip || !tip.anim) return;
    tip.closing = false;
    tip.anim.onfinish = null;
    tip.anim.playbackRate = 1;
    tip.anim.play();
  }

  function close() {
    if (!tip || tip.closing) return;
    var current = tip;
    current.closing = true;
    if (current.ref) current.ref.removeAttribute('aria-describedby');
    var anim = current.anim;
    if (!anim || reduceMotion.matches) { destroy(); return; }
    anim.onfinish = function () { if (tip === current && current.closing) destroy(); };
    // fold back into the number a bit faster than it opened
    anim.playbackRate = -OPEN_MS / CLOSE_MS;
    anim.play();
  }

  function scheduleShow(ref) {
    clearTimers();
    showTimer = setTimeout(function () { open(ref); }, SHOW_DELAY);
  }

  function scheduleHide() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(close, HIDE_DELAY);
  }

  function refOf(target) {
    var a = target.closest && target.closest('.post-content a[href^="#"]');
    if (!a || a.classList.contains('headerlink') || /^#reffn_/.test(a.getAttribute('href'))) return null;
    return a;
  }

  document.addEventListener('mouseover', function (e) {
    var ref = refOf(e.target);
    if (ref) { scheduleShow(ref); return; }
    if (tip && tip.root.contains(e.target)) clearTimeout(hideTimer), tip.closing && reopen();
  });
  document.addEventListener('mouseout', function (e) {
    var to = e.relatedTarget;
    var ref = refOf(e.target);
    if (ref && !(to && ref.contains(to))) { scheduleHide(); return; }
    if (tip && tip.root.contains(e.target) && !(to && tip.root.contains(to)) && !(to && tip.ref && tip.ref.contains(to))) scheduleHide();
  });
  document.addEventListener('focusin', function (e) {
    var ref = refOf(e.target);
    if (ref) { clearTimers(); open(ref); }
  });
  document.addEventListener('focusout', function (e) { if (refOf(e.target)) scheduleHide(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { clearTimers(); destroy(); } });
  // a fixed tooltip would drift away from its number while scrolling
  window.addEventListener('scroll', function () { clearTimers(); if (tip) destroy(); }, { passive: true });
})();
