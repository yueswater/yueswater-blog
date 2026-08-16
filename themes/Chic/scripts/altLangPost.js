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
