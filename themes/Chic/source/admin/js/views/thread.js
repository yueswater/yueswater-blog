// The replies already sent for one message, oldest first. Text only: nothing here is parsed as HTML.
import { el, fmtTime } from '../dom.js'

export function threadEl(replies) {
  return el('div', { class: 'msg-thread' },
    ...replies.map((r) => el('div', { class: 'msg-reply' },
      el('p', { class: 'muted small num' }, `已回覆 · ${fmtTime(r.ts)}`),
      el('div', { class: 'msg-reply-text' }, String(r.body ?? '')))))
}
