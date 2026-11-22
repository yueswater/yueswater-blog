import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parsePayload } from '../../../supabase/functions/contact-notify/payload.mjs'
import { composeNotice, subjectFor } from '../../../supabase/functions/contact-notify/mail.mjs'

const msgOf = (o = {}) => parsePayload({ id: 3, ts: '2026-11-22T01:00:00Z', name: 'Ann', email: 'ann@example.com', org: 'Acme', topic: 'collab', body: 'hi **there**', lang: 'zh-TW', path: '/contact/', ...o }).msg
const OWNER = 'owner@example.org'

test('subject, recipient and sender', () => {
  const m = composeNotice({ to: OWNER, msg: msgOf() })
  assert.equal(m.subject, '新留言：合作邀約 - Ann')
  assert.deepEqual(m.to, [OWNER])
  assert.match(m.from, /<contact@yueswater\.com>$/)
  assert.equal(m.reply_to, 'ann@example.com')
  assert.match(m.html, /https:\/\/www\.yueswater\.com\/admin\//)
  assert.match(m.html, /Asia|台北時間/)
  assert.match(m.text, /台北時間/)
  assert.doesNotMatch(m.html + m.text, /\bip\b/i)
})

test('no owner address means no mail', () => {
  assert.equal(composeNotice({ to: undefined, msg: msgOf() }), null)
  assert.equal(composeNotice({ to: 'bad@x', msg: msgOf() }), null)
  assert.equal(composeNotice({ to: 'a@x.co\r\nBcc: z@y.co', msg: msgOf() }), null)
})

test('hostile name and body are escaped, headers stay one line', () => {
  const m = composeNotice({ to: OWNER, msg: msgOf({ name: '<script>alert(1)</script>\r\nBcc: x@y.co', body: '<script>alert(1)</script><img src=x onerror=alert(1)>\n[a](javascript:alert(1))', org: '"><b>x' }) })
  assert.doesNotMatch(m.html, /<script|<img src=x|href="javascript/i)
  assert.doesNotMatch(m.subject, /[\r\n]/)
  assert.match(m.html, /&lt;script&gt;/)
  assert.doesNotMatch(m.html, /<b>x/)
})

test('invalid visitor email: shown escaped, no reply-to', () => {
  const m = composeNotice({ to: OWNER, msg: msgOf({ email: '<i>x@y' }) })
  assert.equal('reply_to' in m, false)
  assert.doesNotMatch(m.html, /<i>x@y/)
})

test('images and formulas become plain placeholders, no resolved URLs', () => {
  const m = composeNotice({ to: OWNER, msg: msgOf({ body: '![x](https://evil.example/a.png) and $E=mc^2$\n\n$$\\int_0^1 x\\,dx$$' }) })
  assert.match(m.html, /\[圖片\]/)
  assert.doesNotMatch(m.html, /<img|evil\.example/)
  assert.match(m.html, /E=mc\^2/)
  assert.match(m.text, /\[圖片\]/)
  assert.match(m.text, /E=mc\^2/)
})

test('subject is truncated and huge body does not blow up the mail', () => {
  assert.ok(subjectFor(msgOf({ name: 'N'.repeat(500) })).length <= 100)
  const m = composeNotice({ to: OWNER, msg: msgOf({ body: 'x'.repeat(200000) }) })
  assert.ok(m.html.length < 40000)
  assert.match(m.html, /已截斷/)
})

test('bidi override in the body is stripped from html and text', () => {
  const m = composeNotice({ to: OWNER, msg: msgOf({ body: 'abc‮def⁦ghi' }) })
  assert.doesNotMatch(m.html + m.text, /[‮⁦]/)
})

test('light-only, 600px and table based', () => {
  const { html } = composeNotice({ to: OWNER, msg: msgOf() })
  assert.match(html, /color-scheme" content="light only"/)
  assert.match(html, /max-width:600px/)
  assert.doesNotMatch(html, /prefers-color-scheme: ?dark/)
})
