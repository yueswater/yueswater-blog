// Who can read or change messages: visitors (anon key) and ordinary signed-in users must not, by
// RPC or by querying the tables directly.
import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';
import { target } from './support/target.mjs';
import { call, submit, payload } from './support/rpc.mjs';
import { clearRate, nonAdminToken, messagesFor } from './support/admin.mjs';

const t = await target();

async function rest(path, init = {}, token) {
  const res = await fetch(`${t.url}/rest/v1/${path}`, { ...init, headers: { apikey: t.anon, Authorization: `Bearer ${token || t.anon}`, 'Content-Type': 'application/json', Prefer: 'return=representation' } });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
}

const denied = (r) => r.status >= 400 || (Array.isArray(r.data) && r.data.length === 0);

describe('permissions', { skip: t.skip }, () => {
  let email;
  let token;
  before(async () => {
    await clearRate(t);
    const body = payload();
    email = body.p_email;
    await call(t, 'submit_contact', body);
    token = await nonAdminToken(t);
  });

  test('TC-SEC-PERM-001 anon cannot call contact_list', async () => {
    const r = await call(t, 'contact_list', { p_limit: 10 });
    assert.ok(r.status >= 400, `status ${r.status}`);
  });

  test('TC-SEC-PERM-002 anon cannot call contact_mark', async () => {
    const [row] = await messagesFor(t, email);
    const r = await call(t, 'contact_mark', { p_id: row.id, p_read: true });
    assert.ok(r.status >= 400, `status ${r.status}`);
    assert.equal((await messagesFor(t, email))[0].read_at, null);
  });

  test('TC-SEC-PERM-003 a signed-in non-admin cannot call contact_list', async () => {
    assert.ok(token, 'could not create a local non-admin user');
    const r = await call(t, 'contact_list', { p_limit: 10 }, { token });
    assert.ok(r.status >= 400, `status ${r.status}`);
  });

  for (const [id, table] of [['PERM-004', 'contact_messages'], ['PERM-005', 'contact_rate']]) {
    test(`TC-SEC-${id} anon cannot select ${table}`, async () => {
      assert.ok(denied(await rest(`${table}?select=*`)));
    });
  }

  test('TC-SEC-PERM-006 anon cannot insert into contact_messages', async () => {
    const r = await rest('contact_messages', { method: 'POST', body: JSON.stringify({ name: 'x', email: 'x@y.co', topic: 'other', body: 'direct insert attempt' }) });
    assert.ok(r.status >= 400, `status ${r.status}`);
  });

  test('TC-SEC-PERM-007 anon cannot update or delete messages', async () => {
    const [row] = await messagesFor(t, email);
    await rest(`contact_messages?id=eq.${row.id}`, { method: 'PATCH', body: JSON.stringify({ body: 'tampered' }) });
    await rest(`contact_messages?id=eq.${row.id}`, { method: 'DELETE' });
    const [after] = await messagesFor(t, email);
    assert.equal(after?.body, row.body);
  });

  test('TC-SEC-PERM-008 the removed seven-argument signature is gone', async () => {
    const { p_org, ...old } = payload();
    void p_org;
    const r = await call(t, 'submit_contact', old);
    assert.ok(r.status >= 400, `status ${r.status}`);
  });

  test('TC-SEC-RATE-012 submitting still works after old counter rows exist', async () => {
    await clearRate(t);
    assert.equal((await submit(t)).data, 'ok');
  });
});
