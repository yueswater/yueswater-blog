// The HTML mail shell: table layout and inline CSS only (mail clients drop most else), light colour scheme,
// 600px wide and fluid on phones. Callers pass already-safe HTML for bodyHtml and quoteHtml.
import { escapeHtml } from './escape.mjs'

export const SITE_URL = 'https://www.yueswater.com'
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang TC','Hiragino Sans CNS','Microsoft JhengHei','Noto Sans CJK TC',Roboto,Helvetica,Arial,sans-serif"
const STRINGS = {
  'zh-TW': { footer: '這封信是回覆你在網站聯絡頁留下的訊息。直接回信即可繼續對話。', visit: '前往網站' },
  en: { footer: 'This is a reply to the message you left on the website contact page. Reply to this email to continue.', visit: 'Visit the website' },
}

const head = (lang, title) => `<!doctype html><html lang="${lang === 'en' ? 'en' : 'zh-TW'}"><head><meta charset="utf-8">`
  + '<meta name="viewport" content="width=device-width,initial-scale=1">'
  + '<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">'
  + `<title>${escapeHtml(title)}</title>`
  + '<style>:root{color-scheme:light only;supported-color-schemes:light only}'
  + 'body{margin:0;padding:0}img{border:0;max-width:100%}'
  + '@media only screen and (max-width:620px){.px{padding-left:20px!important;padding-right:20px!important}.wrap{width:100%!important}}</style>'
  + '</head>'

const quoteBlock = (quoteHead, quoteHtml) => '<tr><td class="px" style="padding:0 32px 28px">'
  + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left:3px solid #1747e6;background:#f4f9fd">'
  + `<tr><td style="padding:12px 16px 4px;font-size:12px;line-height:1.5;color:#666666">${escapeHtml(quoteHead)}</td></tr>`
  + `<tr><td style="padding:0 16px 12px;font-size:14px;line-height:1.7;color:#555555">${quoteHtml}</td></tr></table></td></tr>`

export function layout({ lang, siteName, subject, bodyHtml, quoteHead, quoteHtml }) {
  const s = STRINGS[lang === 'en' ? 'en' : 'zh-TW']
  return head(lang, subject)
    + `<body style="margin:0;padding:0;background:#f4f9fd;color:#222222;font-family:${FONT}">`
    + `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(subject)}</div>`
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f9fd"><tr><td align="center" style="padding:24px 12px">'
    + '<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #dfe2e6">'
    + `<tr><td class="px" style="padding:20px 32px;background:#1747e6;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.02em;font-family:${FONT}">${escapeHtml(siteName)}</td></tr>`
    + `<tr><td class="px" style="padding:28px 32px 14px;font-size:15px;line-height:1.75;color:#222222;font-family:${FONT}">${bodyHtml}</td></tr>`
    + quoteBlock(quoteHead, quoteHtml)
    + `<tr><td class="px" style="padding:18px 32px;border-top:1px solid #dfe2e6;background:#f6f8fa;font-size:12px;line-height:1.6;color:#666666;font-family:${FONT}">`
    + `${escapeHtml(s.footer)}<br><a href="${SITE_URL}" rel="noopener noreferrer" style="color:#1747e6;text-decoration:underline">${escapeHtml(s.visit)} yueswater.com</a></td></tr>`
    + '</table></td></tr></table></body></html>'
}
