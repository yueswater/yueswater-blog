// Formula PNGs in the mail: request checks (hostile input included), the <img> tags and the limits.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseRequest } from '../../../supabase/functions/contact-reply/validate.mjs'
import { parseMath } from '../../../supabase/functions/contact-reply/mathInput.mjs'
import { compose } from '../../../supabase/functions/contact-reply/compose.mjs'
import { mathPaths } from '../../../supabase/functions/contact-reply/mathRender.mjs'

const ORIGIN = 'https://abc.supabase.co'
const P1 = '11111111-2222-3333-4444-555555555555.png'
const P2 = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.png'
const signed = (p) => `${ORIGIN}/storage/v1/object/sign/contact-images/${p}?token=t`
const inline = { display: false, tex: 'x^2', path: P1, w: 24.4, h: 18.6, d: 3.7 }
const block = { display: true, tex: '\\sum_i a_i', path: P2, w: 560, h: 60, d: 0 }
const msg = { id: 1, ts: '2026-01-01T00:00:00Z', topic: 'post', body: 'q $x^2$', lang: 'zh-TW' }
const mail = (body, math, images = { [P1]: signed(P1), [P2]: signed(P2) }) =>
  compose({ to: 'a@b.co', msg, body, messageId: 1, imageOrigin: ORIGIN, images, math })

test('a valid request keeps only the formulas the text uses, sizes rounded', () => {
  const r = parseRequest({ message_id: 1, body: 'a $x^2$', math: [inline, block] })
  assert.deepEqual(r.math, [{ display: false, tex: 'x^2', path: P1, w: 24, h: 19, d: 3.7 }])
})

test('without formulas the request has no math field', () => {
  assert.deepEqual(Object.keys(parseRequest({ message_id: 1, body: 'plain' })).sort(), ['body', 'id'])
})

test('hostile entries are rejected', () => {
  const bad = [
    { ...inline, path: '../secret.png' }, { ...inline, path: 'x.png' }, { ...inline, path: `${P1}?a=1` }, { ...inline, path: 'https://evil.example/a.png' },
    { ...inline, path: P1.replace('.png', '.jpg') }, { ...inline, w: 9999 }, { ...inline, w: -1 }, { ...inline, w: NaN }, { ...inline, w: '24' }, { ...inline, h: 0 },
    { ...inline, d: 1e6 }, { ...inline, display: 'yes' }, { ...inline, tex: 5 }, { ...inline, tex: 'x'.repeat(1001) }, { ...block, w: 300 }, { ...block, h: 5000 },
    null, 'x', [], 7,
  ]
  for (const x of bad) assert.deepEqual(parseMath([x], 'a $x^2$'), { error: 'bad math' }, JSON.stringify(x))
  for (const x of ['x', {}, 7, true]) assert.deepEqual(parseMath(x, 'a $x^2$'), { error: 'bad math' })
})

test('limits are enforced on the server: count, length, entries', () => {
  const many = Array.from({ length: 21 }, (_, i) => `$a${i}$`).join(' ')
  assert.deepEqual(parseMath(undefined, many), { error: 'too many formulas' })
  assert.deepEqual(parseMath(undefined, `$${'x'.repeat(1001)}$`), { error: 'formula too long' })
  assert.deepEqual(parseMath(Array(21).fill(inline), 'a $x^2$'), { error: 'bad math' })
  assert.deepEqual(parseRequest({ message_id: 1, body: many }), { error: 'too many formulas' })
})

test('inline formula becomes a signed PNG on the baseline, with escaped alt text', () => {
  const html = mail('so $x^2$ holds', parseMath([inline], 'so $x^2$ holds').math).html
  assert.match(html, /<img src="https:\/\/abc\.supabase\.co\/storage\/v1\/object\/sign\/contact-images\/11111111[^"]*" alt="\$x\^2\$" width="24" height="19" style="[^"]*vertical-align:-3\.7px/)
})

test('display formula is a centred 560px PNG', () => {
  const body = '$$\n\\sum_i a_i\n$$'
  const html = mail(body, parseMath([block], body).math).html
  assert.match(html, /<div style="margin:0 0 14px;text-align:center"><img src="[^"]*aaaaaaaa[^"]*" alt="\$\$\n\\sum_i a_i\n\$\$" width="560" height="60"/)
})

test('alt text is escaped even for hostile LaTeX', () => {
  const evil = '$a"><script>alert(1)</script>$'
  const html = mail(evil, [{ ...inline, tex: 'a"><script>alert(1)</script>' }]).html
  assert.doesNotMatch(html, /<script>alert/)
  assert.match(html, /alt="\$a&quot;&gt;&lt;script&gt;alert\(1\)&lt;\/script&gt;\$"/)
})

test('only our storage origin is accepted for the picture', () => {
  const body = 'a $x^2$'
  for (const url of ['https://evil.example/storage/v1/object/sign/x.png', 'http://abc.supabase.co/storage/v1/object/x.png', 'javascript:alert(1)', `${ORIGIN}/other/x.png`, '']) {
    const html = mail(body, [inline], { [P1]: url }).html
    assert.doesNotMatch(html, /<img[^>]*alt="\$/, url)
    assert.match(html, /\$x\^2\$/)
  }
})

test('a formula without a stored picture stays as text, and the quoted message never gets pictures', () => {
  const html = mail('no $y$', [inline]).html
  assert.doesNotMatch(html.split('先前').join(''), /alt="\$y\$"/)
  assert.match(html, /no \$y\$/)
  assert.doesNotMatch(html.slice(html.indexOf('你在'), html.indexOf('</table>', html.indexOf('你在'))), /<img/)
})

test('the plain-text part keeps the LaTeX', () => {
  const m = mail('so $x^2$\n\n$$\n\\sum_i a_i\n$$', [inline, block])
  assert.match(m.text, /so \$x\^2\$/)
  assert.match(m.text, /\$\$\n\\sum_i a_i\n\$\$/)
})

test('mathPaths lists each file once', () => {
  assert.deepEqual(mathPaths([inline, inline, block]), [P1, P2])
  assert.deepEqual(mathPaths(undefined), [])
})
