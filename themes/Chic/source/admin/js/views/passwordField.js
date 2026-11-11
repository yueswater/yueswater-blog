// A password input with an eye button that shows or hides what was typed.
import { el } from '../dom.js'

const EYE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>'
const EYE_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/></svg>'

export function passwordField(props) {
  const input = el('input', { type: 'password', ...props })
  const toggle = el('button', { class: 'eye', type: 'button', 'aria-label': '顯示密碼', 'aria-pressed': 'false' })
  toggle.innerHTML = EYE
  toggle.addEventListener('click', () => {
    const show = input.type === 'password'
    input.type = show ? 'text' : 'password'
    toggle.innerHTML = show ? EYE_OFF : EYE
    toggle.setAttribute('aria-label', show ? '隱藏密碼' : '顯示密碼')
    toggle.setAttribute('aria-pressed', String(show))
  })
  return { input, node: el('div', { class: 'pw' }, input, toggle) }
}
