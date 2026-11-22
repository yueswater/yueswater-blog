// Checks the formula PNGs the admin browser sends with a reply: [{ display, tex, path, w, h, d }]. The path is a
// file the browser uploaded to the private image bucket; w, h, d are the logical size in CSS pixels (d: how far the
// image sits below the text baseline). Nothing here is trusted: shapes, ranges and counts are all re-checked.
import { MAX_FORMULAS, MAX_LATEX, DISPLAY_WIDTH, scanMath, mathLimitError, mathKey } from './mathTokens.mjs'

const PATH = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/
const inRange = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi

export function entry(x) {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return null
  const { display, tex, path, w, h, d } = x
  if (typeof display !== 'boolean' || typeof tex !== 'string' || !tex.trim() || tex.length > MAX_LATEX) return null
  if (typeof path !== 'string' || !PATH.test(path)) return null
  if (display ? w !== DISPLAY_WIDTH || !inRange(h, 1, 2000) : !inRange(w, 1, DISPLAY_WIDTH) || !inRange(h, 1, 400)) return null
  if (!inRange(d ?? 0, -200, 200)) return null
  return { display, tex: tex.trim(), path, w: Math.round(w), h: Math.round(h), d: Math.round((d ?? 0) * 10) / 10 }
}

// body: the cleaned reply text. Returns { math } (only entries the text really uses) or { error }.
export function parseMath(input, body) {
  const found = scanMath(body)
  const limit = mathLimitError(found)
  if (limit) return { error: limit }
  if (input === undefined || input === null) return { math: [] }
  if (!Array.isArray(input) || input.length > MAX_FORMULAS) return { error: 'bad math' }
  const used = new Set(found.map((x) => mathKey(x.display, x.tex)))
  const math = []
  for (const x of input) {
    const e = entry(x)
    if (!e) return { error: 'bad math' }
    if (used.has(mathKey(e.display, e.tex))) math.push(e)
  }
  return { math }
}
