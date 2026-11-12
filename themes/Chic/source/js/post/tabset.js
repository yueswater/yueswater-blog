(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var tabsets = document.querySelectorAll('.tabset');
    tabsets.forEach(function (tabset) {
      // direct children only: a tab group nested in a panel has its own buttons and panels
      var btns = tabset.querySelectorAll(':scope > .tabset-nav > .tabset-btn');
      var panels = tabset.querySelectorAll(':scope > .tabset-panel');
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var target = btn.getAttribute('data-tab');
          btns.forEach(function (b) {
            b.classList.toggle('active', b === btn);
          });
          panels.forEach(function (p) {
            p.classList.toggle('active', p.getAttribute('data-tab') === target);
          });
        });
      });
    });
  });
})();
