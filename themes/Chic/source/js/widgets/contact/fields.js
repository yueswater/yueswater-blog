// Field helpers: validation rules, error display, the character counter and textarea auto-grow.

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// returns an error key from the strings table, or '' when the value is fine
export function check(name, value) {
  const v = value.trim();
  if (!v) return 'required';
  if (name === 'email' && !EMAIL.test(v)) return 'email';
  if (name === 'body' && v.length < 10) return 'short';
  if (name === 'body' && value.length > 2000) return 'long';
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
  const max = Number(textarea.maxLength) || 2000;
  const update = () => {
    countEl.textContent = textarea.value.length;
    countEl.parentElement.classList.toggle('is-near', textarea.value.length > max * 0.9);
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
