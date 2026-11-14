/**
 * Interlinear gloss line: a foreign sentence whose words show their meaning on hover (or tap / keyboard focus):
 *
 *   ::: {.gloss}
 *   Apa=什麼／是否 kamu=你 baik-baik=還好 saja?=只是
 *   :::
 *
 * Each space-separated token is `word=meaning`; a token without `=` is plain text. Punctuation at the end of
 * the word (, . ? !) stays outside the highlighted span, so the underline and the tooltip cover the word only.
 * One line = one centred sentence (<p class="gloss">); the tooltip animation is css/_pages/post/post_gloss.styl.
 */
var fencedDiv = require('./lib/fencedDiv');

var TRAILING = /^(.*?)([,.?!;:]*)$/;

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function token(t) {
  var eq = t.indexOf('=');
  if (eq < 0) return escapeHtml(t);
  var m = TRAILING.exec(t.slice(0, eq));
  var gloss = t.slice(eq + 1);
  return '<span class="gloss-word" tabindex="0" data-gloss="' + escapeHtml(gloss) + '">' + escapeHtml(m[1]) + '</span>' + escapeHtml(m[2]);
}

function sentence(line) {
  return '<p class="gloss">' + line.trim().split(/\s+/).map(token).join(' ') + '</p>';
}

hexo.extend.filter.register('before_post_render', function (data) {
  if (!data.content || data.content.indexOf('{.gloss}') < 0) return data;
  data.content = fencedDiv.replaceFencedDivs(data.content, '\\.gloss', function (attrs, body) {
    var lines = body.split('\n').filter(function (l) { return l.trim(); });
    return '\n\n' + lines.map(sentence).join('\n\n') + '\n\n';
  });
  return data;
});
