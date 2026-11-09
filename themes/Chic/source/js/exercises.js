// Option columns for practice questions: 4 across if every option fits on one line,
// else 2 across (A/C left, B/D right), else one per row. Re-checked on resize.
(function () {
  function fit() {
    document.querySelectorAll('.q-options').forEach(function (box) {
      var items = box.querySelectorAll('li');
      if (!items.length) return;
      var over = function () {
        return Array.prototype.some.call(items, function (li) { return li.scrollWidth > li.clientWidth + 1; });
      };
      box.classList.remove('opts-4', 'opts-2');
      box.classList.add('opts-probe', 'opts-4');
      if (over()) {
        box.classList.replace('opts-4', 'opts-2');
        if (over()) box.classList.remove('opts-2');
      }
      box.classList.remove('opts-probe');
    });
  }
  var timer;
  document.addEventListener('DOMContentLoaded', fit);
  window.addEventListener('load', fit);
  window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(fit, 120); });
})();
