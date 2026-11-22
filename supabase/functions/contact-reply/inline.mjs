// Inline Markdown to safe HTML: code spans, images, links, bold, italic, strikethrough. The input is escaped first, so
// the only tags in the output are the ones written here. Link and image targets are re-validated.
import { escapeHtml } from './escape.mjs'

const CODE_STYLE = "font-family:'SFMono-Regular',Menlo,Consolas,'PingFang TC','Microsoft JhengHei',monospace;font-size:0.9em;background:#e8f1f9;color:#0f35b8;padding:1px 5px;border-radius:3px"
const LINK_STYLE = 'color:#1747e6;text-decoration:underline'
const IMG_STYLE = 'display:block;max-width:100%;height:auto;border:1px solid #dfe2e6;margin:8px 0'
const TOKEN = /\u0000(\d+)\u0000/

// the escaped target back to a real URL; only http(s) survives, and the result is re-escaped on output
export function safeUrl(escaped) {
  const raw = String(escaped).replace(/&amp;/g, '&')
  if (/&(?:quot|lt|gt|#39);|[<>"'\s\\]/.test(raw)) return null
  try {
    const u = new URL(raw)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null
  } catch { return null }
}

// ctx: { imageUrl(src) -> https URL or null, imageLabel }
export function renderInline(text, ctx) {
  const stash = []
  const keep = (html) => { stash.push(html); return `\u0000${stash.length - 1}\u0000` }
  let s = escapeHtml(String(text).replace(/\u0000/g, ''))
  s = s.replace(/`([^`\n]+)`/g, (_, c) => keep(`<code style="${CODE_STYLE}">${c}</code>`))
  s = s.replace(/!\[([^\]\n]*)\]\(([^)\s]*)\)/g, (_, alt, src) => {
    const url = ctx.imageUrl(src.replace(/&amp;/g, '&'))
    return keep(url ? `<img src="${escapeHtml(url)}" alt="${alt}" style="${IMG_STYLE}">` : escapeHtml(ctx.imageLabel))
  })
  s = s.replace(/\[([^\]\n]+)\]\(([^)\s]*)\)/g, (m, label, href) => {
    const url = safeUrl(href)
    return url ? keep(`<a href="${escapeHtml(url)}" rel="noopener noreferrer" target="_blank" style="${LINK_STYLE}">${label}</a>`) : label
  })
  s = s.replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/~~(?=\S)(.+?)(?<=\S)~~/g, '<s>$1</s>')
  s = s.replace(/(?<![*\w])\*(?=[^\s*])(.+?)(?<=[^\s*])\*(?![*\w])/g, '<em>$1</em>')
  for (let i = 0; i < 3 && TOKEN.test(s); i++) s = s.replace(/\u0000(\d+)\u0000/g, (_, n) => stash[n])
  return s
}
