(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var tabsets = document.querySelectorAll('.tabset');
    tabsets.forEach(function (tabset) {
      var btns = tabset.querySelectorAll('.tabset-btn');
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var target = btn.getAttribute('data-tab');
          tabset.querySelectorAll('.tabset-btn').forEach(function (b) {
            b.classList.toggle('active', b === btn);
          });
          tabset.querySelectorAll('.tabset-panel').forEach(function (p) {
            p.classList.toggle('active', p.getAttribute('data-tab') === target);
          });
        });
      });
    });
  });
})();
