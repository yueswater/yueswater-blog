// Block-level Markdown to safe HTML for the mail body: paragraphs, lists and fenced code, with the inline
// rules from inline.mjs. Anything else (HTML, headings, tables, math) stays plain escaped text.
import { escapeHtml } from './escape.mjs'
import { renderInline } from './inline.mjs'

const P_STYLE = 'margin:0 0 14px'
const PRE_STYLE = "margin:0 0 14px;padding:12px 14px;background:#f4f6fa;border-left:3px solid #1747e6;overflow:auto;font-family:'SFMono-Regular',Menlo,Consolas,'PingFang TC','Microsoft JhengHei',monospace;font-size:13px;line-height:1.6;color:#1e293b;white-space:pre-wrap;word-break:break-word"
const LIST_STYLE = 'margin:0 0 14px;padding-left:22px'
const FENCE = /^\s*```[\w+#.-]*\s*$/
const BULLET = /^\s*[-*]\s+(.*)$/
const ORDERED = /^\s*\d+[.)]\s+(.*)$/

const norm = (s) => String(s ?? '').replace(/\r\n?/g, '\n').replace(/\u0000/g, '')

export function renderMarkdown(src, ctx) {
  const lines = norm(src).split('\n')
  const out = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    if (FENCE.test(line)) {
      const code = []
      for (i++; i < lines.length && !/^\s*```\s*$/.test(lines[i]); i++) code.push(lines[i])
      i++
      out.push(`<pre style="${PRE_STYLE}">${escapeHtml(code.join('\n'))}</pre>`)
      continue
    }
    const kind = BULLET.test(line) ? ['ul', BULLET] : ORDERED.test(line) ? ['ol', ORDERED] : null
    if (kind) {
      const items = []
      for (; i < lines.length && kind[1].test(lines[i]); i++) items.push(`<li style="margin:0 0 4px">${renderInline(lines[i].match(kind[1])[1], ctx)}</li>`)
      out.push(`<${kind[0]} style="${LIST_STYLE}">${items.join('')}</${kind[0]}>`)
      continue
    }
    const para = []
    for (; i < lines.length && lines[i].trim() && !FENCE.test(lines[i]) && !BULLET.test(lines[i]) && !ORDERED.test(lines[i]); i++) para.push(renderInline(lines[i], ctx))
    out.push(`<p style="${P_STYLE}">${para.join('<br>')}</p>`)
  }
  return out.join('')
}

// the same text without markup, for the plain-text part of the mail
export function markdownToText(src, imageLabel) {
  return norm(src)
    .replace(/!\[[^\]\n]*\]\([^)\s]*\)/g, imageLabel)
    .replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, t, u) => (t === u ? u : `${t} (${u})`))
    .replace(/^\s*```[\w+#.-]*\s*$/gm, '')
    .replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*/g, '$1')
    .replace(/(?<![*\w])\*(?=[^\s*])(.+?)(?<=[^\s*])\*(?![*\w])/g, '$1')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
