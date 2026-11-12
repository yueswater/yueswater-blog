const test = require('node:test');
const assert = require('node:assert/strict');
const createConsent = require('../themes/Chic/source/js/core/consent.js');

const DAY = 24 * 3600 * 1000;
const fakeStorage = (init = {}) => {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) };
};
const NOW = Date.parse('2026-11-12T00:00:00Z');

test('undecided when nothing is stored', () => {
  assert.equal(createConsent(fakeStorage(), () => NOW).get(), null);
});

test('set(true) is read back', () => {
  const c = createConsent(fakeStorage(), () => NOW);
  c.set(true);
  assert.equal(c.get().analytics, true);
  assert.equal(c.get().v, 1);
});

test('older than 12 months counts as undecided, 364 days still counts', () => {
  const at = (days) => JSON.stringify({ v: 1, analytics: true, at: new Date(NOW - days * DAY).toISOString() });
  assert.equal(createConsent(fakeStorage({ consent: at(366) }), () => NOW).get(), null);
  assert.equal(createConsent(fakeStorage({ consent: at(364) }), () => NOW).get().analytics, true);
});

test('invalid JSON or wrong version is undecided', () => {
  assert.equal(createConsent(fakeStorage({ consent: '{oops' }), () => NOW).get(), null);
  assert.equal(createConsent(fakeStorage({ consent: JSON.stringify({ v: 2, analytics: true, at: new Date(NOW).toISOString() }) }), () => NOW).get(), null);
});

test('blocked storage: get is null, set does not throw and still notifies', () => {
  const boom = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  const c = createConsent(boom, () => NOW);
  const seen = [];
  c.subscribe((s) => seen.push(s.analytics));
  assert.equal(c.get(), null);
  c.set(true);
  assert.deepEqual(seen, [true]);
});

test('subscribe reports each change and can unsubscribe', () => {
  const c = createConsent(fakeStorage(), () => NOW);
  const seen = [];
  const off = c.subscribe((s) => seen.push(s.analytics));
  c.set(true);
  c.set(false);
  off();
  c.set(true);
  assert.deepEqual(seen, [true, false]);
});

test('open() calls registered handlers', () => {
  const c = createConsent(fakeStorage(), () => NOW);
  let n = 0;
  c.onOpen(() => { n += 1; });
  c.open();
  assert.equal(n, 1);
});
