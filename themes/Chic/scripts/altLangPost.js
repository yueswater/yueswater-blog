/**
 * Finds the alternate-language counterpart of the given post OR page,
 * matching by URL path with a trailing "-en/" segment stripped. Works
 * across both site.posts and site.pages so non-post pages (about, etc.)
 * can also carry a language switch link.
 */
function normalizePath(path) {
  // posts already end in a trailing slash; pages keep the raw
  // "index.html"/".html" source path, so normalize both to the same shape
  // before comparing.
  return path.replace(/index\.html$/, '').replace(/\.html$/, '/');
}

function stripEnSuffix(path) {
  return normalizePath(path).replace(/-en\/$/, '/');
}

hexo.extend.helper.register('alt_lang_post', function (page) {
  if (!page || !page.path || !page.lang) return null;
  var target = stripEnSuffix(page.path);
  var collections = [this.site.posts.data, this.site.pages.data];
  for (var c = 0; c < collections.length; c++) {
    var items = collections[c];
    for (var i = 0; i < items.length; i++) {
      var p = items[i];
      if (p.path !== page.path && p.lang && p.lang !== page.lang && stripEnSuffix(p.path) === target) {
        // pages keep their raw "index.html" source path while posts already
        // have a pretty trailing-slash path -- normalize so templates can
        // always do url_for(altPost.path) without caring which it got.
        return p.path === normalizePath(p.path) ? p : Object.assign({}, p, { path: normalizePath(p.path) });
      }
    }
  }
  return null;
});

/**
 * Path of the other-language twin of any page (post, page, section listing,
 * homepage, taxonomy page), or null. Same rules as the language switch in
 * _partial/header.ejs; used for <link rel="alternate" hreflang>.
 */
hexo.extend.helper.register('alt_lang_href', function (page) {
  var altPost = this.alt_lang_post(page);
  var href = altPost ? altPost.path : null;
  if (!href && page.section_prefix) {
    href = page.lang === 'en'
      ? page.path.replace(/^([^\/]+)-en\//, '$1/')
      : page.path.replace(/^([^\/]+)\//, '$1-en/');
  }
  if (!href && page.is_home_en) {
    href = '/';
  } else if (!href && this.is_home()) {
    href = '/en/';
  }
  if (!href && (page.category || page.tag)) {
    href = page.alt_path || page.alt_index;
  }
  return href;
});
