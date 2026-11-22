// The excerpt of the visitor's message quoted under a reply. The server derives it from the stored message and the
// admin browser derives it from the same stored text with this same code, so both agree on which formulas it holds.
// Pure code: no Deno or DOM APIs.
import { scanMath, MAX_LATEX } from './mathTokens.mjs'

export const QUOTE_MAX = 600
// a quote never holds more formulas than this, so a message full of them cannot use up the reply's share of the limit
export const QUOTE_MAX_FORMULAS = 10

const normalise = (body) => String(body ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0003]/g, '').trim()

// the visitor's original text (still Markdown), cut short; the cut never falls inside a formula (it moves before it)
export function quoteExcerpt(body) {
  const t = normalise(body)
  const items = scanMath(t)
  let cut = Math.min(t.length, QUOTE_MAX)
  if (items.length > QUOTE_MAX_FORMULAS) cut = Math.min(cut, items[QUOTE_MAX_FORMULAS].start)
  const split = items.find((x) => x.start < cut && x.end > cut)
  if (split) cut = split.start
  return cut < t.length ? `${t.slice(0, cut)}…` : t
}

// the formulas of the excerpt that can become pictures (an over-long one stays as text)
export const quoteFormulas = (body) => scanMath(quoteExcerpt(body)).filter((x) => x.tex.length <= MAX_LATEX)
