/**
 * Cache-busting query param for stylesheets/scripts. Without this,
 * style.css/script.js have no hash in their filename, so browsers and
 * Cloudflare's edge cache can keep serving a stale copy for hours after
 * a deploy (max-age=14400) even though the HTML is fresh -- confirmed
 * this caused visibly outdated CSS on a real device after two separate
 * pushes. BUILD_VERSION is computed once per `hexo generate` process
 * (Node module caching), so every page in the same build shares one
 * version string, and each new build gets a new one.
 */
var BUILD_VERSION = Date.now();

hexo.extend.helper.register('build_version', function () {
  return BUILD_VERSION;
});
