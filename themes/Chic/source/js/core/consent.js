// Consent state: one localStorage key, expiring after 12 months. No DOM here (see consent-ui.js).
(function (root) {
  var KEY = 'consent';
  var MAX_AGE = 365 * 24 * 3600 * 1000;

  function createConsent(storage, now) {
    var subscribers = [];
    var openers = [];

    // null = undecided: nothing stored, unreadable, wrong version, or older than 12 months
    function get() {
      try {
        var raw = storage.getItem(KEY);
        if (!raw) return null;
        var s = JSON.parse(raw);
        if (!s || s.v !== 1 || typeof s.analytics !== 'boolean') return null;
        var at = Date.parse(s.at);
        if (isNaN(at) || now() - at > MAX_AGE) return null;
        return s;
      } catch (e) { return null; }
    }

    // subscribers are told even when the write fails, so this page view still reacts to the choice
    function set(analytics) {
      var s = { v: 1, analytics: !!analytics, at: new Date(now()).toISOString() };
      try { storage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* blocked storage */ }
      subscribers.slice().forEach(function (fn) { try { fn(s); } catch (e) { /* one bad listener */ } });
    }

    function subscribe(fn) {
      subscribers.push(fn);
      return function () { subscribers = subscribers.filter(function (f) { return f !== fn; }); };
    }

    function onOpen(fn) { openers.push(fn); }
    function open() { openers.forEach(function (fn) { fn(); }); }

    return { get: get, set: set, subscribe: subscribe, onOpen: onOpen, open: open };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = createConsent;
  } else {
    var storage;
    try { storage = root.localStorage; } catch (e) { /* access itself can throw */ }
    if (!storage) storage = { getItem: function () { throw new Error('blocked'); }, setItem: function () { throw new Error('blocked'); } };
    root.ChicConsent = createConsent(storage, Date.now);
  }
})(typeof window !== 'undefined' ? window : this);
