/**
 * Newest-first comparator for posts. Front matter dates are often a bare
 * "2026-08-24" with no time, so same-day posts are a true tie and Hexo's
 * sort() would order them differently depending on which set it is sorting.
 * Ties break on path (descending), so the listings (sectionPages.js) and the
 * NO.xx numbering (postNumber.js) always agree on the order.
 */
module.exports = function newestFirst(a, b) {
  var diff = b.date.valueOf() - a.date.valueOf();
  if (diff) return diff;
  var pa = String(a.path);
  var pb = String(b.path);
  if (pa === pb) return 0;
  return pa > pb ? -1 : 1;
};
