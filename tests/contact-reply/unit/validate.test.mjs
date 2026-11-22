import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseRequest, storedEmail, cleanBody, oneLine, MAX_BODY } from '../../../supabase/functions/contact-reply/validate.mjs'

test('accepts exactly message_id and body', () => {
  assert.deepEqual(parseRequest({ message_id: 7, body: '  hi  ' }), { id: 7, body: 'hi' })
})

test('ignores recipient-like extras: only id and body come out', () => {
  const r = parseRequest({ message_id: 7, body: 'hi', to: 'evil@x.co', from: 'a@b.co', subject: 's', cc: 'c@d.co' })
  assert.deepEqual(Object.keys(r).sort(), ['body', 'id'])
})

for (const [name, input] of [
  ['null', null], ['array', []], ['string id', { message_id: '7', body: 'x' }], ['float id', { message_id: 1.5, body: 'x' }],
  ['zero id', { message_id: 0, body: 'x' }], ['huge id', { message_id: 2 ** 60, body: 'x' }], ['no body', { message_id: 1 }],
  ['object body', { message_id: 1, body: { a: 1 } }], ['whitespace body', { message_id: 1, body: ' \n\t ' }],
  ['invisible-only body', { message_id: 1, body: '​‮\u0000' }],
]) test(`rejects ${name}`, () => assert.ok('error' in parseRequest(input)))

test('body limit is 5000 characters', () => {
  assert.equal(parseRequest({ message_id: 1, body: 'a'.repeat(MAX_BODY) }).body.length, MAX_BODY)
  assert.ok('error' in parseRequest({ message_id: 1, body: 'a'.repeat(MAX_BODY + 1) }))
})

test('invisible and bidi characters are stripped, ZWJ and newlines kept', () => {
  assert.equal(cleanBody('a​‮b\u0000c\u{1F468}‍\u{1F469}\r\nd'), 'abc\u{1F468}‍\u{1F469}\nd')
})

test('header values lose CR and LF', () => {
  assert.equal(oneLine('Re: x\r\nBcc: evil@x.co'), 'Re: x Bcc: evil@x.co')
  assert.doesNotMatch(oneLine('a\r\nb\u2028c'), /[\r\n\u2028]/)
})

test('stored recipient must pass the strict address check', () => {
  assert.equal(storedEmail(' Visitor@Example.com '), 'visitor@example.com')
  for (const bad of ['a@b.co\r\nBcc: x@y.z', 'a@b.co?cc=x', 'a@b@c.co', 'a b@c.co', '', null, 'x@y', `${'a'.repeat(200)}@b.co`, 'a@b.co,c@d.co'])
    assert.equal(storedEmail(bad), null, String(bad))
})
