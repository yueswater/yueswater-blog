// Per-visitor limits in submit_contact: 60 s gap, 3 per hour, 5 per day, blocked attempts not
// counted, and whether a client-supplied X-Forwarded-For can dodge or forge them.
import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { target } from './support/target.mjs';
import { submit, payload, call, fakeIp } from './support/rpc.mjs';
import { clearRate, allRate, rewindLast, moveCurrentBucket, messagesFor } from './support/admin.mjs';

const t = await target();
const same = { headers: { 'X-Forwarded-For': '203.0.113.50' } };

describe('rate limits', { skip: t.skip }, () => {
  beforeEach(() => clearRate(t));

  test('TC-SEC-RATE-003 a second message within 60 s is limited', async () => {
    assert.equal((await submit(t, {}, same)).data, 'ok');
    assert.equal((await submit(t, {}, same)).data, 'limited');
  });

  test('TC-SEC-RATE-004 the fourth message in an hour is limited', async () => {
    for (let i = 0; i < 3; i++) { assert.equal((await submit(t, {}, same)).data, 'ok', `message ${i + 1}`); await rewindLast(t, 61); }
    assert.equal((await submit(t, {}, same)).data, 'limited');
  });

  test('TC-SEC-RATE-005 the sixth message in a day is limited', async () => {
    for (let i = 0; i < 5; i++) {
      assert.equal((await submit(t, {}, same)).data, 'ok', `message ${i + 1}`);
      await rewindLast(t, 61);
      await moveCurrentBucket(t, i + 1);
    }
    assert.equal((await submit(t, {}, same)).data, 'limited');
  });

  test('TC-SEC-RATE-006 blocked attempts are not counted', async () => {
    assert.equal((await submit(t, {}, same)).data, 'ok');
    const before = await allRate(t);
    for (let i = 0; i < 10; i++) assert.equal((await submit(t, {}, same)).data, 'limited');
    assert.deepEqual(await allRate(t), before);
  });

  test('TC-SEC-RATE-007 parallel requests cannot all pass the 60 s gap', async () => {
    const results = await Promise.all(Array.from({ length: 10 }, () => submit(t, {}, same)));
    const ok = results.filter((r) => r.data === 'ok').length;
    assert.ok(ok <= 1, `${ok} of 10 parallel messages were accepted (check-then-insert race)`);
  });

  test('TC-SEC-RATE-001 rotating X-Forwarded-For does not reset the limit', async () => {
    const results = [];
    for (let i = 0; i < 5; i++) results.push((await submit(t, {}, { headers: { 'X-Forwarded-For': fakeIp() } })).data);
    assert.ok(results.slice(1).every((r) => r === 'limited'), `spoofed sources got: ${results.join(', ')}`);
  });

  test('TC-SEC-RATE-002 a forged X-Forwarded-For is not stored as the sender IP', async () => {
    const body = payload();
    assert.equal((await call(t, 'submit_contact', body, { headers: { 'X-Forwarded-For': '1.2.3.4' } })).data, 'ok');
    const [row] = await messagesFor(t, body.p_email);
    assert.notEqual(row.ip, '1.2.3.4', 'the client-supplied address was stored as the sender IP');
  });

  test('TC-SEC-RATE-009 without a forwarded header the request still works', async () => {
    const body = payload();
    const res = await call(t, 'submit_contact', body);
    assert.ok(['ok', 'limited'].includes(res.data), JSON.stringify(res.data));
  });

  // distinct visitors are told apart by cf-connecting-ip, which Cloudflare sets in production
  // (locally nothing overwrites it, so it stands in for the edge here)
  test('TC-SEC-RATE-010 distinct sources are limited one by one', async () => {
    for (let s = 0; s < 3; s++) {
      const h = { headers: { 'cf-connecting-ip': `192.0.2.${s + 10}` } };
      assert.equal((await submit(t, {}, h)).data, 'ok');
      assert.equal((await submit(t, {}, h)).data, 'limited');
    }
  });
});
