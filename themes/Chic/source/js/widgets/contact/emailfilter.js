// Email field: only half-width ASCII letters, digits and . _ % + - @ can stay in the box. Anything else
// (full-width letters, Chinese, spaces, emoji) is removed as it is typed or pasted. While an IME is
// composing nothing is touched; the composed text is cleaned on compositionend.
const ILLEGAL = /[^A-Za-z0-9._%+@-]/g;

export const stripEmail = (v) => String(v).replace(ILLEGAL, '');

export function initEmailFilter(input) {
  let composing = false;
  const clean = () => {
    const before = input.value;
    const after = stripEmail(before);
    if (before === after) return;
    const caret = stripEmail(before.slice(0, input.selectionStart ?? before.length)).length;
    input.value = after;
    try { input.setSelectionRange(caret, caret); } catch { /* not supported for this input */ }
  };
  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => { composing = false; clean(); input.dispatchEvent(new Event('input', { bubbles: true })); });
  // runs before the other input listeners (registered earlier than main.js's), so they see clean text
  input.addEventListener('input', (e) => { if (!composing && !e.isComposing) clean(); });
}
