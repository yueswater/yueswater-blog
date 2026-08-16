/**
 * Hexo's built-in post.prev/post.next chain across ALL posts by date,
 * mixing languages together (and using "prev"=newer/"next"=older, which
 * reads backwards). This recomputes prev/next scoped to page.lang, in
 * actual reading order: prev = published earlier (left), next =
 * published later (right).
 */
hexo.extend.helper.register('lang_post_nav', function (post) {
  if (!post || !post.lang) return { prev: null, next: null };

  var posts = this.site.posts.data
    .filter(function (p) { return p.lang === post.lang; })
    .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

  var idx = -1;
  for (var i = 0; i < posts.length; i++) {
    if (posts[i].path === post.path) { idx = i; break; }
  }
  if (idx === -1) return { prev: null, next: null };

  return {
    prev: idx < posts.length - 1 ? posts[idx + 1] : null,
    next: idx > 0 ? posts[idx - 1] : null
  };
});
