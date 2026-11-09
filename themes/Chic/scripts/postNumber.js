/**
 * post_no(post): the "NO.xx" shown in list rows -- the post's chronological
 * rank (oldest = 1) among posts of the same section and language, so the
 * Chinese and English listings each count 1, 2, 3... without gaps.
 *
 * Section = first path segment (articles / projects / dsa / diary ...), the
 * same split sectionPages.js uses. Recomputed per call: the site has a few
 * hundred posts at most, so a sort per row is cheaper than cache invalidation.
 */
var newestFirst = require('./lib/postOrder');

function groupKey(post) {
  var section = String(post.path).replace(/^\//, '').split('/')[0];
  return section + '|' + (post.lang === 'en' ? 'en' : 'zh');
}

hexo.extend.helper.register('post_no', function (post) {
  var key = groupKey(post);
  // Rank from the same newest-first sort the listings use, so posts that share
  // a date number in exactly the order they are displayed.
  var peers = this.site.posts
    .filter(function (p) { return groupKey(p) === key; })
    .toArray()
    .sort(newestFirst);
  for (var i = 0; i < peers.length; i++) {
    if (peers[i]._id === post._id) return peers.length - i;
  }
  return 0;
});
