/**
 * post_asset_folder only auto-copies a sibling folder that shares the post
 * file's own name stem (e.g. foo.md -> foo/). Posts using the foo/index.md
 * convention have a stem of "index", not "images" -- so the normal
 * mechanism can't find foo/images/. This generator copies it manually for
 * any .../index.md or .../index-en.md post, keyed off the post's own
 * permalink path. zh (index.md) and en (index-en.md) posts share one
 * images/ folder on disk but get their own copy under their own URL,
 * since each post's rendered HTML lives at a different path.
 */
var fs = require('fs');
var pathFn = require('path');

hexo.extend.generator.register('index_md_images', function (locals) {
  var result = [];

  locals.posts.data.forEach(function (post) {
    if (!post.source || !/\/index(-en)?\.md$/.test(post.source)) return;

    var imagesDir = pathFn.join(pathFn.dirname(post.full_source), 'images');
    if (!fs.existsSync(imagesDir)) return;

    var basePath = post.path.replace(/^\//, '').replace(/\/?$/, '/');

    (function walk(dir, relPrefix) {
      fs.readdirSync(dir).forEach(function (file) {
        var filePath = pathFn.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          walk(filePath, relPrefix + file + '/');
          return;
        }

        result.push({
          path: basePath + 'images/' + relPrefix + file,
          data: (function (filePath) {
            return function () {
              return fs.createReadStream(filePath);
            };
          })(filePath)
        });
      });
    })(imagesDir, '');
  });

  return result;
});
