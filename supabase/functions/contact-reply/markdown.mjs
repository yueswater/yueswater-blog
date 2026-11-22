// Block-level Markdown to safe HTML for the mail body: paragraphs, headings (# to ###), lists, blockquotes,
// horizontal rules, fenced code and display math ($$...$$ as a PNG), with the inline rules from inline.mjs. Anything
// else (HTML, tables) stays plain escaped text. Every tag in the output is written here; all text is escaped first.
import { escapeHtml } from './escape.mjs'
import { renderInline } from './inline.mjs'
import { maskMath, unmaskMath } from './mathTokens.mjs'

const P_STYLE = 'margin:0 0 14px'
const PRE_STYLE = "margin:0 0 14px;padding:12px 14px;background:#f4f6fa;border-left:3px solid #1747e6;overflow:auto;font-family:'SFMono-Regular',Menlo,Consolas,'PingFang TC','Microsoft JhengHei',monospace;font-size:13px;line-height:1.6;color:#1e293b;white-space:pre-wrap;word-break:break-word"
const LIST_STYLE = 'margin:0 0 14px;padding-left:22px'
const FENCE = /^\s*```[\w+#.-]*\s*$/
const BULLET = /^\s*[-*]\s+(.*)$/
const ORDERED = /^\s*\d+[.)]\s+(.*)$/
const HEADING = /^\s{0,3}(#{1,3})\s+(\S.*)$/
const HR = /^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/
const QUOTE = /^\s{0,3}>\s?(.*)$/
const MAX_QUOTE_DEPTH = 3
const H_STYLE = { 1: 'margin:22px 0 10px;font-size:22px;line-height:1.35', 2: 'margin:20px 0 10px;font-size:19px;line-height:1.4', 3: 'margin:18px 0 8px;font-size:16px;line-height:1.4' }
const HR_STYLE = 'margin:20px 0;border:0;border-top:1px solid #dfe2e6;height:1px;line-height:1px;font-size:1px'
const QUOTE_STYLE = 'margin:0 0 14px;padding:2px 0 2px 14px;border-left:3px solid #c5d3f5;color:#555555'
const DISPLAY = /^\s*\u0002(\d+)\u0002\s*$/
const startsBlock = (l) => DISPLAY.test(l) || FENCE.test(l) || BULLET.test(l) || ORDERED.test(l) || HEADING.test(l) || HR.test(l) || QUOTE.test(l)

const norm = (s) => String(s ?? '').replace(/\r\n?/g, '\n').replace(/\u0000/g, '')

// formulas are swapped for placeholders first, so no Markdown rule can reach the LaTeX
export function renderMarkdown(src, ctx) {
  const { text, items } = maskMath(src)
  return renderLines(norm(text).split('\n'), { ...ctx, mathItems: items }, 0)
}

function displayMath(ctx, n) {
  const item = ctx.mathItems[n]
  return (item && ctx.mathHtml?.(item)) || `<p style="${P_STYLE}">${escapeHtml(item ? item.raw : '').split('\n').join('<br>')}</p>`
}

function renderLines(lines, ctx, depth) {
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
    const dm = line.match(DISPLAY)
    if (dm) { out.push(displayMath(ctx, dm[1])); i++; continue }
    if (HR.test(line)) { out.push(`<hr style="${HR_STYLE}">`); i++; continue }
    const h = line.match(HEADING)
    if (h) { out.push(`<h${h[1].length} style="${H_STYLE[h[1].length]}">${renderInline(h[2], ctx)}</h${h[1].length}>`); i++; continue }
    if (QUOTE.test(line) && depth < MAX_QUOTE_DEPTH) {
      const inner = []
      for (; i < lines.length && QUOTE.test(lines[i]); i++) inner.push(lines[i].match(QUOTE)[1])
      out.push(`<blockquote style="${QUOTE_STYLE}">${renderLines(inner, ctx, depth + 1)}</blockquote>`)
      continue
    }
    const kind = BULLET.test(line) ? ['ul', BULLET] : ORDERED.test(line) ? ['ol', ORDERED] : null
    if (kind) {
      const items = []
      for (; i < lines.length && kind[1].test(lines[i]); i++) items.push(`<li style="margin:0 0 4px">${renderInline(lines[i].match(kind[1])[1], ctx)}</li>`)
      out.push(`<${kind[0]} style="${LIST_STYLE}">${items.join('')}</${kind[0]}>`)
      continue
    }
    // the first line is always taken (progress guaranteed); quotes past the depth limit stay plain text
    const para = [renderInline(line, ctx)]
    for (i++; i < lines.length && lines[i].trim() && !(startsBlock(lines[i]) && !(depth >= MAX_QUOTE_DEPTH && QUOTE.test(lines[i]) && !HR.test(lines[i]))); i++) para.push(renderInline(lines[i], ctx))
    out.push(`<p style="${P_STYLE}">${para.join('<br>')}</p>`)
  }
  return out.join('')
}

// the same text without markup, for the plain-text part of the mail
export function markdownToText(src, imageLabel) {
  const { text, items } = maskMath(src)
  return unmaskMath(plain(norm(text), imageLabel), items)
}

function plain(src, imageLabel) {
  return src
    .replace(/!\[[^\]\n]*\]\([^)\s]*\)/g, imageLabel)
    .replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, t, u) => (t === u ? u : `${t} (${u})`))
    .replace(/^\s*```[\w+#.-]*\s*$/gm, '')
    .replace(/^\s{0,3}#{1,3}\s+/gm, '')
    .replace(/~~(?=\S)(.+?)(?<=\S)~~/g, '$1')
    .replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*/g, '$1')
    .replace(/(?<![*\w])\*(?=[^\s*])(.+?)(?<=[^\s*])\*(?![*\w])/g, '$1')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
