import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderMarkdown, markdownToText } from '../../../supabase/functions/contact-reply/markdown.mjs'

const ctx = { imageUrl: () => null, imageLabel: '[img]' }
const md = (s) => renderMarkdown(s, ctx)

test('headings 1 to 3 render as h tags with inline rules, deeper levels stay text', () => {
  const h = md('## Title **b**\n\n### Sub\n\n#### four')
  assert.match(h, /<h2 [^>]*>Title <strong>b<\/strong><\/h2>/)
  assert.match(h, /<h3 [^>]*>Sub<\/h3>/)
  assert.doesNotMatch(h, /<h4/)
  assert.match(h, /<p [^>]*>#### four<\/p>/)
})

test('strikethrough, horizontal rule, blockquote, lists in a quote', () => {
  assert.match(md('a ~~gone~~ b'), /<s>gone<\/s>/)
  assert.match(md('one\n\n---\n\ntwo'), /<hr /)
  assert.match(md('* * *'), /<hr /)
  const q = md('> quoted **x**\n> - item\n\nafter')
  assert.match(q, /<blockquote [^>]*><p [^>]*>quoted <strong>x<\/strong><\/p><ul /)
  assert.match(q, /<\/blockquote><p [^>]*>after<\/p>/)
})

test('hostile input stays escaped inside every new block', () => {
  const x = '<img src=x onerror=alert(1)>'
  for (const src of [`## ${x}`, `> ${x}`, `~~${x}~~`, `> ## ${x}`, `### [a](javascript:alert(1)) ${x}`]) {
    const h = md(src)
    assert.doesNotMatch(h, /<img|<script|javascript:|onerror=\w*[^&]*>/, src)
    assert.match(h, /&lt;img/, src)
  }
  assert.doesNotMatch(md('> [x](javascript:alert(1))'), /href/)
})

test('deeply nested quotes terminate and cap the nesting', () => {
  const h = md('>'.repeat(200) + ' deep')
  assert.ok((h.match(/<blockquote/g) || []).length <= 3)
  assert.match(h, /deep/)
  assert.equal(md('>>>>\n>>>>\n#\n##\n>').length > 0, true)
})

test('plain text part drops heading hashes and strike marks', () => {
  assert.equal(markdownToText('## T\n\n~~old~~ new', '[i]'), 'T\n\nold new')
})
