// Shared-secret check for the database caller. Compares every byte of both strings with no early exit, so the
// time taken does not reveal how many leading characters matched.
const enc = new TextEncoder()

export function safeEqual(given, expected) {
  if (typeof given !== 'string' || typeof expected !== 'string' || expected.length === 0) return false
  const a = enc.encode(given)
  const b = enc.encode(expected)
  let diff = a.length ^ b.length
  const n = Math.max(a.length, b.length)
  for (let i = 0; i < n; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0)
  return diff === 0
}

export const HEADER = 'x-notify-secret'
