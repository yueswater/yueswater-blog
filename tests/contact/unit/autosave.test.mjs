// Draft autosave: writes on the interval only when something changed, clears, survives blocked storage.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = { addEventListener() {}, removeEventListener() {} };
const { createAutosave } = await import('../../../themes/Chic/source/js/widgets/contact/autosave.js');

const memory = () => { const m = new Map(); return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) }; };
const empty = (v) => !Object.values(v).some(Boolean);

function setup(opts = {}) {
  const store = opts.store || memory();
  let values = { name: '', body: '' };
  let saved = 0;
  const a = createAutosave({ key: 'k', read: () => values, isEmpty: empty, onSaved: () => saved++, storage: () => store, ...opts.extra });
  return { a, store, set: (v) => { values = v; }, saved: () => saved };
}

test('writes after the interval, only when changed', (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const s = setup();
  s.a.start();
  s.set({ name: 'A', body: 'hello' });
  t.mock.timers.tick(9999);
  assert.equal(s.store.m.has('k'), false);
  t.mock.timers.tick(1);
  assert.deepEqual(JSON.parse(s.store.m.get('k')), { name: 'A', body: 'hello' });
  assert.equal(s.saved(), 1);
  t.mock.timers.tick(10000);
  assert.equal(s.saved(), 1); // unchanged: no new write
  s.set({ name: 'A', body: 'hello!' });
  t.mock.timers.tick(10000);
  assert.equal(s.saved(), 2);
  s.a.stop();
});

test('load returns the stored draft, ignores junk', () => {
  const s = setup();
  assert.equal(s.a.load(), null);
  s.store.setItem('k', '{"name":"X"}');
  assert.deepEqual(s.a.load(), { name: 'X' });
  s.store.setItem('k', '[1]');
  assert.equal(s.a.load(), null);
  s.store.setItem('k', '{oops');
  assert.equal(s.a.load(), null);
});

test('clear removes the draft; an emptied form removes it too', (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const s = setup();
  s.a.start();
  s.set({ name: 'A', body: '' });
  t.mock.timers.tick(10000);
  assert.equal(s.store.m.has('k'), true);
  s.set({ name: '', body: '' });
  t.mock.timers.tick(10000);
  assert.equal(s.store.m.has('k'), false);
  s.set({ name: 'B', body: '' });
  t.mock.timers.tick(10000);
  s.a.clear();
  assert.equal(s.store.m.has('k'), false);
  s.a.stop();
});

test('blocked or throwing storage never throws', (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const boom = () => { throw new Error('blocked'); };
  const s = setup({ store: { getItem: boom, setItem: boom, removeItem: boom } });
  assert.equal(s.a.load(), null);
  s.a.start();
  s.set({ name: 'A', body: 'x' });
  t.mock.timers.tick(10000);
  s.a.clear();
  assert.equal(s.saved(), 0);
  s.a.stop();
});
