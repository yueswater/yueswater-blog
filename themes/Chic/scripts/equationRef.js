/**
 * Numbered display equations with cross-references.
 *
 *   ::: {.equation #eq:ratio}
 *   p_i = \dfrac{x_i^r}{x_i^r + x_j^r}
 *   :::
 *
 *   ... see @eq:ratio ...        -> "(1)", a link to the equation
 *
 * The block body is bare TeX (a ```tex fence around it is tolerated). It becomes a
 * MathJax `equation` environment with \label{id}, so MathJax numbers it in page order
 * and `@eq:id` becomes \eqref{id}. Without `#id` the equation is not numbered.
 * References only resolve to ids defined in the same post. Web only (PDF: not handled).
 * Runs before mathProtect (priority 1) so the generated $\eqref{}$ is protected too.
 */
var BLOCK = /^:::[ \t]*\{([^}\n]*)\}[ \t]*\n([\s\S]*?)\n:::[ \t]*$/gm;
var SKIP_OR_REF = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)|(?<![\w@])@(eq:[\w:-]*\w)/g;

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

  data.content = data.content.replace(SKIP_OR_REF, function (match, skip, id) {
    if (skip !== undefined || !labels[id]) return match;
    return '$\\eqref{' + id + '}$';
  });
  return data;
}, 0);
