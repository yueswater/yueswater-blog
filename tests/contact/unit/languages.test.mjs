// Code-block languages: picker labels, colours and the registered highlighters.
import test from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGES, labelFor, colorFor, lowlight } from '../../../tools/contact-editor/languages.js';

test('plain text is listed first, the rest alphabetically', () => {
  assert.equal(LANGUAGES[0].value, 'plaintext');
  const rest = LANGUAGES.slice(1).map((l) => l.label);
  assert.deepEqual(rest, [...rest].sort((a, b) => a.localeCompare(b)));
});

test('every listed language has a registered highlighter', () => {
  for (const { value } of LANGUAGES) if (value !== 'plaintext') assert.ok(lowlight.registered(value), value);
});

test('common and extra languages are present', () => {
  const values = LANGUAGES.map((l) => l.value);
  for (const v of ['python', 'javascript', 'typescript', 'rust', 'go', 'r', 'sql', 'stata', 'matlab', 'julia', 'latex', 'haskell']) assert.ok(values.includes(v), v);
});

test('labels', () => {
  assert.equal(labelFor('cpp'), 'C++');
  assert.equal(labelFor(''), 'Plain text');
  assert.equal(labelFor('unknownlang'), 'unknownlang');
});

test('colours: linguist hex per language, none for plain text', () => {
  assert.equal(colorFor('python'), '#3572a5');
  assert.equal(colorFor('rust'), '#dea584');
  assert.equal(colorFor('plaintext'), '');
  for (const { value } of LANGUAGES) if (value !== 'plaintext') assert.match(colorFor(value), /^#[0-9a-f]{6}$/, value);
});
