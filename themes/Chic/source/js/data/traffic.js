// One anonymous landing event per browser session, only after analytics consent.
// The utm_* params are always removed from the address bar, consent or not.
(function () {
  var C = window.ChicConsent;
  var K = window.ChicTrafficCore;
  if (!C || !K) return;

  var SENT = 'traffic_sent';
  var LANDING = 'traffic_landing';

  // sessionStorage may be blocked; every access goes through here and failure means "send nothing"
  function ss(fn) {
    try { return fn(window.sessionStorage); } catch (e) { return undefined; }
  }

  var here = location.pathname + location.search + location.hash;
  var clean = K.stripUtm(location.href);
  var landing = K.captureLanding(location.href, document.referrer, location.hostname, document.documentElement.lang);
  if (clean !== here) {
    try { history.replaceState(history.state, '', clean); } catch (e) { /* keep the page working */ }
  }

  var usable = ss(function (s) { s.setItem('traffic_probe', '1'); s.removeItem('traffic_probe'); return true; });
  if (!usable || ss(function (s) { return s.getItem(SENT); })) return;

  var current = C.get();
  if (current && current.analytics === false) return;

  // the first page of the session decides what counts as the landing, even if consent comes later
  var stored = ss(function (s) { return s.getItem(LANDING); });
  if (stored) {
    try { landing = JSON.parse(stored); } catch (e) { /* use this page's values */ }
  } else {
    ss(function (s) { s.setItem(LANDING, JSON.stringify(landing)); });
  }

  function send() {
    if (ss(function (s) { return s.getItem(SENT); })) return;
    // flag first: a reload or a second listener must not send twice
    ss(function (s) { s.setItem(SENT, '1'); s.removeItem(LANDING); });
    var url = window.SUPABASE_URL;
    var key = window.SUPABASE_ANON_KEY;
    if (!url || !key) return;
    fetch(url + '/rest/v1/rpc/record_visit', {
      method: 'POST',
      headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        p_path: landing.path,
        p_lang: landing.lang,
        p_referrer_host: landing.referrer_host,
        p_utm_source: landing.utm_source,
        p_utm_medium: landing.utm_medium,
        p_utm_campaign: landing.utm_campaign,
        p_utm_term: landing.utm_term,
        p_utm_content: landing.utm_content
      })
    }).catch(function () { /* analytics must never break the page */ });
  }

  if (current && current.analytics) send();
  C.subscribe(function (state) {
    if (state && state.analytics) send();
    else ss(function (s) { s.removeItem(LANDING); });
  });
})();
