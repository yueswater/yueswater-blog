/**
 * Generates paginated section listing pages (10 posts/page) at the old
 * Quarto site's section URLs: /articles/, /projects/, /dsa/, /diary/
 * (plus /page/2/ etc.), filtering site.posts by their URL prefix.
 */
var pagination = require('hexo-pagination');

var SECTIONS = [
  { path: 'articles', prefix: 'articles/posts/', title: '文章' },
  { path: 'projects', prefix: 'projects/posts/', title: '專案' },
  { path: 'dsa', prefix: 'dsa/posts/', title: 'DSA 筆記' },
  { path: 'diary', prefix: 'diary/posts/', title: '日記' }
];

hexo.extend.generator.register('section_pages', function (locals) {
  var result = [];

  SECTIONS.forEach(function (section) {
    var posts = locals.posts.filter(function (post) {
      return post.path.indexOf(section.prefix) === 0;
    }).sort('-date');

    result = result.concat(pagination(section.path, posts, {
      perPage: 10,
      layout: ['section'],
      format: 'page/%d/',
      data: {
        title: section.title,
        section_prefix: section.prefix
      }
    }));
  });

  return result;
});
