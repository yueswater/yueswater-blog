/**
 * taxonomy_groups(items): groups category / tag entries into a book-style
 * index for the /category/ and /tag/ overview pages.
 *
 *   items  [{ name, url, count }]
 *   return [{ key, items }]  -- A-Z first, then the Zhuyin initials in
 *                               dictionary order (ㄅ ㄆ ㄇ ... ㄩ), then "#"
 *
 * A name is filed under its first character: a Latin letter goes under that
 * letter, a Han character under the first Zhuyin symbol of its reading
 * (derived from the pinyin of the `pinyin` package, which has no Zhuyin
 * output of its own), anything else under "#". Within a group, names sort with
 * ICU's Zhuyin collation, so 技 comes before 寫 the way a Taiwanese dictionary
 * orders them.
 *
 * Readings are the package's most common one per character, so a heteronym
 * (e.g. 行, 重) can land under the "wrong" initial; rename the tag if it matters.
 */
var pinyin = require('pinyin').pinyin;

var collator = new Intl.Collator('zh-TW-u-co-zhuyin');

// pinyin initials -> Zhuyin. The two-letter ones must be tried first.
var INITIALS = [
  ['zh', 'ㄓ'], ['ch', 'ㄔ'], ['sh', 'ㄕ'],
  ['b', 'ㄅ'], ['p', 'ㄆ'], ['m', 'ㄇ'], ['f', 'ㄈ'], ['d', 'ㄉ'], ['t', 'ㄊ'],
  ['n', 'ㄋ'], ['l', 'ㄌ'], ['g', 'ㄍ'], ['k', 'ㄎ'], ['h', 'ㄏ'], ['j', 'ㄐ'],
  ['q', 'ㄑ'], ['x', 'ㄒ'], ['r', 'ㄖ'], ['z', 'ㄗ'], ['c', 'ㄘ'], ['s', 'ㄙ']
];

// syllables with no consonant initial: longest prefix first (ang before an, ...)
var VOWEL_STARTS = [
  ['ang', 'ㄤ'], ['eng', 'ㄥ'], ['ai', 'ㄞ'], ['ao', 'ㄠ'], ['an', 'ㄢ'], ['ei', 'ㄟ'],
  ['en', 'ㄣ'], ['er', 'ㄦ'], ['ou', 'ㄡ'], ['a', 'ㄚ'], ['o', 'ㄛ'], ['e', 'ㄜ']
];

var ZHUYIN_ORDER = 'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦㄧㄨㄩ';

function firstZhuyin(syllable) {
  var s = String(syllable).toLowerCase();
  var i;
  for (i = 0; i < INITIALS.length; i++) {
    if (s.indexOf(INITIALS[i][0]) === 0) return INITIALS[i][1];
  }
  if (s.charAt(0) === 'y') return s.charAt(1) === 'u' || s === 'yong' ? 'ㄩ' : 'ㄧ';
  if (s.charAt(0) === 'w') return 'ㄨ';
  for (i = 0; i < VOWEL_STARTS.length; i++) {
    if (s.indexOf(VOWEL_STARTS[i][0]) === 0) return VOWEL_STARTS[i][1];
  }
  return '';
}

function groupKey(name) {
  var ch = Array.from(String(name).trim())[0] || '';
  if (/[A-Za-z]/.test(ch)) return ch.toUpperCase();
  if (/\p{Script=Han}/u.test(ch)) {
    var reading = pinyin(ch, { style: pinyin.STYLE_NORMAL });
    var symbol = reading && reading[0] && reading[0][0] ? firstZhuyin(reading[0][0]) : '';
    return symbol || '#';
  }
  return '#';
}

// A-Z (0-25), Zhuyin (100+), "#" (999)
function groupRank(key) {
  if (/^[A-Z]$/.test(key)) return key.charCodeAt(0) - 65;
  var z = ZHUYIN_ORDER.indexOf(key);
  return z >= 0 ? 100 + z : 999;
}

hexo.extend.helper.register('taxonomy_groups', function (items) {
  var byKey = {};
  items.forEach(function (item) {
    var key = groupKey(item.name);
    (byKey[key] = byKey[key] || []).push(item);
  });
  return Object.keys(byKey)
    .sort(function (a, b) { return groupRank(a) - groupRank(b); })
    .map(function (key) {
      return {
        key: key,
        items: byKey[key].slice().sort(function (a, b) { return collator.compare(a.name, b.name); })
      };
    });
});

// "categories/Typst/" -> "categories-en/Typst/" for English pages (see langTaxonomyPages.js)
function localizedPath(path, lang) {
  return lang === 'en' ? String(path).replace(/^\/?(categories|tags)\//, '$1-en/') : path;
}

/**
 * taxonomy_path(item, lang): the page for a category / tag in the given
 * language, for post headers and footers.
 */
hexo.extend.helper.register('taxonomy_path', function (item, lang) {
  return localizedPath(item.path, lang);
});

/**
 * taxonomy_items(list, lang): site.categories / site.tags as index entries for
 * one language -- only items with posts in that language, counted by those
 * posts, linking to that language's page.
 */
hexo.extend.helper.register('taxonomy_items', function (list, lang) {
  var self = this;
  var wantEnglish = lang === 'en';
  var items = [];
  list.forEach(function (item) {
    var count = item.posts.filter(function (p) { return (p.lang === 'en') === wantEnglish; }).length;
    if (count) items.push({ name: item.name, url: self.url_for(localizedPath(item.path, lang)), count: count });
  });
  return items;
});
