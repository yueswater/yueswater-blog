/**
 * Hexo's built-in excerpt filter (after_post_render, priority 10) uses a
 * front-matter `excerpt:` field as-is -- it never runs it through the
 * markdown renderer, so inline markdown like `` `#set` `` shows up as
 * literal backticks instead of styled code. Render it ourselves, once
 * hexo's own filter has set data.excerpt, and strip the wrapping <p> that
 * a single-line markdown render produces (excerpt is used inline).
 *
 * Inline math ($N$) is typeset here, at build time (lib/texSvg.js), like a title in titleHtml.js, so the
 * post list shows a formula and not its source, with no MathJax on the list page:
 *   data.excerpt  html; $tex$ -> <span class="title-math" data-plain="tex"><svg ...></span>
 * Helpers (the model keeps only the html, so both start from it):
 *   excerpt_inline(html)  the one-line text of the post list: every tag stripped except those math spans and <code>
 *   excerpt_plain(html)   plain text, a formula as its source without $ (meta description, link previews, share cards)
 */
const texSvg = require('./lib/texSvg');

const MATH = /\$([^$\s][^$]*?)\$/g;
const MATH_SPAN = /<span class="title-math"[^>]*>[\s\S]*?<\/span>/g;
const KEEP = new RegExp(MATH_SPAN.source + '|<code>[\\s\\S]*?<\\/code>', 'g'); // what the post list keeps as markup

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function unescapeHtml(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}

function typesetMath(html) {
  return html.replace(MATH, function (m, tex) {
    return '<span class="title-math" data-plain="' + escapeHtml(unescapeHtml(tex)) + '">' + texSvg(unescapeHtml(tex)) + '</span>';
  });
}

hexo.extend.filter.register('after_post_render', function (data) {
  if (data.excerpt) {
    const html = hexo.render
      .renderSync({ text: data.excerpt, engine: 'markdown' })
      .trim()
      .replace(/^<p>/, '')
      .replace(/<\/p>$/, '');
    data.excerpt = typesetMath(html);
  }
  return data;
}, 20);

hexo.extend.helper.register('excerpt_inline', function (html) {
  if (!html) return '';
  const kept = String(html).match(KEEP) || [];
  const pieces = String(html).split(KEEP);
  return pieces.map(function (piece, i) {
    const text = escapeHtml(unescapeHtml(piece.replace(/<[^>]+>/g, '')));
    return text + (kept[i] || '');
  }).join('').replace(/\s+/g, ' ').trim();
});

hexo.extend.helper.register('excerpt_plain', function (html) {
  if (!html) return '';
  const withMath = String(html).replace(/<span class="title-math" data-plain="([^"]*)"[^>]*>[\s\S]*?<\/span>/g, '$1');
  return unescapeHtml(withMath.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
});
