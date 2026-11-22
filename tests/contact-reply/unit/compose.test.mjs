import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compose, subjectFor, quoted, escapeHtml, FROM, REPLY_TO } from '../../../supabase/functions/contact-reply/compose.mjs'

const msg = (o = {}) => ({ ts: '2026-11-22T01:00:00Z', topic: 'post', body: 'original text', lang: 'zh-TW', ...o })

test('subject follows topic and language', () => {
  assert.equal(subjectFor(msg()), 'Re: 文章問題')
  assert.equal(subjectFor(msg({ topic: 'collab', lang: 'en' })), 'Re: Collaboration')
  assert.equal(subjectFor(msg({ topic: 'x\r\nBcc: e@x.co' })), 'Re: 其他')
})

test('mail goes from the site address to the stored recipient only', () => {
  const m = compose({ to: 'v@example.com', msg: msg(), body: 'hello', messageId: 3 })
  assert.equal(m.from, FROM)
  assert.equal(m.reply_to, REPLY_TO)
  assert.deepEqual(m.to, ['v@example.com'])
  assert.equal(m.headers['X-Entity-Ref-ID'], 'contact-3')
  assert.equal('cc' in m || 'bcc' in m, false)
})

test('no header value contains a line break', () => {
  const m = compose({ to: 'v@example.com', msg: msg({ topic: 'a\r\nBcc: e@x.co' }), body: 'hi', messageId: 1 })
  for (const v of [m.from, m.reply_to, m.subject, ...m.to, ...Object.values(m.headers)]) assert.doesNotMatch(v, /[\r\n]/)
})

test('html escapes the reply and the quoted original', () => {
  const evil = '</script><img src=x onerror=alert(1)> "q" \'s\' &'
  const m = compose({ to: 'v@example.com', msg: msg({ body: evil }), body: evil, messageId: 1 })
  assert.doesNotMatch(m.html, /<script|<img|onerror=alert\(1\)>/)
  assert.match(m.html, /&lt;\/script&gt;/)
  assert.match(m.html, /&quot;q&quot;/)
  assert.equal(escapeHtml('<&>"\''), '&lt;&amp;&gt;&quot;&#39;')
})

test('line breaks become <br> and the text version quotes the original', () => {
  const m = compose({ to: 'v@example.com', msg: msg({ body: 'l1\nl2' }), body: 'a\nb', messageId: 1 })
  assert.match(m.html, /a<br>b/)
  assert.match(m.text, /> l1\n> l2/)
})

test('quoted original is cut and images are flattened', () => {
  const q = quoted(msg({ body: `![x](secret-file.png)\n${'a'.repeat(2000)}` }))
  assert.ok(q.length <= 601)
  assert.ok(q.startsWith('[image]'))
  assert.doesNotMatch(q, /secret-file/)
})

test('english visitors get an english lead-in', () => {
  const m = compose({ to: 'v@example.com', msg: msg({ lang: 'en' }), body: 'hi', messageId: 1 })
  assert.match(m.text, /you wrote:/)
})

import { fromHeader } from '../../../supabase/functions/contact-reply/compose.mjs'
test('sender display name is configurable and cannot alter the address', () => {
  assert.equal(fromHeader('Yue Water'), 'Yue Water <contact@yueswater.com>')
  assert.equal(fromHeader(undefined), '岳氏礦泉水 <contact@yueswater.com>')
  assert.equal(fromHeader('x <evil@x.co>\r\nBcc: a@b.co'), 'x evil@x.co Bcc: a@b.co <contact@yueswater.com>')
})
