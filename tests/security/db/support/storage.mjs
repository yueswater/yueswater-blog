// Storage calls against the private contact-images bucket: anon uploads as a visitor would make them,
// and service-role cleanup / signing on the local stack.
import { randomUUID } from 'node:crypto';
import { assertLocal } from './target.mjs';

const BUCKET = 'contact-images';
export const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
export const uuidName = (ext = 'png') => `${randomUUID()}.${ext}`;
export const png = (size = 64) => { const b = Buffer.alloc(size); PNG_SIG.copy(b); return b; };

async function req(t, method, p, { key, body, type, headers = {} } = {}) {
  assertLocal(t.url);
  const k = key || t.anon;
  const res = await fetch(`${t.url}/storage/v1/${p}`, {
    method,
    headers: { apikey: k, Authorization: `Bearer ${k}`, ...(type ? { 'Content-Type': type } : {}), ...headers },
    body,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, headers: res.headers };
}

export const upload = (t, name, bytes, type = 'image/png', opts = {}) =>
  req(t, 'POST', `object/${BUCKET}/${name}`, { body: bytes, type, headers: { 'x-upsert': opts.upsert ? 'true' : 'false' }, key: opts.key });

export const list = (t, key) => req(t, 'POST', `object/list/${BUCKET}`, { key, type: 'application/json', body: JSON.stringify({ prefix: '', limit: 100 }) });
export const download = (t, name, key) => req(t, 'GET', `object/${BUCKET}/${name}`, { key });
export const remove = (t, name, key) => req(t, 'DELETE', `object/${BUCKET}/${name}`, { key });

export async function sign(t, name, expiresIn) {
  const r = await req(t, 'POST', `object/sign/${BUCKET}/${name}`, { key: t.service, type: 'application/json', body: JSON.stringify({ expiresIn }) });
  return `${t.url}/storage/v1${r.data.signedURL}`;
}

export const cleanup = (t, names) => req(t, 'DELETE', `object/${BUCKET}`, { key: t.service, type: 'application/json', body: JSON.stringify({ prefixes: names }) });
