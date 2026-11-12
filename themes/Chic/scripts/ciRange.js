/**
 * Interval cells like "807 至 991" ("807 to 991" in English posts), optionally followed by a
 * unit ("22.0 至 34.3 秒"), are split into spans so that the 至 / "to" lines up from row to row:
 * the lower end is right-aligned and the upper end left-aligned, each in a box of the same width
 * (css/_pages/post/post_content.styl, .ci). The unit hangs outside the box, so rows with and
 * without a unit still line up. Only a whole cell that is such an interval is touched; an
 * interval inside a longer cell, like "6.6（3.7 至 11.2）分", stays as written.
 */
var RANGE_CELL = /<td([^>]*)>\s*(-?[\d.,]+) (至|to) (-?[\d.,]+)( [^<\d][^<]*)?\s*<\/td>/g;

hexo.extend.filter.register('after_post_render', function (data) {
  if (!data.content || data.content.indexOf('<td') < 0) return data;
  data.content = data.content.replace(RANGE_CELL, function (m, attrs, lo, word, hi, unit) {
    return '<td' + attrs + '><span class="ci"><span class="ci-lo">' + lo + '</span> ' + word + ' <span class="ci-hi">' + hi + '</span>' +
      (unit ? '<span class="ci-unit">' + unit + '</span>' : '') + '</span></td>';
  });
  return data;
});
