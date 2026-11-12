const test = require('node:test');
const assert = require('node:assert/strict');
const { cut, hostOf, stripUtm, captureLanding } = require('../themes/Chic/source/js/data/traffic-core.js');

test('stripUtm removes utm_* and keeps other params and the hash', () => {
  assert.equal(stripUtm('/p?id=3&utm_source=fb&utm_medium=x#sec'), '/p?id=3#sec');
  assert.equal(stripUtm('/p?utm_source=fb'), '/p');
  assert.equal(stripUtm('/p?id=3#a'), '/p?id=3#a');
  assert.equal(stripUtm('/'), '/');
  assert.equal(stripUtm('/p?q=a%20b&utm_term=x'), '/p?q=a%20b');
});

test('hostOf returns the referrer hostname, empty for direct and same-site', () => {
  assert.equal(hostOf('https://l.facebook.com/l.php?u=1', 'www.yueswater.com'), 'l.facebook.com');
  assert.equal(hostOf('https://www.yueswater.com/a', 'yueswater.com'), '');
  assert.equal(hostOf('', 'x'), '');
  assert.equal(hostOf('not a url', 'x'), '');
});

test('cut trims and limits to 100 characters', () => {
  assert.equal(cut('a'.repeat(250)).length, 100);
  assert.equal(cut(null), '');
  assert.equal(cut('  hi '), 'hi');
});

test('captureLanding collects path, lang, referrer host and cut utm values', () => {
  const l = captureLanding(
    'https://www.yueswater.com/posts/a/?utm_source=ig&utm_campaign=' + 'c'.repeat(300),
    'https://www.instagram.com/', 'www.yueswater.com', 'zh-TW');
  assert.equal(l.path, '/posts/a/');
  assert.equal(l.lang, 'zh-TW');
  assert.equal(l.utm_source, 'ig');
  assert.equal(l.utm_campaign.length, 100);
  assert.equal(l.referrer_host, 'www.instagram.com');
  assert.equal(l.utm_medium, '');
  assert.equal(captureLanding('/en/', '', 'x', 'en').lang, 'en');
});
