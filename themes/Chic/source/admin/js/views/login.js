// The sign-in card (e-mail and password) and the "this account is not an admin" card.
import { el } from '../dom.js'
import { passwordField } from './passwordField.js'

export function renderLogin(root, { backend, onSignedIn }) {
  const error = el('p', { class: 'form-error', role: 'alert', hidden: true })
  const email = el('input', { type: 'email', required: true, autocomplete: 'username', placeholder: 'name@example.com' })
  const password = passwordField({ required: true, autocomplete: 'current-password' })
  const show = (e) => { error.hidden = false; error.textContent = e.message || String(e) }

  const submit = el('button', { class: 'btn primary wide', type: 'submit' }, '登入')
  const form = el('form', {
    class: 'card',
    onsubmit: async (ev) => {
      ev.preventDefault()
      error.hidden = true
      submit.disabled = true
      try { await backend.signIn(email.value.trim(), password.input.value); await onSignedIn() } catch (e) { show(e) }
      submit.disabled = false
    },
  },
  el('h1', {}, '文章管理'),
  el('p', { class: 'muted' }, '只有管理員可以進入。'),
  el('label', {}, '電子郵件', email),
  el('label', {}, '密碼', password.node),
  error, submit,
  backend.mode === 'demo' ? el('p', { class: 'muted small' }, '示範模式：資料只存在這個瀏覽器，隨便輸入即可登入。') : null)
  root.replaceChildren(el('main', { class: 'center' }, form))
}

export function renderDenied(root, { email, onSignOut }) {
  root.replaceChildren(el('main', { class: 'center' }, el('div', { class: 'card' },
    el('h1', {}, '沒有權限'),
    el('p', { class: 'muted' }, `${email || '這個帳號'} 不是管理員。`),
    el('button', { class: 'btn wide', onclick: onSignOut }, '登出'))))
}
