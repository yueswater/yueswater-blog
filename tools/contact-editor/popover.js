// One small form popover, positioned inside the editor frame, used for links and math.
// fields: [{ name, label, value, multiline, placeholder }]; preview(values) -> HTML string or '';
// validate(values) -> error text or ''. Enter (Cmd+Enter in a textarea) confirms, Escape cancels.

export function createPopover(host, strings) {
  const pop = Object.assign(document.createElement('div'), { className: 'ce-pop', hidden: true });
  host.append(pop);
  let cleanup = null;

  function close() {
    pop.hidden = true;
    pop.replaceChildren();
    cleanup && cleanup();
    cleanup = null;
  }

  function open({ title, fields, preview, validate, okLabel, onOk, onRemove }) {
    close();
    const inputs = {};
    const head = Object.assign(document.createElement('p'), { className: 'ce-pop-title', textContent: title });
    pop.append(head);
    for (const f of fields) {
      const label = document.createElement('label');
      label.append(Object.assign(document.createElement('span'), { textContent: f.label }));
      const input = document.createElement(f.multiline ? 'textarea' : 'input');
      Object.assign(input, { className: 'ce-field', name: f.name, value: f.value || '', placeholder: f.placeholder || '' });
      if (f.multiline) input.rows = 3;
      if (f.mono) input.classList.add('is-mono');
      label.append(input);
      pop.append(label);
      inputs[f.name] = input;
    }
    const view = preview ? Object.assign(document.createElement('div'), { className: 'ce-pop-preview' }) : null;
    if (view) pop.append(view);
    const err = Object.assign(document.createElement('p'), { className: 'ce-pop-error' });
    const actions = Object.assign(document.createElement('div'), { className: 'ce-pop-actions' });
    const btn = (text, cls, fn) => {
      const b = Object.assign(document.createElement('button'), { type: 'button', className: `ce-btn ${cls}`, textContent: text });
      b.addEventListener('click', fn);
      return b;
    };
    const values = () => Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, v.value]));
    const confirm = () => {
      const msg = validate ? validate(values()) : '';
      if (msg) { err.textContent = msg; return; }
      const v = values();
      close();
      onOk(v);
    };
    if (onRemove) actions.append(btn(strings.remove, 'is-danger', () => { close(); onRemove(); }));
    actions.append(btn(strings.cancel, '', close), btn(okLabel || strings.add, 'is-primary', confirm));
    pop.append(err, actions);

    const refresh = () => {
      err.textContent = '';
      if (view) view.innerHTML = preview(values()) || `<span class="ce-muted">${strings.math_empty}</span>`;
    };
    Object.values(inputs).forEach((i) => i.addEventListener('input', refresh));
    pop.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      else if (e.key === 'Enter' && (e.target.tagName !== 'TEXTAREA' || e.metaKey || e.ctrlKey)) { e.preventDefault(); confirm(); }
    });
    const outside = (e) => { if (!pop.contains(e.target)) close(); };
    setTimeout(() => document.addEventListener('mousedown', outside, true));
    cleanup = () => document.removeEventListener('mousedown', outside, true);

    pop.hidden = false;
    refresh();
    Object.values(inputs)[0]?.focus();
  }

  return { open, close };
}
