/**
 * Post/page titles are raw frontmatter strings -- Hexo never runs them
 * through the markdown renderer, so backtick-wrapped code (e.g. a title
 * like "... `id()` 函式") shows up as literal backticks everywhere the
 * title is printed: post listings, the post's own <h1>, prev/next nav.
 * This helper renders just that one bit of markdown (inline code spans),
 * HTML-escaping everything else, so titles can safely use `` `code` ``.
 *
 * Not used for the browser <title> tag or meta tags -- those must stay
 * plain text.
 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

hexo.extend.helper.register('title_html', function (title) {
  if (!title) return '';
  return String(title)
    .split(/(`[^`]+`)/g)
    .map(function (part) {
      if (part.length >= 2 && part.charAt(0) === '`' && part.charAt(part.length - 1) === '`') {
        return '<code>' + escapeHtml(part.slice(1, -1)) + '</code>';
      }
      return escapeHtml(part);
    })
    .join('');
});
