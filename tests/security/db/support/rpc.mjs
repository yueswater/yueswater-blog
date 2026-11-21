// Calls to the public API exactly as an attacker would make them: the anon key, raw JSON, and any
// headers the caller likes (X-Forwarded-For included). Never goes through the site's own code.
import { randomUUID } from 'node:crypto';

async function parse(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

export async function call(t, fn, body, { headers = {}, token, raw } = {}) {
  const res = await fetch(`${t.url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: t.anon, Authorization: `Bearer ${token || t.anon}`, 'Content-Type': 'application/json', ...headers },
    body: raw !== undefined ? raw : JSON.stringify(body),
  });
  return { status: res.status, data: await parse(res) };
}

// a unique, valid submission; overrides replace any parameter
export function payload(overrides = {}) {
  return {
    p_name: 'Security Test', p_email: `sec-${randomUUID().slice(0, 8)}@example.com`, p_org: '', p_topic: 'other',
    p_body: 'security test message body', p_lang: 'zh-TW', p_path: '/contact/', p_trap: '',
    ...overrides,
  };
}

export const submit = (t, overrides = {}, opts = {}) => call(t, 'submit_contact', payload(overrides), opts);

// a fresh documentation-range IP per call, for tests that need distinct (claimed) sources
let n = 0;
export const fakeIp = () => `198.51.100.${(n++ % 250) + 1}`;
