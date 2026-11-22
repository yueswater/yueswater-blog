// "回信" opens a modal dialog with the rich editor. The draft is autosaved to localStorage every 10 s
// (keyed by message id), restored on reopen and removed after a successful send.
import { el } from '../dom.js'
import { createAutosave } from '/js/widgets/contact/autosave.js'
import { createReplyEditor } from './replyEditor.js'
import { replyShell } from './replyShell.js'
import { createMathCheck, createMathSender, createFormulaStore } from './replyMath.js'
import { createQuoteMath } from './replyQuote.js'

export const MAX_REPLY = 5000
const imageNames = (md) => [...String(md || '').matchAll(/!\[[^\]\n]*\]\(([\w-]+\.(?:png|jpe?g))\)/g)].map((m) => m[1])
const hhmm = () => new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

export async function openReply({ backend, row, notify, onSent }) {
  const urls = new Map()
  const { root, editor, textarea } = createReplyEditor({ toast: notify, resolveImage: (n) => urls.get(n) || '', math: true })
  const shell = replyShell({ row, body: root, onSend: () => submit(), onClose: () => close() })
  const draft = createAutosave({
    key: `reply-draft-${row.id}`,
    read: () => ({ body: textarea.value }),
    isEmpty: (v) => !String(v.body).trim(),
    onSaved: () => shell.status(`已自動儲存 ${hhmm()}`),
  })
  // the reply's own warning and the quote note share the one line under the editor
  let replyWarn = ''
  let quoteNote = ''
  const showWarn = () => shell.warn([replyWarn, quoteNote].filter(Boolean).join(' '))
  const mathCheck = createMathCheck((t) => { replyWarn = t; showWarn() })
  const store = createFormulaStore(backend)
  const mathSender = createMathSender(store)
  const quote = createQuoteMath(row, store)
  quote.note().then((t) => { quoteNote = t; showWarn() }).catch(() => {})
  let busy = false

  const sync = () => {
    const n = textarea.value.length
    shell.count(n, MAX_REPLY)
    mathCheck.update(textarea.value)
    shell.canSend(!busy && textarea.value.trim() !== '' && n <= MAX_REPLY)
  }
  function close() {
    draft.flush(); draft.stop(); mathCheck.stop()
    editor.destroy()
    shell.remove()
  }
  async function submit() {
    if (busy || !textarea.value.trim()) return
    if (editor.busy()) return shell.error('圖片上傳中，請稍候')
    busy = true; sync(); shell.sending(true); shell.error('')
    const body = textarea.value
    try {
      await quote.assertTotal(body)
      const math = await mathSender(body)
      const q = await quote.prepare()
      if (q.note !== quoteNote) { quoteNote = q.note; showWarn() }
      const out = await backend.sendReply(row.id, body, math, q.quoteMath)
      draft.clear(); draft.stop(); mathCheck.stop()
      editor.destroy(); shell.remove()
      onSent(out.reply || { id: Date.now(), ts: new Date().toISOString(), body: body.trim() })
    } catch (e) {
      shell.error(e.message || '寄出失敗')
      busy = false; shell.sending(false); sync()
    }
  }

  textarea.addEventListener('input', sync)
  shell.open()
  const saved = draft.load()
  if (saved && typeof saved.body === 'string' && saved.body.trim()) {
    const names = imageNames(saved.body)
    if (names.length) { try { Object.entries(await backend.imageUrls(names)).forEach(([k, v]) => urls.set(k, v)) } catch { /* images stay blank */ } }
    editor.setMarkdown(saved.body)
    shell.status('已還原草稿')
  }
  draft.start()
  sync()
  editor.focus()
}
