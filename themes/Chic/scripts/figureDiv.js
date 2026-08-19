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
 *
 * The outer `::: {...} ... :::` fence is parsed by the shared lib/fencedDiv
 * helper (also used by problemDiv.js); this file only parses what goes
 * inside a figure block specifically.
 */
var fencedDiv = require('./lib/fencedDiv');

var FIG_ATTRS_PATTERN = '#fig-[\\w-]+';
var IMAGE_RE = /^!\[([^\]]*)\]\(([^)\s]+)\)(?:\{([^}]*)\})?\n?([\s\S]*)$/;

hexo.extend.filter.register('before_post_render', function (data) {
  var word = data.lang === 'en' ? 'Fig' : '圖';
  var sep = data.lang === 'en' ? ': ' : '：';

  var numbers = {};
  var count = 0;
  fencedDiv.findFencedDivs(data.content, FIG_ATTRS_PATTERN).forEach(function (block) {
    var id = block.attrs.replace(/^#/, '');
    count += 1;
    numbers[id] = count;
  });

  data.content = fencedDiv.replaceFencedDivs(data.content, FIG_ATTRS_PATTERN, function (rawAttrs, body) {
    var id = rawAttrs.replace(/^#/, '');
    var imageMatch = body.match(IMAGE_RE);
    if (!imageMatch) return body;

    var alt = imageMatch[1];
    var src = imageMatch[2];
    var attrs = imageMatch[3];
    var extraCaption = imageMatch[4] || '';

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
