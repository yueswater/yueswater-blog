/**
 * kramed (unlike kramdown) doesn't recurse into markdown inside a raw
 * HTML block -- it just passes the div through verbatim. That breaks
 * **bold**, $...$ math, code fences, etc. inside hexo-admonition-new's
 * `.admonition-content` div and inside `.tabset-panel` divs (this
 * theme's tab widget, see tabset.css/js). Fix: render each such div's
 * inner markdown ourselves (priority 15, after hexo-admonition-new's
 * default-10 filter), so what lands in the div is already real HTML.
 */
hexo.extend.filter.register('before_post_render', function (data) {
  data.content = data.content.replace(
    /(<div class="[^"]*\b(?:admonition-content|tabset-panel)\b[^"]*"[^>]*>\n\n)([\s\S]*?)(\n\n<\/div>)/g,
    function (match, open, markdown, close) {
      var html = hexo.render.renderSync({ text: markdown, engine: 'markdown' });
      return open + html.trim() + close;
    }
  );
  return data;
}, 15);
