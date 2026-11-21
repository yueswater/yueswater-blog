// Field helpers: validation rules, error display, the character counter and textarea auto-grow.

// Same rules as submit_contact on the server (supabase/migrations/*_contact_hardening.sql).
// No ?, &, = or spaces in an address, so it cannot carry mailto parameters.
const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
// control, zero-width and bidi-override characters (U+200D is kept: emoji sequences need it)
const INVISIBLE = /[\u0000-\u001F\u007F\u200B\u200C\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;
export const BODY_MAX = 2000;

export const clean = (value) => String(value).replace(INVISIBLE, '');
// length in characters (code points), as the server counts it; an emoji is one, not two
export const charLength = (value) => [...String(value)].length;

// returns an error key from the strings table, or '' when the value is fine
export function check(name, value) {
  const v = name === 'body' ? String(value).trim() : clean(value).trim();
  if (!v || !/[^\s\u200D]/.test(v)) return 'required';
  if (name === 'email' && !EMAIL.test(v)) return 'email';
  if (name === 'body' && charLength(v) < 10) return 'short';
  if (name === 'body' && charLength(value) > BODY_MAX) return 'long';
  return '';
}

export function showError(form, name, message) {
  const field = form.querySelector(`[data-field="${name}"]`);
  field.classList.toggle('is-invalid', Boolean(message));
  field.querySelector('.cf-error').textContent = message || '';
  field.querySelectorAll('.cf-input, .cf-select-trigger').forEach((control) => {
    if (message) control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  });
}

export function initCounter(textarea, countEl) {
  // no maxlength on the textarea: it counts UTF-16 units and silently cuts pasted emoji
  const max = BODY_MAX;
  const update = () => {
    const n = charLength(textarea.value);
    countEl.textContent = n;
    countEl.parentElement.classList.toggle('is-near', n > max * 0.9);
    // grow with the text up to a cap, then scroll (only while it is the visible view)
    if (textarea.offsetParent) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight + 2, 480) + 'px';
    }
  };
  textarea.addEventListener('input', update);
  update();
  return update;
}
