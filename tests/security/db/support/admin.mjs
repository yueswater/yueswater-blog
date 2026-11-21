// Service-role helpers for setting up and inspecting state on the LOCAL database only: reading what
// a submission stored, clearing the rate-limit table, and moving timestamps to simulate time.
import { assertLocal } from './target.mjs';

async function svc(t, p, init = {}) {
  assertLocal(t.url);
  const res = await fetch(`${t.url}/rest/v1/${p}`, {
    ...init,
    headers: { apikey: t.service, Authorization: `Bearer ${t.service}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers || {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`service ${init.method || 'GET'} ${p}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

// drop rows a previous run left behind for this address (fixed test addresses would otherwise pile up)
export const clearMessagesFor = (t, email) => svc(t, `contact_messages?email=eq.${encodeURIComponent(email)}`, { method: 'DELETE' });
export const messagesFor = (t, email) => svc(t, `contact_messages?email=eq.${encodeURIComponent(email)}&select=*`);
export const deleteMessages = (t, email) => svc(t, `contact_messages?email=eq.${encodeURIComponent(email)}`, { method: 'DELETE' });
export const allRate = (t) => svc(t, 'contact_rate?select=*');
export const clearRate = (t) => svc(t, 'contact_rate?ip_hash=not.is.null', { method: 'DELETE' });
export const countMessages = async (t) => (await svc(t, 'contact_messages?select=id')).length;

// pretend the last accepted message was `seconds` ago (lifts the 60-second gap)
export const rewindLast = (t, seconds) => svc(t, 'contact_rate?ip_hash=not.is.null', {
  method: 'PATCH', body: JSON.stringify({ last_at: new Date(Date.now() - seconds * 1000).toISOString() }),
});

// move this hour's counter row `hours` back, so the hourly cap resets while the daily sum keeps it
export function moveCurrentBucket(t, hours) {
  const now = new Date(); now.setUTCMinutes(0, 0, 0);
  const back = new Date(now.getTime() - hours * 3600_000);
  return svc(t, `contact_rate?bucket=eq.${encodeURIComponent(now.toISOString())}`, { method: 'PATCH', body: JSON.stringify({ bucket: back.toISOString() }) });
}

export const ageMessage = (t, id, days) => svc(t, `contact_messages?id=eq.${id}`, {
  method: 'PATCH', body: JSON.stringify({ ts: new Date(Date.now() - days * 86400_000).toISOString() }),
});

// a confirmed, non-admin user and its access token (local auth only)
export async function nonAdminToken(t) {
  assertLocal(t.url);
  const email = `user-${Date.now()}@example.com`;
  const password = `pw-${Math.random().toString(36).slice(2)}-local`;
  const h = { apikey: t.service, Authorization: `Bearer ${t.service}`, 'Content-Type': 'application/json' };
  await fetch(`${t.url}/auth/v1/admin/users`, { method: 'POST', headers: h, body: JSON.stringify({ email, password, email_confirm: true }) });
  const res = await fetch(`${t.url}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: t.anon, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  return (await res.json()).access_token;
}

export { svc };
