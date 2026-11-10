/**
 * Numbered display equations with cross-references.
 *
 *   ::: {.equation #eq:ratio}
 *   p_i = \dfrac{x_i^r}{x_i^r + x_j^r}
 *   :::
 *
 *   ... see @eq:ratio ...        -> "式 (1)" ("Eq. (1)" in non-zh posts), one link to the equation
 *
 * The block body is bare TeX (a ```tex fence around it is tolerated). It becomes a
 * MathJax `equation` environment with \label{id}, so MathJax numbers it in page order
 * and `@eq:id` becomes \eqref{id}. Without `#id` the equation is not numbered.
 * References only resolve to ids defined in the same post. Web only (PDF: not handled).
 * Runs before mathProtect (priority 1) so the generated $\eqref{}$ is protected too.
 */
var BLOCK = /^:::[ \t]*\{([^}\n]*)\}[ \t]*\n([\s\S]*?)\n:::[ \t]*$/gm;
// an "式" / "Eq." already written in front of the reference is absorbed into the link
// Blanks between a CJK character and the reference are swallowed too: "由 @eq:foc 可得" and
// "由@eq:foc可得" both come out as "由式 (4)可得" with no stray gap (the link carries its own word).
var CJK = '\\u3400-\\u9fff\\u3000-\\u303f\\uff00-\\uffef';
var SKIP_OR_REF = new RegExp(
  '(```[\\s\\S]*?```|~~~[\\s\\S]*?~~~|`[^`\\n]*`)' +
  '|(?:(?<=[' + CJK + '])[ \\t]+)?(?:(式|Eq\\.?|Equation)[ \\t]*)?(?<![\\w@])@(eq:[\\w:-]*\\w)(?:[ \\t]+(?=[' + CJK + ']))?',
  'g'
);

hexo.extend.filter.register('before_post_render', function (data) {
  if (!data.content || data.content.indexOf('.equation') === -1) return data;

  var labels = {};
  data.content = data.content.replace(BLOCK, function (match, attrs, body) {
    if (!/(^|\s)\.equation(\s|$)/.test(attrs)) return match;
    var id = (attrs.match(/#([\w:.-]+)/) || [])[1];
    var tex = body.trim().replace(/^```(?:tex|latex)?\s*\n/, '').replace(/\n```$/, '').trim();
    if (id) labels[id] = true;
    var env = id ? 'equation' : 'equation*';
    return '$$\n\\begin{' + env + '}' + (id ? '\\label{' + id + '}' : '') + '\n' +
      tex + '\n\\end{' + env + '}\n$$';
  });

  var word = /^zh/i.test(data.lang || '') || !data.lang ? '式' : 'Eq.';
  data.content = data.content.replace(SKIP_OR_REF, function (match, skip, written, id) {
    if (skip !== undefined || !labels[id]) return match;
    // <span class="eq-ref"> is turned into one <a> (word + number) by mathjax.ejs
    return '<span class="eq-ref" data-eq="' + id + '">' + word + ' $\\eqref{' + id + '}$</span>';
  });
  return data;
}, 0);
