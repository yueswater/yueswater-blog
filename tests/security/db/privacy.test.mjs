// The sender IP column: stored with each message, and cleared after 180 days by the occasional
// cleanup that runs inside submit_contact (about 1 in 20 calls).
import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { target } from './support/target.mjs';
import { call, payload, submit } from './support/rpc.mjs';
import { clearRate, messagesFor, ageMessage } from './support/admin.mjs';

const t = await target();

describe('sender IP', { skip: t.skip }, () => {
  beforeEach(() => clearRate(t));

  test('TC-SEC-ADM-001 (db) each message stores a sender IP', async () => {
    const body = payload();
    assert.equal((await call(t, 'submit_contact', body)).data, 'ok');
    const [row] = await messagesFor(t, body.p_email);
    assert.ok(row.ip, 'ip column is empty');
  });

  test('TC-SEC-ADM-002 the IP is cleared after 180 days, the message kept', async () => {
    const oldMsg = payload();
    const recent = payload();
    await call(t, 'submit_contact', oldMsg);
    await clearRate(t);
    await call(t, 'submit_contact', recent);
    const [o] = await messagesFor(t, oldMsg.p_email);
    const [r] = await messagesFor(t, recent.p_email);
    await ageMessage(t, o.id, 181);
    await ageMessage(t, r.id, 170);
    // the cleanup is probabilistic (5%); 200 tries miss it with odds of about 1 in 30000
    for (let i = 0; i < 200; i++) {
      await clearRate(t);
      await submit(t);
      if (!(await messagesFor(t, oldMsg.p_email))[0].ip) break;
    }
    const [o2] = await messagesFor(t, oldMsg.p_email);
    const [r2] = await messagesFor(t, recent.p_email);
    assert.equal(o2.ip, null, '181-day-old message still has its IP');
    assert.equal(o2.body, oldMsg.p_body);
    assert.ok(r2.ip, 'a 170-day-old message lost its IP too early');
  });
});
