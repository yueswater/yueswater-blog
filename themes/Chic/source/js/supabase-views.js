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

    // A click on the PDF button counts one download. Same RPC and the same
    // once-per-IP-per-day rule as views; the PDF's own URL is the counter key.
    var dl = document.querySelector('[data-download-path]');
    if (dl) {
      dl.addEventListener('click', function (e) {
        if (window.siteToast) window.siteToast(dl.getAttribute('data-toast'));
        // The file sits on another origin, where browsers ignore the download
        // attribute (and some skip the save altogether). Fetch it and save the
        // blob from here instead; if that fails, fall through to the plain link.
        if (window.fetch && window.URL && URL.createObjectURL && !(e.metaKey || e.ctrlKey || e.shiftKey || e.button)) {
          e.preventDefault();
          fetch(dl.href)
            .then(function (res) {
              if (!res.ok) throw new Error(res.status);
              return res.blob();
            })
            .then(function (blob) {
              var a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = dl.getAttribute('data-download-name') || 'download.pdf';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(function () { URL.revokeObjectURL(a.href); }, 10000);
            })
            .catch(function () { window.location.href = dl.href; });
        }
        var dlPath = dl.getAttribute('data-download-path');
        // Every download counts (increment_download); falls back to the once-a-day
        // page-view counter on a database that does not have that function yet.
        function bump(fn) {
          return fetch(url + '/rest/v1/rpc/' + fn, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ page_path: dlPath }),
            keepalive: true
          }).then(function (res) { return res.json(); });
        }
        bump('increment_download')
          .then(function (n) { return typeof n === 'number' ? n : bump('increment_page_view'); })
          .then(function (n) {
            // the counter is a sibling of the button, not inside it: find it by key
            if (typeof n !== 'number') return;
            items.forEach(function (el) {
              if (el.getAttribute('data-path') === dlPath) el.textContent = n;
            });
          })
          .catch(function () {});
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
