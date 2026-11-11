// Two small cards: ask for a mail that lets you set a password (first sign-in or forgotten), and set the password itself.
import { el } from '../dom.js'

function card(root, title, note, fields, submitText, run, extra) {
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
  }, el('h1', {}, title), el('p', { class: 'muted' }, note), ...fields, msg, submit, extra)
  root.replaceChildren(el('main', { class: 'center' }, form))
}

export function renderReset(root, { backend, onBack }) {
  const email = el('input', { type: 'email', required: true, autocomplete: 'username', placeholder: 'name@example.com' })
  const back = el('button', { class: 'link', type: 'button', onclick: onBack }, '回到登入')
  card(root, '設定密碼', '輸入管理員的電子郵件，系統會寄一封設定密碼的信。', [el('label', {}, '電子郵件', email)], '寄信', async (msg) => {
    await backend.sendReset(email.value.trim())
    msg.hidden = false
    msg.className = 'form-ok'
    msg.textContent = '已寄出，請到信箱點連結。'
  }, back)
}

export function renderSetPassword(root, { backend, onDone }) {
  const pw = el('input', { type: 'password', required: true, minlength: 8, autocomplete: 'new-password' })
  const again = el('input', { type: 'password', required: true, minlength: 8, autocomplete: 'new-password' })
  card(root, '設定新密碼', '至少 8 個字元。', [el('label', {}, '新密碼', pw), el('label', {}, '再輸入一次', again)], '儲存密碼', async () => {
    if (pw.value !== again.value) throw new Error('兩次輸入的密碼不一樣。')
    await backend.setPassword(pw.value)
    onDone()
  })
}
