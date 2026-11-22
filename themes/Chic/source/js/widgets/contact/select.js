// Custom listbox select: a button that opens a list of options.
// Keyboard: Enter / Space / ArrowDown open; arrows, Home / End move; Enter / Space pick;
// Escape / Tab close; typing a letter jumps to the next option starting with it.

export function initSelect(root, onChange) {
  const trigger = root.querySelector('.cf-select-trigger');
  const list = root.querySelector('.cf-select-list');
  const valueEl = root.querySelector('.cf-select-value');
  const hidden = root.querySelector('input[type=hidden]');
  const options = [...list.querySelectorAll('[role=option]')];
  let active = -1;

  const isOpen = () => !list.hidden;

  function highlight(i) {
    active = Math.max(0, Math.min(options.length - 1, i));
    options.forEach((o, j) => o.classList.toggle('is-active', j === active));
    trigger.setAttribute('aria-activedescendant', options[active].id);
    options[active].scrollIntoView({ block: 'nearest' });
  }

  function open() {
    if (isOpen()) return;
    list.hidden = false;
    root.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    const chosen = options.findIndex((o) => o.dataset.value === hidden.value);
    highlight(chosen >= 0 ? chosen : 0);
    document.addEventListener('pointerdown', outside, true);
  }

  function close(refocus) {
    if (!isOpen()) return;
    list.hidden = true;
    root.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-activedescendant');
    document.removeEventListener('pointerdown', outside, true);
    if (refocus) trigger.focus();
  }

  function outside(e) {
    if (!root.contains(e.target)) close(false);
  }

  function pick(i) {
    const o = options[i];
    hidden.value = o.dataset.value;
    options.forEach((x) => x.setAttribute('aria-selected', String(x === o)));
    valueEl.textContent = o.querySelector('.cf-option-title').textContent;
    valueEl.classList.remove('is-placeholder');
    close(true);
    onChange && onChange(hidden.value);
  }

  function typeahead(ch) {
    const k = ch.toLowerCase();
    for (let step = 1; step <= options.length; step++) {
      const i = (active + step) % options.length;
      if (options[i].textContent.trim().toLowerCase().startsWith(k)) return highlight(i);
    }
  }

  trigger.addEventListener('click', () => (isOpen() ? close(true) : open()));
  trigger.addEventListener('keydown', (e) => {
    const k = e.key;
    if (!isOpen()) {
      if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ') { e.preventDefault(); open(); }
      return;
    }
    if (k === 'ArrowDown') { e.preventDefault(); highlight(active + 1); }
    else if (k === 'ArrowUp') { e.preventDefault(); highlight(active - 1); }
    else if (k === 'Home') { e.preventDefault(); highlight(0); }
    else if (k === 'End') { e.preventDefault(); highlight(options.length - 1); }
    else if (k === 'Enter' || k === ' ') { e.preventDefault(); pick(active); }
    else if (k === 'Escape') { e.preventDefault(); close(true); }
    else if (k === 'Tab') close(false);
    else if (k.length === 1 && /\S/.test(k)) typeahead(k);
  });
  options.forEach((o, i) => {
    o.addEventListener('pointermove', () => { if (active !== i) highlight(i); });
    o.addEventListener('click', () => pick(i));
  });

  return {
    get value() { return hidden.value; },
    focus() { trigger.focus(); },
    // choose an option by value without moving focus or firing onChange (restoring a draft)
    set(value) {
      const o = options.find((x) => x.dataset.value === value);
      if (!o) return;
      hidden.value = value;
      options.forEach((x) => x.setAttribute('aria-selected', String(x === o)));
      valueEl.textContent = o.querySelector('.cf-option-title').textContent;
      valueEl.classList.remove('is-placeholder');
    },
    reset() {
      hidden.value = '';
      options.forEach((x) => x.setAttribute('aria-selected', 'false'));
      valueEl.textContent = valueEl.dataset.placeholder;
      valueEl.classList.add('is-placeholder');
    },
  };
}
