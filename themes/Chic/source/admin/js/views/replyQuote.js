// Formulas in the quoted visitor message. The excerpt is cut with the same code as the Edge Function (quote.mjs), so
// both sides agree on which formulas it holds. They are drawn and uploaded like the reply's, but an unparsable one is
// not an error: it stays as plain text in the mail and the admin gets a note.
import { EDITOR_STRINGS as S } from './replyStrings.js'
import { loadMath, distinct, fillText } from './replyMath.js'

export function createQuoteMath(row, store) {
  const items = (m) => (String(row.body ?? '').includes('$') ? m.quoteFormulas(row.body) : [])
  const note = (n) => (n ? fillText(S.quote_bad, n) : '')
  return {
    // shown while the dialog is open
    async note() {
      const m = await loadMath()
      const rows = items(m).length ? await m.check(items(m)) : []
      return note(rows.filter((r) => r.bad).length)
    },
    // -> { quoteMath: array or undefined, note }; throws when an upload fails
    // before anything is drawn or uploaded: reply and quote together must stay within the limit
    async assertTotal(replyMd) {
      const m = await loadMath()
      if (m.mathLimitError(m.scanMath(replyMd))) return // the reply's own limit error comes first
      const found = distinct(m, items(m))
      const total = new Set([...found, ...(replyMd.includes('$') ? m.scanMath(replyMd) : [])].map((x) => m.mathKey(x.display, x.tex)))
      if (found.length && total.size > m.MAX_FORMULAS) throw new Error(fillText(S.math_total, m.MAX_FORMULAS))
    },
    async prepare() {
      const m = await loadMath()
      const found = distinct(m, items(m))
      if (!found.length) return { quoteMath: undefined, note: '' }
      const out = []
      let bad = 0
      for (const x of found) {
        try { out.push(await store(m, x)) } catch (e) { if (!e.bad) throw e; bad++ }
      }
      return { quoteMath: out.length ? out : undefined, note: note(bad) }
    },
  }
}
