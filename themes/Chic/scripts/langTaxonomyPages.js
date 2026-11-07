/**
 * Per-language category and tag pages.
 *
 * Hexo's built-in generators emit one page per category / tag listing every
 * post that carries it, so /categories/Typst/ mixed the Chinese and English
 * posts. This replaces them with two pages per taxonomy item, each listing only
 * the posts of one language:
 *
 *   /categories/Typst/      zh-TW posts          /tags/Typst/      zh-TW posts
 *   /categories-en/Typst/   English posts        /tags-en/Typst/   English posts
 *
 * An item with no posts in a language gets no page in that language. Each page
 * carries `alt_path` (the same item in the other language, when it exists) and
 * `alt_index` (the other language's overview page) so the header's language
 * switch always has somewhere to go.
 *
 * Hexo has no generator.unregister(), but list() hands back the live store, so
 * the two built-ins are deleted from it. Theme scripts load after plugins, so
 * the built-ins are already registered by now.
 */
var pagination = require('hexo-pagination');
var newestFirst = require('./lib/postOrder');

var store = hexo.extend.generator.list();
delete store.category;
delete store.tag;

var KINDS = [
  { kind: 'category', collection: 'categories', dir: 'categories', index: 'category' },
  { kind: 'tag', collection: 'tags', dir: 'tags', index: 'tag' }
];

function isEnglish(post) {
  return post.lang === 'en';
}

// "categories/Typst/" -> "categories-en/Typst/"
function toEnglishPath(path, dir) {
  return path.replace(new RegExp('^/?' + dir + '/'), dir + '-en/');
}

KINDS.forEach(function (spec) {
  hexo.extend.generator.register(spec.kind, function (locals) {
    var perPage = hexo.config.per_page || 10;
    var result = [];

    locals[spec.collection].forEach(function (item) {
      var zh = item.posts.filter(function (p) { return !isEnglish(p); }).toArray().sort(newestFirst);
      var en = item.posts.filter(isEnglish).toArray().sort(newestFirst);
      var zhPath = item.path;
      var enPath = toEnglishPath(item.path, spec.dir);

      [
        { lang: 'zh-TW', posts: zh, base: zhPath, alt: en.length ? enPath : null, altIndex: '/' + spec.index + '-en/' },
        { lang: 'en', posts: en, base: enPath, alt: zh.length ? zhPath : null, altIndex: '/' + spec.index + '/' }
      ].forEach(function (variant) {
        if (!variant.posts.length) return;
        var data = {
          lang: variant.lang,
          total_posts: variant.posts.length,
          alt_path: variant.alt,
          alt_index: variant.altIndex
        };
        data[spec.kind] = item.name;
        result = result.concat(pagination(variant.base, variant.posts, {
          perPage: perPage,
          layout: [spec.kind, 'archive', 'index'],
          format: 'page/%d/',
          data: data
        }));
      });
    });

    return result;
  });
});
