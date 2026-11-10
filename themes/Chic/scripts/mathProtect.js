/**
 * Keep inline $...$ math out of the Markdown parser.
 *
 * kramed has no single-dollar math rule, so a paragraph with two formulas such as
 * "$C_i(x_i)$ ... $c \in R_{+}$" gets its underscores paired across the formulas
 * into <em>. Before rendering, each inline formula is swapped for an opaque token
 * (private-use brackets around the hex-encoded source: nothing in it is Markdown
 * syntax); after rendering it is written back, HTML-escaped, for MathJax to find.
 *
 * Only posts with `mathjax: true`. Code blocks, inline code and $$...$$ display
 * blocks (kramed handles those itself) are left alone.
 */
var OPEN = '';
var CLOSE = '';

var SKIP_OR_MATH = new RegExp(
  '(```[\\s\\S]*?```|~~~[\\s\\S]*?~~~|`[^`\\n]*`|\\$\\$[\\s\\S]*?\\$\\$)' +
  // opening $ not followed by space, closing $ not preceded by space or backslash,
  // so "costs $5 and $10" is not taken for a formula
  '|(?<![\\\\$])\\$(?![\\s$])((?:\\\\[\\s\\S]|[^$\\\\\\n])+?)(?<![\\s\\\\])\\$(?!\\$)',
  'g'
);

function escapeHtml(t) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

hexo.extend.filter.register('before_post_render', function (data) {
  if (!data.mathjax || !data.content) return data;
  data.content = data.content.replace(SKIP_OR_MATH, function (match, skip, math) {
    if (skip !== undefined) return match;
    return OPEN + Buffer.from(math, 'utf8').toString('hex') + CLOSE;
  });
  return data;
}, 1);

hexo.extend.filter.register('after_post_render', function (data) {
  var restore = function (html) {
    return html.replace(new RegExp(OPEN + '([0-9a-f]*)' + CLOSE, 'g'), function (m, hex) {
      return '$' + escapeHtml(Buffer.from(hex, 'hex').toString('utf8')) + '$';
    });
  };
  ['content', 'excerpt', 'more'].forEach(function (k) {
    if (typeof data[k] === 'string') data[k] = restore(data[k]);
  });
  return data;
}, 20);
