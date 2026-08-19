/**
 * Problem-statement callout, for quoting/summarizing a LeetCode-style
 * problem right under its heading:
 *
 *   ::: {.problem}
 *   Markdown body -- title, description, examples, etc.
 *   :::
 *
 * compiles to <div class="problem-statement"><span class="problem-label">
 * 題目敘述</span>...</div> (label reads "Problem" for lang: en posts) with
 * the body rendered as markdown (bold, code spans, lists, etc. all work
 * inside). Outer fence parsed by the shared lib/fencedDiv helper (also
 * used by figureDiv.js).
 */
var fencedDiv = require('./lib/fencedDiv');

var PROBLEM_ATTRS_PATTERN = '\\.problem';

hexo.extend.filter.register('before_post_render', function (data) {
  var label = data.lang === 'en' ? 'Problem' : '題目敘述';

  data.content = fencedDiv.replaceFencedDivs(data.content, PROBLEM_ATTRS_PATTERN, function (attrs, body) {
    var html = hexo.render.renderSync({ text: body, engine: 'markdown' });
    // Headings inside a problem-statement block (e.g. "#### 範例 1：") are
    // supplementary and shouldn't clutter the post's TOC -- mark them
    // .no-toc so tocbot's ignoreSelector (see toc.ejs) skips them.
    html = html.replace(/<(h[1-6])\b/g, '<$1 class="no-toc"');
    return '<div class="problem-statement"><span class="problem-label">' + label + '</span>\n' + html.trim() + '\n</div>';
  });

  return data;
}, 14);
