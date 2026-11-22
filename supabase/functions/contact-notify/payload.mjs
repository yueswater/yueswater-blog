// Pure input checks for contact-notify. The database trigger sends the stored row; the shared secret already
// proves who is calling, but every field is still treated as hostile text (it was typed by a visitor).
export const STRICT_EMAIL = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/
export const MAX_BODY = 4000
// control, zero-width and bidi-override characters (U+200D stays: emoji sequences need it)
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​‌‎‏‪-‮⁠-⁤⁦-⁩﻿]/g
const TOPICS = ['collab', 'post', 'job', 'other']

// header values must be one line: CR and LF would start a new header
export const oneLine = (v) => String(v ?? '').replace(/[\r\n\u2028\u2029]+/g, ' ').replace(INVISIBLE, '').trim()
const cleanBody = (v) => String(v ?? '').replace(/\r\n?/g, '\n').replace(INVISIBLE, '').trim()

// a strictly valid lower-case address or null (used for the recipient and for Reply-To)
export function strictEmail(v) {
  const e = String(v ?? '').trim().toLowerCase()
  return e.length <= 200 && STRICT_EMAIL.test(e) ? e : null
}

// accepts a Database Webhook shape { record } or the flat row; returns the normalised message or { error }
export function parsePayload(input) {
  const rec = input && typeof input === 'object' && !Array.isArray(input) ? (input.record ?? input) : null
  if (!rec || typeof rec !== 'object') return { error: 'bad payload' }
  if (!Number.isSafeInteger(rec.id) || rec.id < 1) return { error: 'bad id' }
  if (typeof rec.name !== 'string' || typeof rec.body !== 'string') return { error: 'bad fields' }
  const body = cleanBody(rec.body)
  if (!body) return { error: 'empty body' }
  const ts = Number.isNaN(new Date(rec.ts).getTime()) ? null : new Date(rec.ts).toISOString()
  return {
    msg: {
      id: rec.id,
      ts,
      name: oneLine(rec.name).slice(0, 80) || '(no name)',
      email: oneLine(rec.email).slice(0, 200),
      replyTo: strictEmail(rec.email),
      org: oneLine(rec.org).slice(0, 120),
      topic: TOPICS.includes(rec.topic) ? rec.topic : 'other',
      body: body.length > MAX_BODY ? `${body.slice(0, MAX_BODY)}…` : body,
      truncated: body.length > MAX_BODY,
      lang: rec.lang === 'en' ? 'en' : rec.lang === 'zh-TW' ? 'zh-TW' : '',
      path: oneLine(rec.path).slice(0, 200),
    },
  }
}
