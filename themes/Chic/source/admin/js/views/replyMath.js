// Formulas in an admin reply. While writing: a debounced check that warns about formulas wider than the mail or past
// the limits. At send time: every formula is drawn to a PNG in this browser, uploaded to the private image bucket,
// and described to the Edge Function ({ display, tex, path, w, h, d }). The drawing code (MathJax, about 3.6 MB) is
// only fetched when a reply actually contains a formula, and nothing is requested from any other site.
import { EDITOR_STRINGS as S } from './replyStrings.js'

let lib = null
const load = () => (lib ||= import('/js/widgets/contact/math-raster.bundle.js'))
const fill = (text, n) => text.replace('{n}', n)

function limitMessage(m, code) {
  return code === 'too many formulas' ? fill(S.math_many, m.MAX_FORMULAS) : fill(S.math_long, m.MAX_LATEX)
}

// warn(text): '' clears the warning
export function createMathCheck(warn) {
  let timer = 0
  let run = 0
  async function check(md) {
    const id = ++run
    if (!md.includes('$')) return warn('')
    const m = await load()
    const items = m.scanMath(md)
    const limit = m.mathLimitError(items)
    const rows = items.length && !limit ? await m.check(items) : []
    if (id !== run) return
    const wide = rows.filter((r) => r.shrunk).length
    const bad = rows.find((r) => r.bad)
    warn(limit ? limitMessage(m, limit) : bad ? S.math_bad + bad.tex : wide ? fill(S.math_wide, wide) : '')
  }
  return {
    update: (md) => { clearTimeout(timer); timer = setTimeout(() => check(md).catch(() => warn('')), 350) },
    stop: () => { clearTimeout(timer); run++ },
  }
}

// one sender per dialog: formulas already uploaded are reused when a send is retried
export function createMathSender(backend) {
  const done = new Map()
  // -> the math array for the request, or undefined when the text has no formulas; throws an Error with a message for the admin
  return async function prepare(md) {
    if (!md.includes('$')) return undefined
    const m = await load()
    const items = m.scanMath(md)
    if (!items.length) return undefined
    const limit = m.mathLimitError(items)
    if (limit) throw new Error(limitMessage(m, limit))
    const out = []
    for (const x of items.filter((v, i) => items.findIndex((y) => m.mathKey(y.display, y.tex) === m.mathKey(v.display, v.tex)) === i)) {
      const key = m.mathKey(x.display, x.tex)
      if (!done.has(key)) {
        let png
        try { png = (await m.renderAll([x]))[0] } catch { throw new Error(S.math_bad + x.tex) }
        const path = `${crypto.randomUUID()}.png`
        try { await backend.uploadImage(path, png.blob) } catch { throw new Error(S.math_fail) }
        done.set(key, { display: x.display, tex: x.tex, path, w: png.w, h: png.h, d: png.d })
      }
      out.push(done.get(key))
    }
    return out
  }
}
