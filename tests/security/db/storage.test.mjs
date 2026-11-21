// The private contact-images bucket: what a visitor may upload, and that they can never list, read,
// overwrite or delete. Uploaded objects are removed again with the service key.
import { describe, test, after } from 'node:test';
import assert from 'node:assert/strict';
import { target } from './support/target.mjs';
import { upload, list, download, remove, sign, cleanup, uuidName, png, PNG_SIG } from './support/storage.mjs';

const t = await target();
const made = [];
const put = async (name, bytes, type, opts) => { made.push(name); return upload(t, name, bytes, type, opts); };
const ok = (r) => r.status === 200;

// [id, title, name, bytes, type, accepted]
const CASES = [
  ['UP-001', 'HTML labelled image/png (accepted, served as image only)', () => uuidName(), Buffer.from('<html><script>alert(1)</script>'), 'image/png', true],
  ['UP-002', 'SVG', () => uuidName(), Buffer.from('<svg onload=alert(1)/>'), 'image/svg+xml', false],
  ['UP-003', 'PNG signature + HTML polyglot', () => uuidName(), Buffer.concat([PNG_SIG, Buffer.from('<script>alert(1)</script>')]), 'image/png', true],
  ['UP-004', 'GIF', () => uuidName(), Buffer.from('GIF89a'), 'image/gif', false],
  ['UP-005', 'WebP', () => uuidName(), Buffer.from('RIFF0000WEBP'), 'image/webp', false],
  ['UP-006', 'over 5 MB', () => uuidName(), png(5 * 1024 * 1024 + 1), 'image/png', false],
  ['UP-007', 'exactly 5 MB', () => uuidName(), png(5 * 1024 * 1024), 'image/png', true],
  ['UP-010', 'path traversal name', () => `..%2F${uuidName()}`, png(), 'image/png', false],
  ['UP-011', 'upper-case extension', () => uuidName('PNG'), png(), 'image/png', false],
  ['UP-012', 'double extension', () => `${uuidName('png')}.html`, png(), 'image/png', false],
  ['UP-013', 'non-uuid name', () => 'avatar.png', png(), 'image/png', false],
];

describe('storage bucket', { skip: t.skip }, () => {
  after(() => made.length && cleanup(t, made));

  for (const [id, title, name, bytes, type, accepted] of CASES) {
    test(`TC-SEC-${id} ${title}`, async () => {
      const r = await put(name(), bytes, type);
      assert.equal(ok(r), accepted, `status ${r.status} ${JSON.stringify(r.data).slice(0, 120)}`);
    });
  }

  test('TC-SEC-UP-008 a zero-byte PNG is harmless either way', async () => {
    const r = await put(uuidName(), Buffer.alloc(0), 'image/png');
    assert.ok(r.status < 500, `status ${r.status}`);
  });

  test('TC-SEC-UP-014 a visitor cannot overwrite an existing object', async () => {
    const name = uuidName();
    assert.ok(ok(await put(name, png(), 'image/png')));
    const r = await upload(t, name, png(128), 'image/png', { upsert: true });
    assert.ok(!ok(r), `overwrite returned ${r.status}`);
  });

  test('TC-SEC-PERM-009 a visitor cannot list the bucket', async () => {
    await put(uuidName(), png(), 'image/png');
    const r = await list(t);
    assert.ok(r.status >= 400 || (Array.isArray(r.data) && r.data.length === 0), JSON.stringify(r.data).slice(0, 120));
  });

  test('TC-SEC-PERM-010 a visitor cannot download a known object', async () => {
    const name = uuidName();
    await put(name, png(), 'image/png');
    assert.ok((await download(t, name)).status >= 400);
  });

  test('TC-SEC-PERM-011 a visitor cannot delete an object', async () => {
    const name = uuidName();
    await put(name, png(), 'image/png');
    await remove(t, name);
    assert.ok(ok(await download(t, name, t.service)), 'object disappeared after an anon delete');
  });

  test('TC-SEC-PERM-012 a signed URL stops working after it expires', async () => {
    const name = uuidName();
    await put(name, png(), 'image/png');
    const url = await sign(t, name, 1);
    await new Promise((r) => setTimeout(r, 2500));
    assert.ok((await fetch(url)).status >= 400);
  });

  test('TC-SEC-UP-001 (served) an HTML-labelled-as-PNG object is served as image/png', async () => {
    const name = uuidName();
    await put(name, Buffer.from('<html><script>alert(1)</script>'), 'image/png');
    const res = await fetch(await sign(t, name, 60));
    assert.match(res.headers.get('content-type') || '', /^image\/png/);
  });
});
