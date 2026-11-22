// Pure input checks for contact-reply. No Deno or Node APIs, so node:test can import it.
import { parseMath } from './mathInput.mjs'

export const MAX_BODY = 5000
export const STRICT_EMAIL = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/
// control, zero-width and bidi-override characters (U+200D stays: emoji sequences need it)
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​‌‎‏‪-‮⁠-⁤⁦-⁩﻿]/g

export const cleanBody = (v) => String(v ?? '').replace(/\r\n?/g, '\n').replace(INVISIBLE, '').trim()

// header values must be one line: CR and LF would start a new header
export const oneLine = (v) => String(v ?? '').replace(/[\r\n\u2028\u2029]+/g, ' ').replace(INVISIBLE, '').trim()

// the request body from the browser: { message_id, body } and, when the text has formulas, math (mathInput.mjs); nothing else is read
export function parseRequest(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'bad request' }
  const id = input.message_id
  if (!Number.isSafeInteger(id) || id < 1) return { error: 'bad message_id' }
  if (typeof input.body !== 'string') return { error: 'bad body' }
  const body = cleanBody(input.body)
  if (!body) return { error: 'empty body' }
  if (body.length > MAX_BODY) return { error: 'body too long' }
  const m = parseMath(input.math, body)
  if ('error' in m) return { error: m.error }
  return m.math.length ? { id, body, math: m.math } : { id, body }
}

// the recipient comes only from the stored message; re-checked here in case a bad row got in
export function storedEmail(v) {
  const e = String(v ?? '').trim().toLowerCase()
  return e.length <= 200 && STRICT_EMAIL.test(e) ? e : null
}
