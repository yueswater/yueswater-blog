(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var url = window.SUPABASE_URL;
    var key = window.SUPABASE_ANON_KEY;
    if (!url || !key) return;

    var headers = {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json'
    };

    var items = document.querySelectorAll('.supabase-views[data-path]');
    var paths = [];
    items.forEach(function (el) {
      var p = el.getAttribute('data-path');
      if (paths.indexOf(p) === -1) paths.push(p);
    });

    if (paths.length) {
      var filter = 'in.(' + paths.map(function (p) {
        return '"' + p.replace(/"/g, '\\"') + '"';
      }).join(',') + ')';

      fetch(url + '/rest/v1/page_views?select=path,count&path=' + encodeURIComponent(filter), { headers: headers })
        .then(function (res) { return res.json(); })
        .then(function (rows) {
          var counts = {};
          (rows || []).forEach(function (row) { counts[row.path] = row.count; });
          items.forEach(function (el) {
            var p = el.getAttribute('data-path');
            el.textContent = counts.hasOwnProperty(p) ? counts[p] : 0;
          });
        })
        .catch(function () {
          items.forEach(function (el) { el.textContent = '–'; });
        });
    }

    // Record exactly one view for the current post, via an RPC call --
    // clients never write to the page_views table directly (see the
    // create_page_views migration).
    var recordEl = document.querySelector('[data-supabase-record]');
    if (recordEl) {
      var recordPath = recordEl.getAttribute('data-supabase-record');
      fetch(url + '/rest/v1/rpc/increment_page_view', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ page_path: recordPath })
      })
        .then(function (res) { return res.json(); })
        .then(function (newCount) {
          var ownWidget = document.querySelector('.supabase-views[data-path="' + recordPath + '"]');
          if (ownWidget) ownWidget.textContent = newCount;
        })
        .catch(function () {});
    }
  });
})();
