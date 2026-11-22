// The new-message email trigger: it exists, it never breaks submit_contact, and visitors cannot reach its secrets.
// Local Supabase only; skipped when it is down. The SQL parts run in one transaction that is rolled back.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { target } from './support/target.mjs';
import { call } from './support/rpc.mjs';
import { dbUrl, psql } from './support/psql.mjs';

const t = await target();
const url = t.skip ? '' : dbUrl();
const skip = t.skip || (url ? false : 'no local DB_URL (supabase status)');

describe('contact notify trigger', { skip }, () => {
  test('TC-SEC-NOTIFY-001 trigger exists on contact_messages', () => {
    const out = psql(url, "select count(*) from pg_trigger where tgname = 'contact_messages_notify' and tgrelid = 'public.contact_messages'::regclass and not tgisinternal");
    assert.equal(out, '1');
  });

  test('TC-SEC-NOTIFY-002 submit_contact succeeds when the target is unreachable', () => {
    const out = psql(url, `begin;
      delete from vault.secrets where name in ('notify_function_url', 'notify_webhook_secret');
      select vault.create_secret('http://127.0.0.1:9/unreachable', 'notify_function_url');
      select vault.create_secret('test-only-not-a-real-secret', 'notify_webhook_secret');
      delete from public.contact_rate;
      select public.submit_contact('Notify Test', 'notify-test@example.com', '', 'other', 'notify trigger test body', 'zh-TW', '/contact/', '');
      rollback;`);
    assert.match(out, /(^|\n)ok$/m);
  });

  test('TC-SEC-NOTIFY-003 submit_contact succeeds when the secrets are not set', () => {
    const out = psql(url, `begin;
      delete from vault.secrets where name in ('notify_function_url', 'notify_webhook_secret');
      delete from public.contact_rate;
      select public.submit_contact('Notify Test', 'notify-test@example.com', '', 'other', 'notify trigger test body', 'zh-TW', '/contact/', '');
      rollback;`);
    assert.match(out, /(^|\n)ok$/m);
  });

  test('TC-SEC-NOTIFY-004 anon cannot call the trigger function', async () => {
    const r = await call(t, 'notify_contact_message', {});
    assert.ok(r.status >= 400);
  });

  test('TC-SEC-NOTIFY-005 anon cannot read the vault', async () => {
    for (const h of ['vault', 'public']) {
      const res = await fetch(`${t.url}/rest/v1/decrypted_secrets?select=*`, { headers: { apikey: t.anon, Authorization: `Bearer ${t.anon}`, 'Accept-Profile': h } });
      const text = await res.text();
      assert.ok(res.status >= 400, `profile ${h}: ${res.status}`);
      assert.doesNotMatch(text, /test-only-not-a-real-secret/);
    }
  });
});
