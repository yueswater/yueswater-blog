// Assembles the mail object for Resend. The recipient is the owner's address from the NOTIFY_EMAIL secret only.
import { fromHeader } from '../contact-reply/compose.mjs'
import { oneLine, strictEmail } from './payload.mjs'
import { TOPIC_LABEL } from './strings.mjs'
import { htmlBody, textBody } from './render.mjs'

export const subjectFor = (msg) => oneLine(`新留言：${TOPIC_LABEL[msg.topic]} - ${msg.name}`).slice(0, 100)

// null when the owner address is missing or invalid: the caller then sends nothing
export function composeNotice({ to, msg, fromName }) {
  const rcpt = strictEmail(to)
  if (!rcpt) return null
  const subject = subjectFor(msg)
  return {
    from: fromHeader(fromName),
    to: [rcpt],
    // replying goes to the visitor, but only for an address that passes the strict check
    ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
    subject,
    text: textBody(msg),
    html: htmlBody(msg, subject),
    headers: { 'X-Entity-Ref-ID': `contact-notify-${msg.id}` },
  }
}
