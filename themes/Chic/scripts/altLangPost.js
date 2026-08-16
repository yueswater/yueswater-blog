/**
 * Finds the alternate-language counterpart of the given post, matching
 * by slug with a trailing "-en" suffix stripped. Returns null when the
 * page isn't a post (no lang/slug) or has no counterpart.
 */
hexo.extend.helper.register('alt_lang_post', function (page) {
  if (!page || !page.slug || !page.lang) return null;
  var baseSlug = page.slug.replace(/-en$/, '');
  var posts = this.site.posts.data;
  for (var i = 0; i < posts.length; i++) {
    var p = posts[i];
    if (p.lang && p.lang !== page.lang && p.slug.replace(/-en$/, '') === baseSlug) {
      return p;
    }
  }
  return null;
});
