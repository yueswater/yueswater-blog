// "留言": messages from the contact page, newest first. Click one to expand it; it is marked read
// when opened, and can be marked unread again. Reply opens the mail client with the sender filled in.
import { el, fmtTime } from '../dom.js'
import { renderMessage } from '/js/widgets/contact/editor.bundle.js'

// what a visitor typed, minus control, zero-width and bidi-override characters (no spoofed names)
const visible = (v) => String(v ?? '').replace(/[\u0000-\u001F\u007F\u200B\u200C\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g, '')
const SAFE_EMAIL = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i

const imageNames = (md) => [...String(md || '').matchAll(/!\[[^\]\n]*\]\(([\w.-]+\.(?:png|jpe?g))\)/g)].map((m) => m[1])

const TOPICS = { collab: '合作邀約', post: '文章問題', job: '工作機會', other: '其他' }

export async function renderMessages(root, { backend, notify }) {
  const out = el('div', { class: 'messages' })
  root.replaceChildren(out)
  let rows = []
  const opened = new Set() // ids kept open across redraws
  const urls = new Map()   // image file name -> signed URL (valid for an hour)

  // the body as safe HTML; images get signed URLs, fetched the first time a message is opened
  function bodyEl(row) {
    const box = el('div', { class: 'msg-text' })
    let view = null
    const paint = () => { view && view.destroy(); box.replaceChildren(); view = renderMessage(box, row.body, { resolveImage: (n) => urls.get(n) || '' }) }
    paint()
    const missing = imageNames(row.body).filter((n) => !urls.has(n))
    if (missing.length && opened.has(row.id)) {
      backend.imageUrls(missing).then((map) => { Object.entries(map).forEach(([k, v]) => urls.set(k, v)); paint() })
        .catch(() => {})
    }
    return box
  }

  async function load() {
    out.replaceChildren(el('p', { class: 'muted' }, '載入中…'))
    try {
      rows = await backend.messages()
      draw()
    } catch (e) {
      out.replaceChildren(el('p', { class: 'form-error' }, `讀取失敗：${e.message || e}`))
    }
  }

  async function mark(row, read) {
    try {
      await backend.markMessage(row.id, read)
      row.read_at = read ? new Date().toISOString() : null
      // collapse on mark-unread: a redrawn open <details> fires toggle and would mark it read again
      if (!read) opened.delete(row.id)
      draw()
    } catch (e) {
      notify(`更新失敗：${e.message || e}`, 'warn')
    }
  }

  function item(row) {
    // only a plain address goes into mailto:, so a crafted one cannot add cc / bcc / body
    const reply = SAFE_EMAIL.test(row.email || '')
      ? `mailto:${row.email}?subject=${encodeURIComponent('Re: ' + (TOPICS[row.topic] || row.topic))}`
      : null
    return el('details', {
      class: `msg${row.read_at ? '' : ' unread'}`,
      open: opened.has(row.id),
      ontoggle: (e) => {
        if (e.target.open) opened.add(row.id); else opened.delete(row.id)
        if (e.target.open && !row.read_at) mark(row, true)
        else if (e.target.open) e.target.querySelector('.msg-text').replaceWith(bodyEl(row))
      },
    },
      el('summary', {},
        el('span', { class: 'msg-dot', 'aria-label': row.read_at ? '已讀' : '未讀' }),
        el('strong', {}, visible(row.name)),
        el('span', { class: 'pill' }, TOPICS[row.topic] || row.topic),
        el('span', { class: 'msg-preview muted' }, row.body.replace(/!\[[^\]]*\]\([^)]*\)/g, '[圖]').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*`#>]|^\s*-\s+/gm, '').replace(/\s+/g, ' ').slice(0, 60)),
        el('span', { class: 'muted small num' }, fmtTime(row.ts))),
      el('div', { class: 'msg-body' },
        el('p', { class: 'muted small' }, [visible(row.email), visible(row.org), row.lang, row.ip && `IP ${row.ip}`].filter(Boolean).join(' · ')),
        bodyEl(row),
        el('div', { class: 'msg-actions' },
          reply ? el('a', { class: 'btn small', href: reply }, '回信') : null,
          row.read_at ? el('button', { class: 'btn small', onclick: () => mark(row, false) }, '標為未讀') : null)))
  }

  function draw() {
    const unread = rows.filter((r) => !r.read_at).length
    out.replaceChildren(
      el('p', { class: 'muted small' }, `共 ${rows.length} 則，未讀 ${unread} 則`),
      ...(rows.length ? rows.map(item) : [el('p', { class: 'muted' }, '還沒有留言')]))
  }

  await load()
}
