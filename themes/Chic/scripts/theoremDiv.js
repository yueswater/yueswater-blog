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
 * shows in the badge on top: 定義：尋租 / Definition: Rent seeking. The name can also be
 * a leading heading line in the body ("# 尋租"). No numbering.
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
    // The name goes in the badge on top: a leading heading line in the body
    // ("# 尋租") or, as before, title="尋租" in the fence.
    var name = m[2] && m[2].trim() ? escapeHtml(m[2].trim()) : '';
    var lead = /^\s*#{1,6}[ \t]+(.+?)[ \t]*(?:\n|$)/.exec(body);
    if (lead) {
      body = body.slice(lead[0].length);
      // inline markdown (math, code, bold) allowed in the name
      name = hexo.render.renderSync({ text: lead[1], engine: 'markdown' }).trim().replace(/^<p>([\s\S]*)<\/p>$/, '$1');
    }
    var badge = '<span class="callout-kind">' + labels[kind] + '</span>' +
      (name ? '<span class="callout-name">' + (en ? ': ' : '：') + name + '</span>' : '');
    var html = hexo.render.renderSync({ text: body, engine: 'markdown' });
    // see admonitionMarkdown.js: a nested div ends kramed's raw-HTML block early
    html = html.replace(/<div class="table-container">([\s\S]*?)<\/div>/g, '<section class="table-container">$1</section>');
    // headings inside a callout stay out of the TOC (same as problemDiv.js)
    html = html.replace(/<(h[1-6])\b/g, '<$1 class="no-toc"');
    return '\n\n<div class="callout callout-' + style + '" data-kind="' + kind + '">' +
      '<span class="callout-label">' + badge + '</span>\n' +
      html.trim() + '\n</div>\n\n';
  });

  return data;
}, 14);
