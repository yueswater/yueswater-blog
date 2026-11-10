/**
 * Definition / theorem / lemma / proposition / corollary / example callouts for math and
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
 * Kinds: .definition, .theorem, .lemma, .proposition, .corollary, .example, .proof. Compiles to
 *
 *   <div class="callout callout-<style>" data-kind="<kind>">
 *     <span class="callout-label">Label<span class="callout-title">(Title)</span></span> ...
 *
 * where <style> is the kind except that theorem, lemma, proposition and corollary share
 * "theorem" (one look, only the label text differs). The optional title="..."
 * shows in the badge on top: 定義：尋租 / Definition: Rent seeking. The name can also be
 * a leading heading line in the body ("# 尋租"). No numbering.
 *
 * A .proof written right after one of the others is part of that callout: a "+ 顯示證明" fold
 * inside the box, under the statement. On its own, .proof looks and folds like the answer of an exercise: a bordered box holding a <details>
 * ("+ 顯示證明"), closed by default; the proof body appears when it is clicked. It is rendered
 * with <section>, not <div>, inside (a nested div ends kramed's raw-HTML block early).
 * The body is full markdown, rendered here because kramed does not recurse into
 * raw HTML blocks (same reason as problemDiv.js / admonitionMarkdown.js).
 * Outer fence parsed by the shared lib/fencedDiv helper.
 */
var fencedDiv = require('./lib/fencedDiv');

var KINDS = '(?:definition|theorem|lemma|proposition|corollary|example|proof)';
var ATTRS_PATTERN = '\\.' + KINDS + '(?:[ \\t]+title="[^"\\n]*")?[ \\t]*';
var ATTRS_RE = new RegExp('^\\.(' + KINDS.slice(3, -1) + ')(?:[ \\t]+title="([^"\\n]*)")?[ \\t]*$');

var LABEL = {
  zh: { definition: '定義', theorem: '定理', lemma: '引理', proposition: '命題', corollary: '推論', example: '範例', proof: '證明' },
  en: { definition: 'Definition', theorem: 'Theorem', lemma: 'Lemma', proposition: 'Proposition', corollary: 'Corollary', example: 'Example', proof: 'Proof' }
};

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// A .proof block that directly follows a definition / theorem / lemma / proposition / corollary
// (only blank lines between) is folded into that callout: its body is appended to the statement
// after a marker line, and the handler below renders it as the "+ 顯示證明" fold inside the box.
var PROOF_MARK = '@@proof@@';
var MERGE_PROOF = /(^:::[ \t]*\{\.(?:definition|theorem|lemma|proposition|corollary)\b[^}\n]*\}[ \t]*\n[\s\S]*?)\n?:::[ \t]*\n(?:[ \t]*\n)+:::[ \t]*\{\.proof\}[ \t]*\n([\s\S]*?)\n?:::[ \t]*$/gm;

hexo.extend.filter.register('before_post_render', function (data) {
  var en = data.lang === 'en';
  var labels = en ? LABEL.en : LABEL.zh;

  data.content = data.content.replace(MERGE_PROOF, function (m, statement, proof) {
    return statement + '\n\n' + PROOF_MARK + '\n\n' + proof + '\n:::';
  });

  data.content = fencedDiv.replaceFencedDivs(data.content, ATTRS_PATTERN, function (attrs, body, full) {
    var m = ATTRS_RE.exec(attrs);
    if (!m) return full;
    var kind = m[1];
    var style = /^(?:lemma|proposition|corollary)$/.test(kind) ? 'theorem' : kind;
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
    var proofText = null;
    var cut = body.search(/^@@proof@@[ \t]*$/m);
    if (cut !== -1) {
      proofText = body.slice(cut).replace(/^@@proof@@[ \t]*\n/, '');
      body = body.slice(0, cut);
    }
    var html = hexo.render.renderSync({ text: body, engine: 'markdown' });
    if (proofText !== null) {
      html = html.trim() + '\n<details class="proof-details"><summary>' + (en ? 'Show proof' : '顯示證明') + '</summary>\n' +
        '<section class="proof-body">\n' + hexo.render.renderSync({ text: proofText, engine: 'markdown' }).trim() + '\n</section></details>';
    }
    // see admonitionMarkdown.js: a nested div ends kramed's raw-HTML block early
    html = html.replace(/<div class="table-container">([\s\S]*?)<\/div>/g, '<section class="table-container">$1</section>');
    // headings inside a callout stay out of the TOC (same as problemDiv.js)
    html = html.replace(/<(h[1-6])\b/g, '<$1 class="no-toc"');
    if (kind === 'proof') {
      return '\n\n<div class="callout callout-proof" data-kind="proof"><details class="proof-details">' +
        '<summary>' + (en ? 'Show proof' : '顯示證明') + '</summary>\n' +
        '<section class="proof-body">\n' + html.trim() + '\n</section></details></div>\n\n';
    }
    return '\n\n<div class="callout callout-' + style + '" data-kind="' + kind + '">' +
      '<span class="callout-label">' + badge + '</span>\n' +
      html.trim() + '\n</div>\n\n';
  });

  return data;
}, 14);
