import { test } from 'node:test'
import assert from 'node:assert/strict'
import { layout, SITE_URL } from '../../../supabase/functions/contact-reply/template.mjs'
import { formatTime } from '../../../supabase/functions/contact-reply/date.mjs'
import { compose } from '../../../supabase/functions/contact-reply/compose.mjs'

test('quote date is Taipei time in a readable format, never ISO', () => {
  assert.equal(formatTime('2026-11-22T02:48:44.05673+00:00', 'zh-TW'), '2026 年 11 月 22 日（週日）10:48（台北時間）')
  assert.equal(formatTime('2026-11-22T02:48:44.05673+00:00', 'en'), 'Sun, Nov 22, 2026 10:48 (Taipei, UTC+8)')
  assert.equal(formatTime('2026-11-22T20:00:00Z', 'zh-TW').includes('11 月 23 日'), true)
  assert.equal(formatTime('not a date', 'en'), '')
})

test('layout: light colour scheme, table based, 600px, mobile rule, brand colour, footer link', () => {
  const h = layout({ lang: 'zh-TW', siteName: 'S<n>', subject: 'Re: x', bodyHtml: '<p>B</p>', quoteHead: 'Q<h>', quoteHtml: '<p>Q</p>' })
  assert.match(h, /<meta name="color-scheme" content="light only">/)
  assert.match(h, /max-width:600px/)
  assert.match(h, /@media only screen and \(max-width:620px\)/)
  assert.match(h, /<table role="presentation"/)
  assert.match(h, /#1747e6/)
  assert.match(h, new RegExp(`href="${SITE_URL}"`))
  assert.match(h, /S&lt;n&gt;/)
  assert.match(h, /Q&lt;h&gt;/)
  assert.doesNotMatch(h, /<script/)
})

test('composed mail: sent time is readable, body and quote are rendered, text part exists', () => {
  const m = compose({
    to: 'v@example.com', messageId: 1, fromName: 'Yue Water',
    msg: { ts: '2026-11-22T02:48:44.05673+00:00', topic: 'post', lang: 'zh-TW', body: '**原文**\n\n```py\nx=1\n```' },
    body: '回覆 **粗體**\n\n```js\nlet a\n```',
  })
  assert.match(m.html, /你在 2026 年 11 月 22 日（週日）10:48（台北時間） 寫道：|你在 2026 年 11 月 22 日（週日）10:48（台北時間）\s*寫道：/)
  assert.doesNotMatch(m.html + m.text, /2026-11-22T|\*\*|```/)
  assert.match(m.html, /<strong>粗體<\/strong>/)
  assert.match(m.html, /<pre[^>]*>let a<\/pre>/)
  assert.match(m.html, /Yue Water/)
  assert.match(m.text, /^回覆 粗體/)
  assert.match(m.text, /> 原文/)
  assert.equal(typeof m.text, 'string')
})
