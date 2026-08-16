(function () {
  // GoatCounter's /counter/*.json endpoint always answers with HTTP 404
  // even on a valid, successful lookup (it was built to serve a badge
  // image, not as a REST API) -- the JSON body is correct regardless of
  // status, so it must be read unconditionally rather than gated on
  // response.ok.
  document.addEventListener('DOMContentLoaded', function () {
    var base = window.GOATCOUNTER_BASE;
    if (!base) return;

    var items = document.querySelectorAll('.goatcounter-views[data-path]');
    if (!items.length) return;

    items.forEach(function (el) {
      var path = el.getAttribute('data-path');
      if (path.charAt(0) !== '/') path = '/' + path;
      var encodedPath = path.split('/').map(encodeURIComponent).join('/');

      fetch(base + '/counter/' + encodedPath + '.json')
        .then(function (res) { return res.json(); })
        .then(function (data) {
          el.textContent = (data && data.count != null) ? data.count : '–';
        })
        .catch(function () {
          el.textContent = '–';
        });
    });
  });
})();
