// Finds LaTeX formulas in reply Markdown: $...$ (inline) and $$...$$ (display, on its own lines). The admin
// browser (which draws them to PNG) and the Edge Function (which puts the PNGs in the mail) both use this one
// scanner, so they always agree on which formulas a reply contains. Pure code: no Deno or DOM APIs.
export const MAX_FORMULAS = 20
export const MAX_LATEX = 1000
export const DISPLAY_WIDTH = 560

const FENCE = /^\s*```/
const DISPLAY_ONE = /^\s*\$\$([^$]+?)\$\$\s*$/
const DISPLAY_OPEN = /^\s*\$\$\s*$/
const INLINE = /(?<![\\$])\$(?![\s$])([^$\n]+?)(?<![\s\\])\$(?![\d$])/g
const CODE_SPAN = /`[^`\n]+`/g
const INLINE_MARK = /\u0001(\d+)\u0001/g
const DISPLAY_MARK = /\u0002(\d+)\u0002/g

// the key a formula is stored and looked up by
export const mathKey = (display, tex) => `${display ? '$$' : '$'}${tex}`

const clean = (s) => String(s ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0003]/g, '')

// Replaces every formula by a placeholder (\u0001n\u0001 inline, \u0002n\u0002 display, a line of its own) so
// later Markdown rules cannot touch the LaTeX. Fenced and inline code are left alone.
export function maskMath(src) {
  const lines = clean(src).split('\n')
  const items = []
  const out = []
  // start and end: where the formula sits in the cleaned text (the quote cutter must not cut inside one)
  const add = (display, tex, raw, start, end) => { items.push({ display, tex: tex.trim(), raw, start, end }); return items.length - 1 }
  const starts = lines.reduce((a, l, k) => (a.push(k ? a[k - 1] + lines[k - 1].length + 1 : 0), a), [])
  let fenced = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const at = starts[i]
    if (FENCE.test(line)) { fenced = !fenced; out.push(line); continue }
    if (fenced) { out.push(line); continue }
    const one = line.match(DISPLAY_ONE)
    if (one && one[1].trim()) { out.push(`\u0002${add(true, one[1], line.trim(), at, at + line.length)}\u0002`); continue }
    if (DISPLAY_OPEN.test(line)) {
      let j = i + 1
      while (j < lines.length && !DISPLAY_OPEN.test(lines[j]) && !/\$/.test(lines[j])) j++
      const body = lines.slice(i + 1, j).join('\n')
      if (j < lines.length && DISPLAY_OPEN.test(lines[j]) && body.trim()) {
        out.push(`\u0002${add(true, body, `$$\n${body}\n$$`, at, starts[j] + lines[j].length)}\u0002`)
        i = j
        continue
      }
    }
    // code spans are blanked with same-length filler, so match positions still line up with the real line
    const hidden = line.replace(CODE_SPAN, (m) => '\u0003'.repeat(m.length))
    let res = ''
    let last = 0
    for (const m of hidden.matchAll(INLINE)) {
      const end = m.index + m[0].length
      res += `${line.slice(last, m.index)}\u0001${add(false, line.slice(m.index + 1, end - 1), line.slice(m.index, end), at + m.index, at + end)}\u0001`
      last = end
    }
    out.push(res + line.slice(last))
  }
  return { text: out.join('\n'), items }
}

export const scanMath = (src) => maskMath(src).items

// the original text back, for the plain-text part of the mail
export const unmaskMath = (text, items) => String(text)
  .replace(INLINE_MARK, (_, n) => items[n]?.raw ?? '')
  .replace(DISPLAY_MARK, (_, n) => items[n]?.raw ?? '')

// null when the reply is within the limits, otherwise a short error code
export function mathLimitError(items) {
  if (items.length > MAX_FORMULAS) return 'too many formulas'
  if (items.some((x) => x.tex.length > MAX_LATEX)) return 'formula too long'
  return null
}
