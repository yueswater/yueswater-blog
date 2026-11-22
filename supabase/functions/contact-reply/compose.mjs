// Builds the outgoing mail. Everything the visitor typed is escaped; every header value is one line.
import { oneLine } from './validate.mjs'

export const FROM_ADDRESS = 'contact@yueswater.com'
// Display name shown to the visitor. Undecided: change this default, or set the FROM_NAME secret.
export const DEFAULT_FROM_NAME = '岳氏礦泉水'
export const FROM = `${DEFAULT_FROM_NAME} <${FROM_ADDRESS}>`
// one line, no angle brackets or quotes, so the name cannot reshape the address part
export const fromHeader = (name) => {
  const n = oneLine(name).replace(/[<>"\\]/g, '').slice(0, 60).trim()
  return `${n || DEFAULT_FROM_NAME} <${FROM_ADDRESS}>`
}
export const REPLY_TO = 'contact@yueswater.com'
const TOPICS = {
  'zh-TW': { collab: '合作邀約', post: '文章問題', job: '工作機會', other: '其他' },
  en: { collab: 'Collaboration', post: 'Question about a post', job: 'Job opportunity', other: 'Other' },
}
const QUOTE_MAX = 600

export const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const langOf = (m) => (m.lang === 'en' ? 'en' : 'zh-TW')

export function subjectFor(msg) {
  const l = langOf(msg)
  return oneLine(`Re: ${TOPICS[l][msg.topic] || TOPICS[l].other}`).slice(0, 120)
}

// the visitor's original text, cut short, with images and markup flattened to plain text
export function quoted(msg) {
  const t = String(msg.body ?? '').replace(/!\[[^\]\n]*\]\([^)]*\)/g, '[image]').replace(/\r\n?/g, '\n').trim()
  return t.length > QUOTE_MAX ? `${t.slice(0, QUOTE_MAX)}…` : t
}

export function compose({ to, msg, body, messageId, fromName }) {
  const l = langOf(msg)
  const head = l === 'en' ? `On ${msg.ts}, you wrote:` : `你在 ${msg.ts} 寫道：`
  const q = quoted(msg)
  const text = `${body}\n\n${head}\n${q.split('\n').map((x) => `> ${x}`).join('\n')}\n`
  const html = `<div style="font:15px/1.7 -apple-system,Segoe UI,sans-serif;color:#222">${escapeHtml(body).replace(/\n/g, '<br>')}`
    + `<blockquote style="margin:20px 0 0;padding:0 0 0 12px;border-left:3px solid #ccc;color:#666">`
    + `<p style="margin:0 0 6px">${escapeHtml(head)}</p>${escapeHtml(q).replace(/\n/g, '<br>')}</blockquote></div>`
  return {
    from: fromHeader(fromName),
    to: [to],
    reply_to: REPLY_TO,
    subject: subjectFor(msg),
    text,
    html,
    headers: { 'X-Entity-Ref-ID': `contact-${messageId}` },
  }
}
