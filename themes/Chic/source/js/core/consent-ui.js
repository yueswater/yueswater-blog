// Banner + settings panel. First visit: the banner (Accept / Reject / Manage settings).
// Reopened from the footer: the settings view showing the current choice.
(function () {
  var C = window.ChicConsent;
  var T = window.ChicConsentText;
  if (!C || !T) return;

  var t = T.get(document.documentElement.lang);
  var wrap = null;
  var opener = null;

  function h(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function button(label, cls, onclick) {
    var b = h('button', 'consent-btn ' + cls, label);
    b.type = 'button';
    b.addEventListener('click', onclick);
    return b;
  }

  function close(restoreFocus) {
    if (!wrap) return;
    wrap.remove();
    wrap = null;
    if (restoreFocus && opener && opener.focus) opener.focus();
    opener = null;
  }

  function choose(analytics) {
    C.set(analytics);
    close(true);
  }

  function row(titleText, bodyText, checkbox) {
    var r = h('label', 'consent-row');
    var head = h('span', 'consent-row-title', titleText);
    r.append(checkbox, head, h('span', 'consent-row-body', bodyText));
    return r;
  }

  function settingsView(current) {
    var box = h('div', 'consent-settings');
    var necessary = h('input');
    necessary.type = 'checkbox';
    necessary.checked = true;
    necessary.disabled = true;
    var analytics = h('input');
    analytics.type = 'checkbox';
    analytics.checked = !!(current && current.analytics);
    box.append(
      row(t.necessaryTitle, t.necessaryBody, necessary),
      row(t.analyticsTitle, t.analyticsBody, analytics),
      button(t.save, 'consent-btn-main', function () { choose(analytics.checked); })
    );
    return box;
  }

  function show(reopened) {
    if (wrap) return;
    var current = C.get();
    wrap = h('div', 'consent-root');
    var panel = h('section', 'consent-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'consent-title');
    var inner = h('div', 'consent-inner');
    var title = h('h2', 'consent-title', t.title);
    title.id = 'consent-title';
    title.tabIndex = -1;
    inner.append(title, h('p', 'consent-body', t.body));

    var actions = h('div', 'consent-actions');
    actions.append(
      button(t.accept, 'consent-btn-main', function () { choose(true); }),
      button(t.reject, 'consent-btn-main', function () { choose(false); }),
      button(t.manage, 'consent-btn-alt', function () {
        actions.replaceWith(settingsView(current));
      })
    );
    inner.append(reopened ? settingsView(current) : actions);
    panel.append(inner);
    wrap.append(h('div', 'consent-backdrop'), panel);
    document.body.append(wrap);
    requestAnimationFrame(function () { wrap && wrap.classList.add('is-in'); });
    title.focus();
  }

  document.addEventListener('keydown', function (e) {
    // Escape closes a reopened panel without changing the choice; the first-visit banner needs a choice
    if (e.key === 'Escape' && wrap && C.get()) close(true);
  });

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest && e.target.closest('[data-consent-open]');
    if (!trigger) return;
    e.preventDefault();
    opener = trigger;
    C.open();
  });

  C.onOpen(function () { show(true); });

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-consent-open]').forEach(function (el) {
      el.textContent = t.footer;
      var holder = el.closest('.footer-consent-wrap');
      if (holder) holder.hidden = false;
    });
    if (C.get() === null) show(false);
  });
})();
