// A link to something inside a closed fold (an "式 (n)" reference, a footnote, a #hash) opens the fold(s) around it
// first, so the browser has a visible target to scroll to. See scripts/foldDiv.js.
(function () {
  function openAround(el) {
    var opened = false;
    for (var d = el && el.closest && el.closest('details.fold'); d; d = d.parentElement && d.parentElement.closest('details.fold')) {
      if (!d.open) { d.open = true; opened = true; }
    }
    return opened;
  }
  function target(hash) {
    if (!hash || hash.length < 2) return null;
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); } catch (e) { return null; }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a) openAround(target(a.getAttribute('href')));
  });
  window.addEventListener('hashchange', function () { openAround(target(location.hash)); });
  window.addEventListener('load', function () {
    var t = target(location.hash);
    if (t && openAround(t)) t.scrollIntoView();
  });
})();
