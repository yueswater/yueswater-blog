// Pure helpers for the landing event: no DOM, no storage, so they can be unit-tested with node.
(function (root) {
  var MAX = 100;

  function cut(s) {
    return typeof s === 'string' ? s.trim().slice(0, MAX) : '';
  }

  function bare(host) {
    return String(host || '').toLowerCase().replace(/^www\./, '');
  }

  // hostname of the referrer; '' for direct visits and for navigation inside this site
  function hostOf(referrer, ownHost) {
    if (!referrer) return '';
    var host;
    try { host = new URL(referrer).hostname.toLowerCase(); } catch (e) { return ''; }
    return !host || bare(host) === bare(ownHost) ? '' : host;
  }

  // path + query + hash with every utm_* param removed; the other params are kept byte for byte
  function stripUtm(href) {
    var u = new URL(href, 'https://x.invalid');
    var kept = u.search.slice(1).split('&').filter(function (p) {
      return p && !/^utm_/i.test(p.split('=')[0]);
    });
    return u.pathname + (kept.length ? '?' + kept.join('&') : '') + u.hash;
  }

  function captureLanding(href, referrer, ownHost, lang) {
    var u = new URL(href, 'https://x.invalid');
    var q = u.searchParams;
    return {
      path: u.pathname,
      lang: /^en/i.test(lang || '') ? 'en' : 'zh-TW',
      referrer_host: hostOf(referrer, ownHost),
      utm_source: cut(q.get('utm_source')),
      utm_medium: cut(q.get('utm_medium')),
      utm_campaign: cut(q.get('utm_campaign')),
      utm_term: cut(q.get('utm_term')),
      utm_content: cut(q.get('utm_content'))
    };
  }

  var api = { cut: cut, hostOf: hostOf, stripUtm: stripUtm, captureLanding: captureLanding };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ChicTrafficCore = api;
})(typeof window !== 'undefined' ? window : this);
