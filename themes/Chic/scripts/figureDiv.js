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
 *
 * Figures are auto-numbered in document order per post ("圖 1", "圖 2", ...
 * or "Fig 1", "Fig 2", ... for lang: en posts) and prepended to the caption.
 * Writing "@fig-elephant" anywhere else in the same post's body resolves to
 * a markdown link to that figure showing its number, e.g. "[圖 1](#fig-elephant)"
 * -- mirroring the @label reference syntax Typst uses (see the Typst
 * series' day04 post).
 */
hexo.extend.filter.register('before_post_render', function (data) {
  var word = data.lang === 'en' ? 'Fig' : '圖';
  var sep = data.lang === 'en' ? ': ' : '：';

  var figureRe = /^::: *\{#(fig-[\w-]+)\}\n!\[([^\]]*)\]\(([^)\s]+)\)(?:\{([^}]*)\})?\n([\s\S]*?)\n?:::[ \t]*$/gm;

  var numbers = {};
  var count = 0;
  var scanRe = new RegExp(figureRe.source, figureRe.flags);
  var match;
  while ((match = scanRe.exec(data.content)) !== null) {
    count += 1;
    numbers[match[1]] = count;
  }

  data.content = data.content.replace(figureRe, function (match, id, alt, src, attrs, extraCaption) {
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

    var label = word + ' ' + numbers[id] + sep;
    return '<figure id="' + id + '"><img src="' + src + '" alt="' + alt + '"' + extra + '><figcaption>' + label + captionHtml + '</figcaption></figure>';
  });

  data.content = data.content.replace(/(?<![\w@])@(fig-[\w-]+)/g, function (match, id) {
    if (!numbers[id]) return match;
    return '[' + word + ' ' + numbers[id] + '](#' + id + ')';
  });

  return data;
}, 14);
