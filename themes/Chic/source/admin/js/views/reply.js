// Inline reply composer under an opened message. Sends through backend.sendReply and calls onSent(reply).
import { el } from '../dom.js'

export const MAX_REPLY = 5000

export function composer({ backend, row, onSent, onCancel }) {
  const area = el('textarea', { class: 'reply-input', rows: 6, maxLength: MAX_REPLY, placeholder: '寫下回覆，寄出後訪客會從 contact@yueswater.com 收到', 'aria-label': '回覆內容' })
  const count = el('span', { class: 'muted small num' }, `0 / ${MAX_REPLY}`)
  const error = el('p', { class: 'form-error', hidden: true })
  const send = el('button', { class: 'btn small primary', type: 'button', disabled: true }, '寄出')
  let busy = false

  const sync = () => {
    count.textContent = `${area.value.length} / ${MAX_REPLY}`
    send.disabled = busy || !area.value.trim()
  }
  async function submit() {
    if (busy || !area.value.trim()) return
    busy = true; sync(); send.textContent = '寄出中…'; error.hidden = true
    try {
      const out = await backend.sendReply(row.id, area.value)
      onSent(out.reply || { id: Date.now(), ts: new Date().toISOString(), body: area.value.trim() })
    } catch (e) {
      error.textContent = e.message || '寄出失敗'; error.hidden = false
      busy = false; send.textContent = '寄出'; sync()
    }
  }
  area.addEventListener('input', sync)
  area.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit() } })
  send.addEventListener('click', submit)
  queueMicrotask(() => area.focus())

  return el('div', { class: 'msg-compose' },
    el('p', { class: 'muted small' }, `寄給 ${String(row.email).replace(/[\u0000-\u001F\u007F​-‏‪-‮⁠-⁩﻿]/g, '')}`),
    area, error,
    el('div', { class: 'msg-actions' }, send, el('button', { class: 'btn small', type: 'button', onclick: onCancel }, '取消'), count))
}
