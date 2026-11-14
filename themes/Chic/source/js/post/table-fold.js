// Row groups of a .table-fold table (scripts/tableFold.js): a group has a summary row shown while closed and detail
// rows shown while open. Every toggle button of the group (the summary row's and the merged cell's) flips it.
(function () {
  document.addEventListener('click', function (e) {
    // the toggle button, or anywhere on a closed group's summary row ("展開查看更多")
    var btn = e.target.closest && e.target.closest('.tf-toggle');
    var sum = !btn && e.target.closest && e.target.closest('tr.tf-sum');
    if (sum) btn = sum.querySelector('.tf-toggle');
    if (!btn) return;
    var id = btn.getAttribute('data-group');
    var table = btn.closest('table');
    var open = btn.getAttribute('aria-expanded') !== 'true';
    table.querySelectorAll('tr[data-group="' + id + '"]').forEach(function (tr) {
      tr.hidden = tr.classList.contains('tf-sum') ? open : !open;
    });
    table.querySelectorAll('.tf-toggle[data-group="' + id + '"]').forEach(function (b) {
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // the clicked button may now be in a hidden row: keep keyboard focus on the visible one
    var shown = table.querySelector('tr[data-group="' + id + '"]:not([hidden]) .tf-toggle');
    if (shown) shown.focus();
  });
})();
