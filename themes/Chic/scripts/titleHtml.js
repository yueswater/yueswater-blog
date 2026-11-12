/**
 * Post/page titles are raw frontmatter strings -- Hexo never runs them
 * through the markdown renderer, so backtick-wrapped code (e.g. a title
 * like "... `id()` 函式") shows up as literal backticks everywhere the
 * title is printed: post listings, the post's own <h1>, prev/next nav.
 * title_html renders the two bits of markup a title may use, HTML-escaping
 * everything else:
 *   `code`  -> <code>code</code>
 *   $tex$   -> <span class="title-math" data-plain="tex"><svg ...></span>
 * The formula is typeset here, at build time (lib/texSvg.js), so no page needs
 * MathJax for a title; data-plain is what a copy of the title puts on the
 * clipboard (js/post/title-copy.js).
 *
 * Not used for the browser <title> tag, meta tags or share links -- those
 * must stay plain text, see plain_title.
 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const texSvg = require('./lib/texSvg');

const MATH = /\$([^$]+)\$/g;

hexo.extend.helper.register('title_html', function (title) {
  if (!title) return '';
  return String(title)
    .split(/(`[^`]+`)/g)
    .map(function (part) {
      if (part.length >= 2 && part.charAt(0) === '`' && part.charAt(part.length - 1) === '`') {
        return '<code>' + escapeHtml(part.slice(1, -1)) + '</code>';
      }
      return escapeHtml(part).replace(MATH, function (_, tex) {
        // tex was HTML-escaped with the rest of the title: undo that for MathJax, not for the attribute
        var source = tex.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        return '<span class="title-math" data-plain="' + tex + '">' + texSvg(source) + '</span>';
      });
    })
    .join('');
});

// the title as plain text: no $ around inline math (tab title, link previews, share links)
hexo.extend.helper.register('plain_title', function (title) {
  return title ? String(title).replace(MATH, '$1') : '';
});
