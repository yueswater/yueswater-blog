// The card shown after an invitation or password-reset link: choose the password.
import { el } from '../dom.js'
import { passwordField } from './passwordField.js'

function card(root, title, note, fields, submitText, run) {
  const msg = el('p', { class: 'form-error', role: 'alert', hidden: true })
  const submit = el('button', { class: 'btn primary wide', type: 'submit' }, submitText)
  const form = el('form', {
    class: 'card',
    onsubmit: async (ev) => {
      ev.preventDefault()
      msg.hidden = true
      submit.disabled = true
      try { await run(msg) } catch (e) { msg.hidden = false; msg.textContent = e.message || String(e) }
      submit.disabled = false
    },
  }, el('h1', {}, title), el('p', { class: 'muted' }, note), ...fields, msg, submit)
  root.replaceChildren(el('main', { class: 'center' }, form))
}

export function renderSetPassword(root, { backend, onDone }) {
  const pw = passwordField({ required: true, minlength: 8, autocomplete: 'new-password' })
  const again = passwordField({ required: true, minlength: 8, autocomplete: 'new-password' })
  card(root, '設定新密碼', '至少 8 個字元。', [el('label', {}, '新密碼', pw.node), el('label', {}, '再輸入一次', again.node)], '儲存密碼', async () => {
    if (pw.input.value !== again.input.value) throw new Error('兩次輸入的密碼不一樣。')
    await backend.setPassword(pw.input.value)
    onDone()
  })
}
