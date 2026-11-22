// Mail footer: logo, site name, reply guidance, a quiet brand link, a divider and a copyright line whose year is
// computed at send time in Taipei. Table layout and inline CSS only; the logo is a PNG (Gmail drops SVG).
import { escapeHtml } from './escape.mjs'

export const SITE_URL = 'https://www.yueswater.com'
export const LOGO_URL = `${SITE_URL}/assets/logo-mail.png`
const BRAND = '#1747e6'
const STRINGS = {
  'zh-TW': { guide: '這封信是回覆你在網站聯絡頁留下的訊息。直接回信即可繼續對話。', visit: '前往網站', rights: '版權所有' },
  en: { guide: 'This is a reply to the message you left on the website contact page. Reply to this email to continue.', visit: 'Visit the website', rights: 'All rights reserved.' },
}
const strings = (lang) => STRINGS[lang === 'en' ? 'en' : 'zh-TW']

// the calendar year in Asia/Taipei, so the copyright line never goes stale and never flips early or late
export function currentYear(now = new Date()) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', year: 'numeric' }).format(now)
}

const copyright = (lang, siteName, now) => `© ${currentYear(now)} ${siteName} · ${strings(lang).rights}`

export function footerHtml({ lang, siteName, font, now }) {
  const s = strings(lang)
  const name = escapeHtml(siteName)
  return `<tr><td class="px" style="padding:24px 32px 22px;border-top:1px solid #dfe2e6;background:#f6f8fa;font-family:${font}">`
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>'
    + `<td style="padding-right:10px;vertical-align:middle"><a href="${SITE_URL}" rel="noopener noreferrer" target="_blank"><img src="${LOGO_URL}" width="36" height="36" alt="${name}" style="display:block;border:0;width:36px;height:36px"></a></td>`
    + `<td style="vertical-align:middle;font-size:15px;font-weight:700;color:#222222;font-family:${font}">${name}</td></tr></table>`
    + `<p style="margin:14px 0 6px;font-size:13px;line-height:1.7;color:#555555">${escapeHtml(s.guide)}</p>`
    + `<p style="margin:0;font-size:13px;line-height:1.7"><a href="${SITE_URL}" rel="noopener noreferrer" target="_blank" style="color:${BRAND};text-decoration:none;font-weight:600">${escapeHtml(s.visit)} &rsaquo;</a></p>`
    + '<div style="margin:16px 0 12px;height:1px;line-height:1px;font-size:1px;background:#dfe2e6">&nbsp;</div>'
    + `<p style="margin:0;font-size:12px;line-height:1.6;color:#888888">${escapeHtml(copyright(lang, siteName, now))}</p>`
    + '</td></tr>'
}

export function footerText({ lang, siteName, now }) {
  const s = strings(lang)
  return `${s.guide}\n${s.visit}: ${SITE_URL}\n${copyright(lang, siteName, now)}`
}
