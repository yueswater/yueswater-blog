/**
 * Generates paginated section listing pages (10 posts/page) at the old
 * Quarto site's section URLs: /articles/, /projects/, /dsa/, /diary/
 * (plus /page/2/ etc.), filtering site.posts by their URL prefix.
 *
 * Each section is split into a zh-TW page and an English page (mirroring
 * the "-en" suffix convention used for individual posts) so a Chinese
 * listing never shows English posts and vice versa.
 */
var pagination = require('hexo-pagination');

var SECTIONS = [
  { path: 'articles', prefix: 'articles/', title: { 'zh-TW': '文章', en: 'Articles' } },
  { path: 'projects', prefix: 'projects/', title: { 'zh-TW': '專案', en: 'Projects' } },
  { path: 'dsa', prefix: 'dsa/', title: { 'zh-TW': '資結筆記', en: 'DSA Notes' } },
  { path: 'diary', prefix: 'diary/', title: { 'zh-TW': '日記', en: 'Diary' } }
];

hexo.extend.generator.register('section_pages', function (locals) {
  var result = [];

  SECTIONS.forEach(function (section) {
    var sectionPosts = locals.posts.filter(function (post) {
      // posts with an explicit frontmatter `permalink:` (e.g. dsa/*/index.md)
      // get a leading "/" on post.path that :title-derived posts don't --
      // strip it before the prefix check.
      return post.path.replace(/^\//, '').indexOf(section.prefix) === 0;
    });

    ['zh-TW', 'en'].forEach(function (lang) {
      var posts = sectionPosts.filter(function (post) {
        return lang === 'en' ? post.lang === 'en' : post.lang !== 'en';
      }).sort('-date');

      var base = lang === 'en' ? section.path + '-en' : section.path;
      var pageData = {
        title: section.title[lang],
        lang: lang,
        section_prefix: section.prefix
      };

      if (posts.length === 0) {
        // hexo-pagination emits nothing for an empty list; build one empty
        // page by hand so the "-en" listing always exists (no dead nav link)
        // even before a section has any English posts yet.
        result.push({
          path: base + '/',
          layout: ['section'],
          data: Object.assign({
            base: base + '/',
            total: 1,
            current: 1,
            current_url: base + '/',
            posts: [],
            prev: 0,
            prev_link: '',
            next: 0,
            next_link: ''
          }, pageData)
        });
      } else {
        result = result.concat(pagination(base, posts, {
          perPage: 10,
          layout: ['section'],
          format: 'page/%d/',
          data: pageData
        }));
      }
    });
  });

  return result;
});
