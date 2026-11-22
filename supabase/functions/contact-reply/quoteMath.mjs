// Formula PNGs for the quoted visitor message: the admin browser sends quote_math next to math, in the same shape
// ({ display, tex, path, w, h, d }) and it is checked as strictly. The excerpt is re-derived here from the stored
// message, never from the request, and only entries the excerpt really uses are kept.
import { MAX_FORMULAS, scanMath, mathKey } from './mathTokens.mjs'
import { entry } from './mathInput.mjs'
import { quoteFormulas } from './quote.mjs'

// shape check, before the stored message is known: { quoteMath } or { error }
export function parseQuoteShape(input) {
  if (input === undefined || input === null) return { quoteMath: [] }
  if (!Array.isArray(input) || input.length > MAX_FORMULAS) return { error: 'bad quote math' }
  const quoteMath = []
  for (const x of input) {
    const e = entry(x)
    if (!e) return { error: 'bad quote math' }
    quoteMath.push(e)
  }
  return { quoteMath }
}

// stored: the message body from the database; reply: the cleaned reply text.
// -> { quoteMath } (used entries only) or { error } when reply and quote together need more than MAX_FORMULAS pictures
export function resolveQuoteMath(list, stored, reply) {
  const found = quoteFormulas(stored)
  const keys = new Set(found.map((x) => mathKey(x.display, x.tex)))
  const total = new Set([...keys, ...scanMath(reply).map((x) => mathKey(x.display, x.tex))])
  if (total.size > MAX_FORMULAS) return { error: 'too many formulas' }
  const seen = new Set()
  const quoteMath = list.filter((e) => {
    const k = mathKey(e.display, e.tex)
    if (!keys.has(k) || seen.has(k)) return false
    seen.add(k)
    return true
  })
  return { quoteMath }
}
