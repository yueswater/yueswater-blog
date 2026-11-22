// Formulas in the quoted visitor message: excerpt cutting, request checks, hostile visitor text, the mail and the Bcc copy.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { quoteExcerpt, quoteFormulas, QUOTE_MAX, QUOTE_MAX_FORMULAS } from '../../../supabase/functions/contact-reply/quote.mjs'
import { parseQuoteShape, resolveQuoteMath } from '../../../supabase/functions/contact-reply/quoteMath.mjs'
import { parseRequest, notifyEmail } from '../../../supabase/functions/contact-reply/validate.mjs'
import { compose } from '../../../supabase/functions/contact-reply/compose.mjs'

const ORIGIN = 'https://abc.supabase.co'
const P1 = '11111111-2222-3333-4444-555555555555.png'
const P2 = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.png'
const signed = (p) => `${ORIGIN}/storage/v1/object/sign/contact-images/${p}?token=t`
const images = { [P1]: signed(P1), [P2]: signed(P2) }
const inline = (tex, path = P1) => ({ display: false, tex, path, w: 20, h: 16, d: 2 })
const block = (tex, path = P2) => ({ display: true, tex, path, w: 560, h: 50, d: 0 })
// every tag with its quoted attribute values blanked: what is left is what a mail client would treat as live
const liveTags = (html) => [...html.matchAll(/<[a-z][^>]*>/gi)].map((m) => m[0].replace(/"[^"]*"/g, '""'))
const pictures = (html) => (html.match(/contact-images/g) || []).length
const mail = (visitor, quoteMath, extra = {}) => compose({
  to: 'a@b.co', msg: { id: 1, ts: '2026-01-01T00:00:00Z', topic: 'post', body: visitor, lang: 'zh-TW' },
  body: 'reply', messageId: 1, imageOrigin: ORIGIN, images, quoteMath, ...extra,
})

test('short messages are quoted whole, formulas included', () => {
  const b = 'see $x^2$\n\n$$\n\\sum_i a_i\n$$'
  assert.equal(quoteExcerpt(b), b)
  assert.deepEqual(quoteFormulas(b).map((x) => x.tex), ['x^2', '\\sum_i a_i'])
})

test('the 600 character cut never falls inside an inline formula: it moves before it', () => {
  const body = `${'a'.repeat(QUOTE_MAX - 3)} $xyz_{12}$ tail`
  const q = quoteExcerpt(body)
  assert.equal(q, `${'a'.repeat(QUOTE_MAX - 3)} …`)
  assert.deepEqual(quoteFormulas(body), [])
  assert.ok(!q.includes('$'))
})

test('the cut never falls inside a display formula', () => {
  const body = `${'a'.repeat(QUOTE_MAX - 10)}\n\n$$\n\\frac{a}{b}+\\frac{c}{d}\n$$\n\nmore`
  const q = quoteExcerpt(body)
  assert.ok(!q.includes('$'))
  assert.ok(q.endsWith('…'))
})

test('a formula that ends before the cut stays whole', () => {
  const body = `$a$ ${'b'.repeat(QUOTE_MAX)}`
  assert.ok(quoteExcerpt(body).startsWith('$a$ '))
  assert.equal(quoteFormulas(body).length, 1)
})

test('a quote holds at most QUOTE_MAX_FORMULAS formulas', () => {
  const body = Array.from({ length: 30 }, (_, i) => `$a${i}$`).join(' ')
  assert.equal(quoteFormulas(body).length, QUOTE_MAX_FORMULAS)
  assert.ok(quoteExcerpt(body).endsWith('…'))
})

test('formulas in code are not scanned, over-long ones stay text', () => {
  assert.deepEqual(quoteFormulas('`$x$` and $' + 'x'.repeat(1001) + '$'), [])
})

test('quote_math is validated as strictly as math', () => {
  assert.deepEqual(parseQuoteShape(undefined), { quoteMath: [] })
  const bad = [
    { ...inline('x'), path: '../secret.png' }, { ...inline('x'), path: `${P1}?a=1` }, { ...inline('x'), path: 'https://evil.example/a.png' },
    { ...inline('x'), w: 9999 }, { ...inline('x'), w: NaN }, { ...inline('x'), d: 1e6 }, { ...inline('x'), tex: 'x'.repeat(1001) },
    { ...block('x'), w: 300 }, null, 'x', [], 7,
  ]
  for (const x of bad) assert.deepEqual(parseQuoteShape([x]), { error: 'bad quote math' }, JSON.stringify(x))
  for (const x of ['x', {}, 7, true]) assert.deepEqual(parseQuoteShape(x), { error: 'bad quote math' })
  assert.deepEqual(parseQuoteShape(Array.from({ length: 21 }, () => inline('x'))), { error: 'bad quote math' })
  assert.deepEqual(parseQuoteShape(Array.from({ length: 100000 }, () => 0)), { error: 'bad quote math' })
})

test('parseRequest carries quoteMath only when sent, and stays free of other keys', () => {
  assert.deepEqual(Object.keys(parseRequest({ message_id: 1, body: 'hi' })).sort(), ['body', 'id'])
  const r = parseRequest({ message_id: 1, body: 'hi', quote_math: [inline('x')] })
  assert.deepEqual(r.quoteMath, [{ display: false, tex: 'x', path: P1, w: 20, h: 16, d: 2 }])
  assert.deepEqual(parseRequest({ message_id: 1, body: 'hi', quote_math: 'x' }), { error: 'bad quote math' })
})

test('only entries the stored message really uses survive; the request cannot choose the excerpt', () => {
  const r = resolveQuoteMath(parseQuoteShape([inline('x'), inline('y', P2), inline('x')]).quoteMath, 'visitor $x$ only', 'reply')
  assert.equal(r.quoteMath.length, 1)
  assert.equal(r.quoteMath[0].tex, 'x')
  assert.deepEqual(resolveQuoteMath([inline('x')], 'nothing here', 'reply').quoteMath, [])
  // a formula past the cut is not in the excerpt, so its picture is dropped
  assert.deepEqual(resolveQuoteMath([inline('late')], `${'a'.repeat(700)} $late$`, 'r').quoteMath, [])
})

test('reply plus quote are capped at 20 distinct formulas', () => {
  const reply = Array.from({ length: 15 }, (_, i) => `$r${i}$`).join(' ')
  const visitor = Array.from({ length: 6 }, (_, i) => `$q${i}$`).join(' ')
  assert.deepEqual(resolveQuoteMath([], visitor, reply), { error: 'too many formulas' })
  assert.ok(!('error' in resolveQuoteMath([], 'a $q0$ $r0$', reply)))
})

test('the quote shows formula images with escaped alt text and the signed link', () => {
  const html = mail('see $x^2$\n\n$$\n\\sum_i a_i\n$$', [inline('x^2'), block('\\sum_i a_i')]).html
  assert.ok(html.includes(`src="${signed(P1)}"`))
  assert.ok(html.includes(`src="${signed(P2)}"`))
  assert.ok(html.includes('alt="$x^2$"'))
})

test('without a picture a quoted formula falls back to its escaped source', () => {
  const html = mail('see $\\left( x$ ok', []).html
  assert.ok(html.includes('$\\left( x$'))
  assert.equal(pictures(html), 0)
})

test('hostile visitor LaTeX never becomes a live tag or attribute', () => {
  const tex = '"><script>alert(1)</script><img src=x onerror=alert(1)>'
  const body = `a $${tex}$ b\n\n$$\n${tex}\n$$\n[x](javascript:alert(1))`
  for (const q of [[], [inline(tex), block(tex)]]) {
    const html = mail(body, q).html
    assert.ok(!/<script/i.test(html))
    assert.ok(!liveTags(html).some((t) => /onerror|<script|src=x/i.test(t)))
    assert.ok(!/href="javascript:/i.test(html))
    assert.ok(html.includes('&lt;script&gt;'))
  }
})

test('hostile picture paths from the request cannot reach the mail: only signed own-origin links are used', () => {
  const html = mail('$x$', [{ ...inline('x'), path: 'https://evil.example/a.png' }]).html
  assert.ok(!html.includes('evil.example'))
  assert.equal(pictures(html), 0)
})

test('a visitor with a thousand formulas cannot overload the mail', () => {
  const body = Array.from({ length: 1000 }, (_, i) => `$a${i}$`).join(' ')
  assert.equal(quoteFormulas(body).length, QUOTE_MAX_FORMULAS)
  assert.ok(quoteExcerpt(body).length <= QUOTE_MAX + 1)
})

test('the plain-text alternative keeps the LaTeX of quoted formulas', () => {
  const t = mail('see $x^2$\n\n$$\n\\sum_i a_i\n$$', [inline('x^2'), block('\\sum_i a_i')]).text
  assert.ok(t.includes('> see $x^2$'))
  assert.ok(t.includes('> $$'))
  assert.ok(t.includes('> \\sum_i a_i'))
})

test('Bcc: present only for a valid NOTIFY_EMAIL, never from anything else', () => {
  assert.equal(notifyEmail(undefined), null)
  assert.equal(notifyEmail(''), null)
  assert.equal(notifyEmail('not-an-address'), null)
  assert.equal(mail('hi', []).bcc, undefined)
  const addr = notifyEmail(' Owner@Example.com ')
  assert.equal(addr, 'owner@example.com')
  const m = mail('hi', [], { bcc: addr })
  assert.deepEqual(m.bcc, ['owner@example.com'])
  assert.deepEqual(m.to, ['a@b.co'])
  assert.ok(!m.html.includes('owner@example.com') && !m.text.includes('owner@example.com'))
})

test('Bcc: header-injection and non-ASCII values are rejected', () => {
  for (const v of ['a@b.co\r\nBcc: evil@x.co', 'a@b.co\nX: y', 'a@b.co,evil@x.co', 'a@b.co evil@x.co', '<a@b.co>', '"a"@b.co', 'a@b.co;evil@x.co', 'ａ@b.co', 'a@b.co\u0000', 'a@b.c​o'])
    assert.equal(notifyEmail(v), null, JSON.stringify(v))
})
