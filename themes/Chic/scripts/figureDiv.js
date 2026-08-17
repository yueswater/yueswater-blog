/**
 * Quarto-style figure syntax:
 *
 *   ::: {#fig-elephant}
 *   ![Caption text, can have **markdown**.](images/elephant.png){width=600}
 *   :::
 *
 * compiles to <figure id="fig-elephant"><img ...><figcaption>...</figcaption></figure>,
 * matching the .post-content figure/figcaption styling in caption.css. The
 * alt text doubles as the caption -- no separate caption line needed. An
 * optional paragraph after a blank line still overrides it if present.
 */
hexo.extend.filter.register('before_post_render', function (data) {
  data.content = data.content.replace(
    /^::: *\{#(fig-[\w-]+)\}\n!\[([^\]]*)\]\(([^)\s]+)\)(?:\{([^}]*)\})?\n([\s\S]*?)\n?:::[ \t]*$/gm,
    function (match, id, alt, src, attrs, extraCaption) {
      var extra = '';
      if (attrs) {
        var widthMatch = attrs.match(/width\s*=\s*"?([\w.%]+)"?/);
        if (widthMatch) extra += ' width="' + widthMatch[1] + '"';
      }

      var caption = extraCaption.trim() || alt;
      var captionHtml = hexo.render.renderSync({ text: caption, engine: 'markdown' })
        .replace(/^<p>/, '')
        .replace(/<\/p>\s*$/, '')
        .trim();

      return '<figure id="' + id + '"><img src="' + src + '" alt="' + alt + '"' + extra + '><figcaption>' + captionHtml + '</figcaption></figure>';
    }
  );
  return data;
}, 14);
