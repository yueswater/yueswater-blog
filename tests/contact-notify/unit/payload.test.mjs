import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parsePayload, strictEmail, oneLine } from '../../../supabase/functions/contact-notify/payload.mjs'
import { safeEqual } from '../../../supabase/functions/contact-notify/secret.mjs'
import { withinBudget, PER_HOUR } from '../../../supabase/functions/contact-notify/burst.mjs'

const rec = (o = {}) => ({ id: 7, ts: '2026-11-22T01:00:00Z', name: 'Ann', email: 'ann@example.com', org: '', topic: 'post', body: 'hello there world', lang: 'en', path: '/contact/', ...o })

test('accepts webhook and flat shapes', () => {
  assert.equal(parsePayload({ record: rec() }).msg.id, 7)
  assert.equal(parsePayload(rec()).msg.name, 'Ann')
})

test('rejects bad payloads', () => {
  for (const x of [null, [], 'x', {}, { record: rec({ id: 0 }) }, { record: rec({ id: '7' }) }, { record: rec({ body: 5 }) }, { record: rec({ body: '  ' }) }])
    assert.ok('error' in parsePayload(x))
})

test('unknown topic and lang are normalised', () => {
  const { msg } = parsePayload(rec({ topic: 'x', lang: 'fr' }))
  assert.equal(msg.topic, 'other')
  assert.equal(msg.lang, '')
})

test('huge body is cut and flagged', () => {
  const { msg } = parsePayload(rec({ body: 'a'.repeat(100000) }))
  assert.ok(msg.body.length <= 4001)
  assert.equal(msg.truncated, true)
})

test('header injection and bidi characters are removed from one-line fields', () => {
  const { msg } = parsePayload(rec({ name: 'A\r\nBcc: x@y.co‮evil', org: 'o\u2028r' }))
  assert.doesNotMatch(msg.name, /[\r\n‮]/)
  assert.doesNotMatch(msg.org, /[\u2028]/)
  assert.equal(oneLine('a\nb'), 'a b')
})

test('reply-to only for a strict address', () => {
  assert.equal(parsePayload(rec()).msg.replyTo, 'ann@example.com')
  for (const bad of ['a@b.co\r\nBcc: x@y.co', 'a b@x.co', 'a@x.co?cc=z@y.co', 'nope', 'a@b'])
    assert.equal(parsePayload(rec({ email: bad })).msg.replyTo, null, bad)
  assert.equal(strictEmail('A@Example.COM'), 'a@example.com')
})

test('shared secret comparison', () => {
  assert.equal(safeEqual('abc123', 'abc123'), true)
  assert.equal(safeEqual('abc124', 'abc123'), false)
  assert.equal(safeEqual('abc', 'abc123'), false)
  assert.equal(safeEqual('abc123extra', 'abc123'), false)
  assert.equal(safeEqual('', ''), false)
  assert.equal(safeEqual(undefined, 'abc'), false)
  assert.equal(safeEqual('abc', ''), false)
})

test('burst guard', () => {
  assert.equal(PER_HOUR, 30)
  assert.equal(withinBudget(1), true)
  assert.equal(withinBudget(30), true)
  assert.equal(withinBudget(31), false)
  assert.equal(withinBudget(0), false)
  assert.equal(withinBudget(NaN), false)
})
