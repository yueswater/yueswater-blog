// The replies already sent for one message, oldest first. Each body is Markdown, shown read-only by the
// same editor nodes as the messages (nothing is parsed as HTML); images use the signed URLs in `urls`.
import { el, fmtTime } from '../dom.js'
import { renderMessage } from '/js/widgets/contact/editor.bundle.js'

export function threadEl(replies, urls) {
  return el('div', { class: 'msg-thread' },
    ...replies.map((r) => {
      const text = el('div', { class: 'msg-reply-text msg-text' })
      renderMessage(text, String(r.body ?? ''), { resolveImage: (n) => urls.get(n) || '' })
      return el('div', { class: 'msg-reply' }, el('p', { class: 'muted small num' }, `已回覆 · ${fmtTime(r.ts)}`), text)
    }))
}
