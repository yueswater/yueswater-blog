/**
 * kramed (unlike kramdown) doesn't recurse into markdown inside a raw
 * HTML block -- it just passes the div through verbatim. That breaks
 * **bold**, $...$ math, code fences, etc. inside hexo-admonition-new's
 * `.admonition-content` div, inside `.tabset-panel` divs and inside the exercise
 * blocks' `.q-md` divs (see exercises.js) (this
 * theme's tab widget, see tabset.css/js). Fix: render each such div's
 * inner markdown ourselves (priority 15, after hexo-admonition-new's
 * default-10 filter), so what lands in the div is already real HTML.
 */
hexo.extend.filter.register('before_post_render', function (data) {
  data.content = data.content.replace(
    /(<div class="[^"]*\b(?:admonition-content|tabset-panel|q-md)\b[^"]*"[^>]*>\n\n)([\s\S]*?)(\n\n<\/div>)/g,
    function (match, open, markdown, close) {
      var html = hexo.render.renderSync({ text: markdown, engine: 'markdown' });
      // The renderer wraps tables in <div class="table-container">. A nested div ends
      // kramed's raw-HTML block one </div> early, and the callout's own closing tags
      // then come out as escaped text and swallow the rest of the page. A <section>
      // with the same class keeps the wrapper without being a div.
      html = html.replace(/<div class="table-container">([\s\S]*?)<\/div>/g, '<section class="table-container">$1</section>');
      return open + html.trim() + close;
    }
  );
  return data;
}, 15);
