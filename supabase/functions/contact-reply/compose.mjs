// Builds the outgoing mail. Everything typed by the visitor or the admin is escaped before it is rendered;
// every header value is one line.
import { oneLine } from './validate.mjs'
import { escapeHtml } from './escape.mjs'
import { renderMarkdown, markdownToText } from './markdown.mjs'
import { imageResolver } from './images.mjs'
import { formatTime } from './date.mjs'
import { layout } from './template.mjs'

export { escapeHtml }
export const FROM_ADDRESS = 'contact@yueswater.com'
// Display name shown to the visitor. Undecided: change this default, or set the FROM_NAME secret.
export const DEFAULT_FROM_NAME = '岳氏礦泉水'
export const FROM = `${DEFAULT_FROM_NAME} <${FROM_ADDRESS}>`
// one line, no angle brackets or quotes, so the name cannot reshape the address part
export const displayName = (name) => oneLine(name).replace(/[<>"\\]/g, '').slice(0, 60).trim() || DEFAULT_FROM_NAME
export const fromHeader = (name) => `${displayName(name)} <${FROM_ADDRESS}>`
export const REPLY_TO = 'contact@yueswater.com'
const TOPICS = {
  'zh-TW': { collab: '合作邀約', post: '文章問題', job: '工作機會', other: '其他' },
  en: { collab: 'Collaboration', post: 'Question about a post', job: 'Job opportunity', other: 'Other' },
}
const LABELS = { 'zh-TW': { image: '[圖片]', wrote: (t) => `你在 ${t} 寫道：` }, en: { image: '[image]', wrote: (t) => `On ${t}, you wrote:` } }
const QUOTE_MAX = 600

const langOf = (m) => (m.lang === 'en' ? 'en' : 'zh-TW')

export function subjectFor(msg) {
  const l = langOf(msg)
  return oneLine(`Re: ${TOPICS[l][msg.topic] || TOPICS[l].other}`).slice(0, 120)
}

// the visitor's original text (still Markdown), cut short
export function quoted(msg) {
  const t = String(msg.body ?? '').replace(/\r\n?/g, '\n').trim()
  return t.length > QUOTE_MAX ? `${t.slice(0, QUOTE_MAX)}…` : t
}

// imageOrigin: the Supabase origin; images: { 'uuid.png': signed https URL } for the file names in the texts
export function compose({ to, msg, body, messageId, fromName, imageOrigin, images }) {
  const l = langOf(msg)
  const lab = LABELS[l]
  const ctx = { imageUrl: imageResolver({ origin: imageOrigin, images }), imageLabel: lab.image }
  const when = formatTime(msg.ts, l)
  const head = lab.wrote(when || (l === 'en' ? 'an earlier date' : '先前'))
  const q = quoted(msg)
  const subject = subjectFor(msg)
  const text = `${markdownToText(body, lab.image)}\n\n${head}\n${markdownToText(q, lab.image).split('\n').map((x) => `> ${x}`).join('\n')}\n`
  const html = layout({
    lang: l, siteName: displayName(fromName), subject,
    bodyHtml: renderMarkdown(body, ctx), quoteHead: head, quoteHtml: renderMarkdown(q, ctx),
  })
  return {
    from: fromHeader(fromName),
    to: [to],
    reply_to: REPLY_TO,
    subject,
    text,
    html,
    headers: { 'X-Entity-Ref-ID': `contact-${messageId}` },
  }
}
