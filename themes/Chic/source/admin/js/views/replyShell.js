// The modal frame around the reply editor: overlay, header, footer, Esc to close, Tab kept inside,
// focus handed back to the button that opened it. No logic about drafts or sending lives here.
import { el } from '../dom.js'

// what a visitor typed, minus control, zero-width and bidi-override characters
const clean = (v) => String(v ?? '').replace(/[\u0000-\u001F\u007F​‌‎‏‪-‮⁠-⁤⁦-⁩﻿]/g, '')

export function replyShell({ row, body, onSend, onClose }) {
  const opener = document.activeElement
  const status = el('span', { class: 'muted small rc-status', role: 'status', 'aria-live': 'polite' })
  const count = el('span', { class: 'muted small num' })
  const error = el('p', { class: 'form-error', hidden: true, role: 'alert' })
  const send = el('button', { class: 'btn primary', type: 'button', disabled: true, onclick: () => onSend() }, '寄出')
  const closeBtn = el('button', { class: 'btn link rc-x', type: 'button', 'aria-label': '關閉', onclick: () => onClose() }, '×')
  const modal = el('div', { class: 'rc-modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'rc-title' },
    el('div', { class: 'rc-head' },
      el('div', {}, el('h2', { id: 'rc-title' }, `回信給 ${clean(row.name)}`), el('p', { class: 'muted small' }, `寄給 ${clean(row.email)}，訪客會從 contact@yueswater.com 收到`)),
      closeBtn),
    el('div', { class: 'rc-body' }, body, error),
    el('div', { class: 'rc-foot' }, status, count, el('button', { class: 'btn', type: 'button', onclick: () => onClose() }, '取消'), send))
  const overlay = el('div', { class: 'rc-overlay' }, modal)

  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose() }
    else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSend() }
    else if (e.key === 'Tab') {
      const items = [...modal.querySelectorAll('button:not([disabled]):not([hidden]), textarea, input:not([type=file]), [contenteditable=true]')].filter((n) => n.offsetParent)
      if (!items.length) return
      const first = items[0]; const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  })

  return {
    open: () => document.body.append(overlay),
    remove: () => { overlay.remove(); opener && opener.isConnected && opener.focus() },
    status: (t) => { status.textContent = t },
    count: (n, max) => { count.textContent = `${n} / ${max}`; count.classList.toggle('over', n > max) },
    canSend: (on) => { send.disabled = !on },
    sending: (on) => { send.textContent = on ? '寄出中…' : '寄出' },
    error: (t) => { error.textContent = t; error.hidden = !t },
  }
}
