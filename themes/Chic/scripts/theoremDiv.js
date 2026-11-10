/**
 * Definition / theorem / lemma / proposition / example callouts for math and
 * economics writing:
 *
 *   ::: {.definition}
 *   **Rent seeking**: spending resources to capture existing wealth.
 *   :::
 *
 *   ::: {.theorem title="Pythagoras"}
 *   For a right triangle, $a^2 + b^2 = c^2$.
 *   :::
 *
 * Kinds: .definition, .theorem, .lemma, .proposition, .example. Compiles to
 *
 *   <div class="callout callout-<style>" data-kind="<kind>">
 *     <span class="callout-label">Label<span class="callout-title">(Title)</span></span> ...
 *
 * where <style> is the kind except that theorem, lemma and proposition share
 * "theorem" (one look, only the label text differs). The optional title="..."
 * shows after the label: 定義（尋租） / Definition (Rent seeking). No numbering.
 * The body is full markdown, rendered here because kramed does not recurse into
 * raw HTML blocks (same reason as problemDiv.js / admonitionMarkdown.js).
 * Outer fence parsed by the shared lib/fencedDiv helper.
 */
var fencedDiv = require('./lib/fencedDiv');

var KINDS = '(?:definition|theorem|lemma|proposition|example)';
var ATTRS_PATTERN = '\\.' + KINDS + '(?:[ \\t]+title="[^"\\n]*")?[ \\t]*';
var ATTRS_RE = new RegExp('^\\.(' + KINDS.slice(3, -1) + ')(?:[ \\t]+title="([^"\\n]*)")?[ \\t]*$');

var LABEL = {
  zh: { definition: '定義', theorem: '定理', lemma: '引理', proposition: '命題', example: '例' },
  en: { definition: 'Definition', theorem: 'Theorem', lemma: 'Lemma', proposition: 'Proposition', example: 'Example' }
};

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

hexo.extend.filter.register('before_post_render', function (data) {
  var en = data.lang === 'en';
  var labels = en ? LABEL.en : LABEL.zh;

  data.content = fencedDiv.replaceFencedDivs(data.content, ATTRS_PATTERN, function (attrs, body, full) {
    var m = ATTRS_RE.exec(attrs);
    if (!m) return full;
    var kind = m[1];
    var style = /^(?:lemma|proposition)$/.test(kind) ? 'theorem' : kind;
    var title = '';
    if (m[2] && m[2].trim()) {
      title = '<span class="callout-title">' + (en ? ' (' : '（') + escapeHtml(m[2].trim()) + (en ? ')' : '）') + '</span>';
    }
    var html = hexo.render.renderSync({ text: body, engine: 'markdown' });
    // see admonitionMarkdown.js: a nested div ends kramed's raw-HTML block early
    html = html.replace(/<div class="table-container">([\s\S]*?)<\/div>/g, '<section class="table-container">$1</section>');
    // headings inside a callout stay out of the TOC (same as problemDiv.js)
    html = html.replace(/<(h[1-6])\b/g, '<$1 class="no-toc"');
    return '\n\n<div class="callout callout-' + style + '" data-kind="' + kind + '">' +
      '<span class="callout-label">' + labels[kind] + title + '</span>\n' +
      html.trim() + '\n</div>\n\n';
  });

  return data;
}, 14);
