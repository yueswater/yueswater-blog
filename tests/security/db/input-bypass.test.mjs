// Direct calls to submit_contact that skip the page: malformed, oversized and tricky parameters.
// Each case states what the server must answer and whether a row may be stored.
import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';
import { target } from './support/target.mjs';
import { call, payload } from './support/rpc.mjs';
import { messagesFor, clearRate, clearMessagesFor } from './support/admin.mjs';

const t = await target();
const A = (n) => 'A'.repeat(n);

// [id, title, params (merged into a valid payload, or a raw body), expect]
// expect: 'invalid' | 'ok' | 'rejected' (4xx, never 5xx) ; stored: whether a row may exist
const CASES = [
  ['API-001', 'missing required parameters', { raw: '{"p_name":"N"}' }, 'rejected', false],
  ['API-002', 'null parameters', { p_name: null, p_email: null, p_body: null }, 'invalid', false],
  ['API-003', 'numbers instead of text', { p_name: 12345, p_body: 1234567890123 }, 'notServerError', null],
  ['API-004', 'arrays and objects', { p_name: ['a'], p_body: { x: 1 } }, 'notServerError', false],
  ['API-005', 'extra parameter', { p_admin: true }, 'rejected', false],
  ['API-006', 'name of 81 characters', { p_name: A(81) }, 'invalid', false],
  ['API-007', 'email of 201 characters', { p_email: `${A(190)}@example.com` }, 'invalid', false],
  ['API-009', 'body of 2001 characters', { p_body: A(2001) }, 'invalid', false],
  ['API-010', 'body of 1 MB', { p_body: A(1_048_576) }, 'invalidOr413', false],
  ['API-011', 'topic outside the allow-list', { p_topic: 'admin' }, 'invalid', false],
  ['API-012', 'topic in another case', { p_topic: 'Other' }, 'invalid', false],
  ['API-013', 'email with two @', { p_email: 'a@b@c.co' }, 'invalid', false],
  ['API-014', 'email smuggling mailto parameters', { p_email: 'a@b.co?cc=boss&body=hi' }, 'invalid', false],
  ['API-015', 'email with CRLF', { p_email: 'a@b.co\r\nBcc: x@y.z' }, 'invalid', false],
  ['API-017', 'name of only zero-width spaces', { p_name: '​​' }, 'invalid', false],
  ['API-019', 'NUL character in body', { p_body: 'abc\u0000defghij' }, 'rejected', false],
  ['API-020', 'SQL injection string is stored verbatim', { p_body: "x'); drop table contact_messages; --" }, 'ok', true],
  ['API-024', 'honeypot of only spaces counts as empty', { p_trap: '   ' }, 'ok', true],
];

describe('submit_contact input bypass', { skip: t.skip }, () => {
  before(() => clearRate(t));

  for (const [id, title, params, expect, stored] of CASES) {
    test(`TC-SEC-${id} ${title}`, async () => {
      await clearRate(t);
      const body = params.raw ? undefined : payload(params);
      if (body) await clearMessagesFor(t, body.p_email);
      const res = await call(t, 'submit_contact', body, params.raw ? { raw: params.raw } : {});
      assert.ok(res.status < 500, `server error ${res.status}: ${JSON.stringify(res.data).slice(0, 200)}`);
      if (expect === 'invalid') assert.equal(res.data, 'invalid');
      if (expect === 'ok') assert.equal(res.data, 'ok');
      if (expect === 'rejected') assert.ok(res.status >= 400, `expected 4xx, got ${res.status} ${JSON.stringify(res.data)}`);
      if (expect === 'invalidOr413') assert.ok(res.data === 'invalid' || res.status === 413, `got ${res.status}`);
      if (body && stored !== null) assert.equal((await messagesFor(t, body.p_email)).length, stored ? 1 : 0);
    });
  }

  test('TC-SEC-API-008 organisation is cut to 120 characters', async () => {
    await clearRate(t);
    const body = payload({ p_org: A(121) });
    assert.equal((await call(t, 'submit_contact', body)).data, 'ok');
    assert.equal((await messagesFor(t, body.p_email))[0].org.length, 120);
  });

  test('TC-SEC-API-021 unknown p_lang is stored as null', async () => {
    await clearRate(t);
    const body = payload({ p_lang: '<script>' });
    assert.equal((await call(t, 'submit_contact', body)).data, 'ok');
    assert.equal((await messagesFor(t, body.p_email))[0].lang, null);
  });

  test('TC-SEC-API-022 p_path is cut to 200 characters', async () => {
    await clearRate(t);
    const body = payload({ p_path: `javascript:alert(1)${A(500)}` });
    assert.equal((await call(t, 'submit_contact', body)).data, 'ok');
    assert.equal((await messagesFor(t, body.p_email))[0].path.length, 200);
  });

  test('TC-SEC-API-023 honeypot answers ok and stores nothing', async () => {
    await clearRate(t);
    const body = payload({ p_trap: 'http://spam' });
    assert.equal((await call(t, 'submit_contact', body)).data, 'ok');
    assert.equal((await messagesFor(t, body.p_email)).length, 0);
  });

  test('TC-SEC-CFG-007 errors do not leak SQL or table details', async () => {
    const res = await call(t, 'submit_contact', payload({ p_body: 'abc\u0000defghij' }));
    assert.doesNotMatch(JSON.stringify(res.data), /contact_messages|contact_rate|plpgsql|line \d+/i);
  });
});
