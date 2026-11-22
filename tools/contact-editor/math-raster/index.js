// Loaded on demand by the admin reply dialog (bundled to themes/Chic/source/js/widgets/contact/math-raster.bundle.js):
// finds the formulas of a reply, measures them for the "too wide" warning and draws them to PNG at send time.
import { scanMath, mathLimitError, mathKey, MAX_FORMULAS, MAX_LATEX } from '../../../supabase/functions/contact-reply/mathTokens.mjs'
import { measure, rasterize } from './raster.js'

export { quoteExcerpt, quoteFormulas } from '../../../supabase/functions/contact-reply/quote.mjs'
export { scanMath, mathLimitError, mathKey, MAX_FORMULAS, MAX_LATEX }
export { MATH_RASTER_SCALE } from './layout.mjs'

const unique = (items) => [...new Map(items.map((x) => [mathKey(x.display, x.tex), x])).values()]

// -> [{ display, tex, shrunk, bad }] for each distinct formula (bad: MathJax cannot parse it)
export async function check(items) {
  const out = []
  for (const x of unique(items)) {
    try { out.push({ display: x.display, tex: x.tex, shrunk: (await measure(x.tex, x.display)).shrunk, bad: false }) } catch { out.push({ display: x.display, tex: x.tex, shrunk: false, bad: true }) }
  }
  return out
}

// -> [{ display, tex, blob, w, h, d }] one PNG per distinct formula
export async function renderAll(items) {
  const out = []
  for (const x of unique(items)) out.push({ display: x.display, tex: x.tex, ...(await rasterize(x.tex, x.display)) })
  return out
}
