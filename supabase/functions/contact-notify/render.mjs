// HTML and plain-text bodies of the notification. Table layout and inline CSS only, light colours, 600px.
// Every visitor-typed value goes through escapeHtml; the message body goes through the shared whitelist renderer
// with no image or formula resolvers, so images show as a label and formulas as their LaTeX source.
import { escapeHtml } from '../contact-reply/escape.mjs'
import { renderMarkdown, markdownToText } from '../contact-reply/markdown.mjs'
import { formatTime } from '../contact-reply/date.mjs'
import { ADMIN_URL, TOPIC_LABEL, LANG_LABEL, IMAGE_LABEL, L } from './strings.mjs'

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang TC','Hiragino Sans CNS','Microsoft JhengHei','Noto Sans CJK TC',Roboto,Helvetica,Arial,sans-serif"
const BRAND = '#1747e6'
const ctx = { imageUrl: () => null, imageLabel: IMAGE_LABEL }

export function fields(msg) {
  return [
    [L.name, msg.name], [L.email, msg.email], [L.org, msg.org || L.none], [L.topic, TOPIC_LABEL[msg.topic]],
    [L.time, formatTime(msg.ts, 'zh-TW') || L.none], [L.path, msg.path || L.none], [L.lang, LANG_LABEL[msg.lang]],
  ]
}

const row = ([k, v]) => `<tr><td style="padding:6px 12px 6px 0;width:72px;vertical-align:top;font-size:13px;color:#666666;white-space:nowrap">${escapeHtml(k)}</td>`
  + `<td style="padding:6px 0;font-size:14px;color:#222222;word-break:break-word">${escapeHtml(v)}</td></tr>`

export function htmlBody(msg, subject) {
  const note = msg.truncated ? `<p style="margin:0;font-size:12px;color:#888888">${escapeHtml(L.truncated)}</p>` : ''
  return '<!doctype html><html lang="zh-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">'
    + `<title>${escapeHtml(subject)}</title><style>:root{color-scheme:light only}body{margin:0;padding:0}@media only screen and (max-width:620px){.px{padding-left:20px!important;padding-right:20px!important}.wrap{width:100%!important}}</style></head>`
    + `<body style="margin:0;padding:0;background:#f4f9fd;color:#222222;font-family:${FONT}">`
    + `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(subject)}</div>`
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f9fd"><tr><td align="center" style="padding:24px 12px">'
    + '<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #dfe2e6">'
    + `<tr><td class="px" style="padding:20px 32px;background:${BRAND};color:#ffffff;font-size:18px;font-weight:700;font-family:${FONT}">${escapeHtml(L.title)}</td></tr>`
    + `<tr><td class="px" style="padding:24px 32px 8px;font-family:${FONT}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${fields(msg).map(row).join('')}</table></td></tr>`
    + `<tr><td class="px" style="padding:12px 32px 8px;font-family:${FONT}"><div style="border-left:3px solid ${BRAND};background:#f4f9fd;padding:12px 16px;font-size:15px;line-height:1.75;color:#222222">${renderMarkdown(msg.body, ctx)}${note}</div></td></tr>`
    + `<tr><td class="px" style="padding:20px 32px 28px;font-family:${FONT}"><a href="${ADMIN_URL}" rel="noopener noreferrer" target="_blank" style="display:inline-block;padding:12px 24px;background:${BRAND};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:4px">${escapeHtml(L.cta)}</a></td></tr>`
    + `<tr><td class="px" style="padding:16px 32px;border-top:1px solid #dfe2e6;background:#f6f8fa;font-size:12px;line-height:1.6;color:#888888;font-family:${FONT}">${escapeHtml(L.tail)}</td></tr>`
    + '</table></td></tr></table></body></html>'
}

export function textBody(msg) {
  const head = fields(msg).map(([k, v]) => `${k}: ${v}`).join('\n')
  return `${head}\n\n${markdownToText(msg.body, IMAGE_LABEL)}${msg.truncated ? `\n${L.truncated}` : ''}\n\n${L.cta}: ${ADMIN_URL}\n\n-- \n${L.tail}\n`
}
