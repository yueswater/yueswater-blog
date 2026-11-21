// Field rules (fields.js check): the same rules the server enforces for name, email and body.
import test from 'node:test';
import assert from 'node:assert/strict';
import { check } from '../../../themes/Chic/source/js/widgets/contact/fields.js';

test('empty and whitespace are required', () => {
  for (const f of ['name', 'email', 'topic', 'body']) {
    assert.equal(check(f, ''), 'required');
    assert.equal(check(f, '   '), 'required');
  }
});

test('email format', () => {
  for (const bad of ['plain', 'a@b', 'a b@c.d', '@c.d', 'a@.']) assert.equal(check('email', bad), 'email', bad);
  for (const ok of ['a@b.co', 'x.y+z@sub.example.com', ' a@b.co ']) assert.equal(check('email', ok), '', ok);
});

test('body length: 10 characters minimum after trimming', () => {
  assert.equal(check('body', '123456789'), 'short');
  assert.equal(check('body', '  123456789  '), 'short');
  assert.equal(check('body', '1234567890'), '');
});

test('body length: 2000 characters maximum', () => {
  assert.equal(check('body', 'x'.repeat(2000)), '');
  assert.equal(check('body', 'x'.repeat(2001)), 'long');
});

test('name and topic only need a value', () => {
  assert.equal(check('name', 'A'), '');
  assert.equal(check('topic', 'collab'), '');
});
