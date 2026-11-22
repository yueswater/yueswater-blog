import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderMarkdown, markdownToText } from '../../../supabase/functions/contact-reply/markdown.mjs'
import { imageResolver, imageNames } from '../../../supabase/functions/contact-reply/images.mjs'

const ORIGIN = 'https://abc.supabase.co'
const ctx = (images = {}) => ({ imageUrl: imageResolver({ origin: ORIGIN, images }), imageLabel: '[img]' })
const md = (s, images) => renderMarkdown(s, ctx(images))

test('paragraphs, bold, italic, inline code', () => {
  const h = md('a **bold** and *it* and `c<d>`\nnext line\n\nsecond')
  assert.match(h, /<strong>bold<\/strong>/)
  assert.match(h, /<em>it<\/em>/)
  assert.match(h, /<code[^>]*>c&lt;d&gt;<\/code>/)
  assert.match(h, /next line/)
  assert.equal((h.match(/<p /g) || []).length, 2)
  assert.doesNotMatch(h, /\*\*/)
})

test('fenced code is escaped and not formatted', () => {
  const h = md('```js\nconst a = **x** <b>\n```\nafter')
  assert.match(h, /<pre[^>]*>const a = \*\*x\*\* &lt;b&gt;<\/pre>/)
  assert.doesNotMatch(h, /```/)
  assert.match(h, /after/)
})

test('an unclosed fence runs to the end without breaking out', () => {
  assert.match(md('```\n<script>x</script>'), /<pre[^>]*>&lt;script&gt;x&lt;\/script&gt;<\/pre>/)
})

test('lists', () => {
  assert.match(md('- a\n- b'), /<ul[^>]*><li[^>]*>a<\/li><li[^>]*>b<\/li><\/ul>/)
  assert.match(md('1. a\n2. b'), /<ol/)
})

test('links: http(s) only, with rel noopener', () => {
  const h = md('[ok](https://example.com/a?b=1&c=2) [bad](javascript:alert(1)) [d](data:text/html,x) [m](mailto:a@b.co)')
  assert.match(h, /<a href="https:\/\/example.com\/a\?b=1&amp;c=2" rel="noopener noreferrer"/)
  assert.equal((h.match(/<a /g) || []).length, 1)
  assert.doesNotMatch(h, /javascript:|data:text|mailto:/)
})

test('hostile input never produces a live tag or attribute', () => {
  const evil = [
    '<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '[x](https://a.com" onclick="alert(1))',
    '[x](https://a.com/&quot;onmouseover=alert(1))', '![a" onerror="alert(1)](https://abc.supabase.co/storage/v1/object/p/a.png)',
    '[<img src=x onerror=1>](https://a.com)', '`</code><script>`', '**<svg onload=1>**', 'JaVaScRiPt:alert(1)', '[x]( javascript:alert(1))',
    '[x](https://a.com/\u0000javascript:1)',
  ].join('\n\n')
  const h = md(evil)
  assert.doesNotMatch(h, /<script|<svg|<img src=x|<img src="x/i)
  // parse every tag with quoted attribute values: only whitelisted attribute names may exist
  for (const m of h.matchAll(/<([a-z0-9]+)((?:\s+[a-z-]+="[^"<>]*")*)\s*>/gi)) {
    for (const a of m[2].matchAll(/\s+([a-z-]+)="[^"]*"/gi)) assert.ok(['href', 'rel', 'target', 'style', 'src', 'alt'].includes(a[1]), `attribute ${a[1]} on <${m[1]}>`)
  }
  assert.equal(h.replace(/<\/?(?:p|br|a|strong|em|code|pre|img|ul|ol|li)(?:\s+[a-z-]+="[^"<>]*")*\s*>/gi, '').includes('<'), false)
  const tags = [...h.matchAll(/<\/?([a-z0-9]+)/gi)].map((m) => m[1].toLowerCase())
  assert.deepEqual([...new Set(tags)].filter((t) => !['p', 'br', 'a', 'strong', 'em', 'code', 'pre', 'img', 'ul', 'ol', 'li'].includes(t)), [])
})

test('images: only our storage origin over https, otherwise a placeholder', () => {
  const good = `${ORIGIN}/storage/v1/object/sign/contact-images/a.png?token=t`
  assert.match(md(`![pic](${good})`), /<img src="https:\/\/abc.supabase.co\/storage\/v1\/object\/sign\/contact-images\/a.png\?token=t" alt="pic"/)
  for (const bad of [
    'https://evil.com/a.png', 'http://abc.supabase.co/storage/v1/object/a.png', 'data:image/png;base64,AAAA', 'javascript:alert(1)',
    'https://abc.supabase.co.evil.com/storage/v1/object/a.png', 'https://abc.supabase.co@evil.com/storage/v1/object/a.png', 'https://abc.supabase.co/other/a.png', 'a.png',
  ]) {
    const h = md(`![x](${bad})`)
    assert.doesNotMatch(h, /<img/, bad)
    assert.match(h, /\[img\]/, bad)
  }
})

test('bare stored file names resolve only through the signed-URL map', () => {
  const url = `${ORIGIN}/storage/v1/object/sign/contact-images/u-1.png?token=t`
  assert.match(md('![](u-1.png)', { 'u-1.png': url }), /<img src="https:\/\/abc.supabase.co/)
  assert.doesNotMatch(md('![](u-1.png)', { 'u-1.png': 'https://evil.com/x.png' }), /<img/)
  assert.doesNotMatch(md('![](u-2.png)', { 'u-1.png': url }), /<img/)
  assert.deepEqual(imageNames('![a](u-1.png) ![b](https://x/y.png) ![c](u-1.png)'), ['u-1.png'])
})

test('no configured origin means no images at all', () => {
  const h = renderMarkdown('![x](https://abc.supabase.co/storage/v1/object/a.png)', { imageUrl: imageResolver({}), imageLabel: '[img]' })
  assert.doesNotMatch(h, /<img/)
})

test('plain text version drops the markup', () => {
  const t = markdownToText('**b** *i* `c` [t](https://e.com) ![x](a.png)\n```py\nprint(1)\n```', '[img]')
  assert.equal(t, 'b i c t (https://e.com) [img]\n\nprint(1)')
})
