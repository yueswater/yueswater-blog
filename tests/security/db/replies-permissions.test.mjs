// Reply threads: only admins read them, nobody writes them from the browser. The Edge Function writes
// with the service role, so anon and ordinary signed-in users must be refused on every path.
import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';
import { target } from './support/target.mjs';
import { call, payload } from './support/rpc.mjs';
import { clearRate, nonAdminToken, messagesFor } from './support/admin.mjs';

const t = await target();

async function rest(path, init = {}, token) {
  const res = await fetch(`${t.url}/rest/v1/${path}`, { ...init, headers: { apikey: t.anon, Authorization: `Bearer ${token || t.anon}`, 'Content-Type': 'application/json', Prefer: 'return=representation' } });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
}
const denied = (r) => r.status >= 400 || (Array.isArray(r.data) && r.data.length === 0);

describe('reply permissions', { skip: t.skip }, () => {
  let id;
  let token;
  before(async () => {
    await clearRate(t);
    const body = payload();
    await call(t, 'submit_contact', body);
    id = (await messagesFor(t, body.p_email))[0].id;
    token = await nonAdminToken(t);
  });

  test('TC-SEC-REPLY-001 anon cannot call contact_replies_list', async () => {
    const r = await call(t, 'contact_replies_list', { p_message_ids: [id] });
    assert.ok(r.status >= 400, `status ${r.status}`);
  });

  test('TC-SEC-REPLY-002 a signed-in non-admin cannot call contact_replies_list', async () => {
    const r = await call(t, 'contact_replies_list', { p_message_ids: [id] }, { token });
    assert.ok(r.status >= 400, `status ${r.status} ${JSON.stringify(r.data)}`);
  });

  test('TC-SEC-REPLY-003 contact_replies cannot be read directly', async () => {
    assert.ok(denied(await rest('contact_replies?select=*')));
    assert.ok(denied(await rest('contact_replies?select=*', {}, token)));
  });

  test('TC-SEC-REPLY-004 contact_replies cannot be written directly', async () => {
    const row = JSON.stringify({ message_id: id, body: 'forged reply' });
    assert.ok((await rest('contact_replies', { method: 'POST', body: row })).status >= 400);
    assert.ok((await rest('contact_replies', { method: 'POST', body: row }, token)).status >= 400);
  });

  test('TC-SEC-REPLY-005 replied_at cannot be set by a visitor or non-admin', async () => {
    const patch = JSON.stringify({ replied_at: new Date().toISOString() });
    for (const tk of [undefined, token]) {
      await rest(`contact_messages?id=eq.${id}`, { method: 'PATCH', body: patch }, tk);
    }
    const rows = await fetch(`${t.url}/rest/v1/contact_messages?id=eq.${id}&select=replied_at`, { headers: { apikey: t.service, Authorization: `Bearer ${t.service}` } }).then((r) => r.json());
    assert.equal(rows[0].replied_at, null);
  });
});
