// Math tokens in reply Markdown: what counts as a formula, what does not, and how the plain-text part keeps the LaTeX.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { maskMath, scanMath, unmaskMath, mathLimitError, MAX_FORMULAS, MAX_LATEX } from '../../../supabase/functions/contact-reply/mathTokens.mjs'
import { renderMarkdown, markdownToText } from '../../../supabase/functions/contact-reply/markdown.mjs'

const tex = (s) => scanMath(s).map((x) => `${x.display ? 'D' : 'I'}:${x.tex}`)

test('inline and display formulas are found in order', () => {
  assert.deepEqual(tex('a $x_1$ b $y^2$\n\n$$\n\\sum_i a_i\n$$\n\n$$ z $$'), ['I:x_1', 'I:y^2', 'D:\\sum_i a_i', 'D:z'])
})

test('prices, escaped dollars, spaced dollars and lone signs are not formulas', () => {
  for (const s of ['it costs $5 and $6', 'a \\$x\\$ b', 'a $ x $ b', 'only one $ here', '$$', '$$\n$$', '$ $', '$$$$']) assert.deepEqual(tex(s), [], s)
})

test('code spans and fences hide formulas', () => {
  assert.deepEqual(tex('`$x$` and ```$y$```'), [])
  assert.deepEqual(tex('```\n$$\nx\n$$\n$z$\n```\n$ok$'), ['I:ok'])
})

test('an unclosed display block stays text', () => {
  assert.deepEqual(tex('$$\nx = 1\nno end'), [])
})

test('placeholders hide the LaTeX from Markdown rules and unmask to the original', () => {
  const { text, items } = maskMath('*a* $x*y*z$ b\n$$\n*q*\n$$')
  assert.doesNotMatch(text, /\$/)
  assert.equal(unmaskMath(text, items), '*a* $x*y*z$ b\n$$\n*q*\n$$')
})

test('input cannot smuggle placeholders in', () => {
  const { text, items } = maskMath('a \u0001 0 \u0001 \u0002 0 \u0002 \u0003')
  assert.equal(items.length, 0)
  assert.doesNotMatch(text, /[\u0001-\u0003]/)
})

test('plain-text part keeps the LaTeX source untouched', () => {
  const t = markdownToText('**bold** $a*b*c$ and\n$$\n\\frac{*1*}{2}\n$$')
  assert.equal(t, 'bold $a*b*c$ and\n$$\n\\frac{*1*}{2}\n$$')
})

test('markdown rules do not run inside a formula, without images the source shows as escaped text', () => {
  const h = renderMarkdown('see $a_1*b*c<d>$ ok', { imageUrl: () => null, imageLabel: '[img]' })
  assert.match(h, /\$a_1\*b\*c&lt;d&gt;\$/)
  assert.doesNotMatch(h, /<em>|<d>/)
  const d = renderMarkdown('$$\n<script>x</script>\n$$', { imageUrl: () => null, imageLabel: '[img]' })
  assert.match(d, /&lt;script&gt;/)
  assert.doesNotMatch(d, /<script>/)
})

test('limits: count and length', () => {
  assert.equal(mathLimitError(scanMath(Array.from({ length: MAX_FORMULAS }, (_, i) => `$a${i}$`).join(' '))), null)
  assert.equal(mathLimitError(scanMath(Array.from({ length: MAX_FORMULAS + 1 }, (_, i) => `$a${i}$`).join(' '))), 'too many formulas')
  assert.equal(mathLimitError(scanMath(`$${'x'.repeat(MAX_LATEX)}$`)), null)
  assert.equal(mathLimitError(scanMath(`$${'x'.repeat(MAX_LATEX + 1)}$`)), 'formula too long')
})

test('hostile long lines are scanned in linear time', () => {
  const t = Date.now()
  scanMath(`${'$a'.repeat(2500)}\n${'$$\n'.repeat(1500)}`)
  assert.ok(Date.now() - t < 500)
})
