/**
 * A four-panel comic page whose panels are not plain rectangles (slanted dividers, diagonal cuts, ...):
 *
 *   ::: {.comic}                      default layout (slant-grid)
 *   ::: {.comic layout=zigzag}        any layout id listed in lib/comic/index.js
 *   ![alt text of panel 1](images/comic-1.png)
 *   ![alt text of panel 2](images/comic-2.png)
 *   ![alt text of panel 3](images/comic-3.png)
 *   ![alt text of panel 4](images/comic-4.png)
 *   :::
 *
 * The four images are separate files (each with its own background); this filter lays them out in panels
 * cut with clip-path and draws the panel borders as an SVG on top (css/_pages/post/post_comic.styl).
 * Panels are read in order (left to right, top to bottom); each image fills its polygon's bounding box with
 * object-fit cover, so draw it at the aspect the layout suggests for that panel (lib/comic/size.js).
 *
 * Layouts live in lib/comic/: a layout is four convex polygons on a canvas 100 units wide and h tall, built
 * with the cutting helpers in lib/comic/cut.js (uniform gutter, perpendicular to each divider). A layout
 * also sets the page's aspect ratio and max width: tall pages are narrowed so their area stays near the
 * square page's (width = 720px / sqrt(h / 100), at most 720px). An unknown layout id falls back to the
 * default with a build warning. The default layout, when selected, emits the original markup unchanged
 * (no inline style, no data-layout; the stylesheet's square default sizes it); every other layout adds
 * data-layout and an inline aspect-ratio / max-width.
 *
 * Emitted as <section>/<figure> (not <div>): a nested div would end kramed's raw-HTML block early.
 */
var fencedDiv = require('./lib/fencedDiv');
var layouts = require('./lib/comic');
var renderComic = require('./lib/comic/render').renderComic;

var IMAGE_LINE = /^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/;
var LAYOUT_ATTR = /layout=["']?([\w-]+)/;

function pickLayout(attrs) {
  var m = LAYOUT_ATTR.exec(attrs);
  if (!m) return layouts.DEFAULT;
  if (layouts.BY_ID[m[1]]) return layouts.BY_ID[m[1]];
  if (hexo.log && hexo.log.warn) {
    hexo.log.warn('[comic] unknown layout "' + m[1] + '", using "' + layouts.DEFAULT_ID + '" (known: ' + Object.keys(layouts.BY_ID).join(', ') + ')');
  }
  return layouts.DEFAULT;
}

hexo.extend.filter.register('before_post_render', function (data) {
  if (!data.content || data.content.indexOf('{.comic') < 0) return data;
  data.content = fencedDiv.replaceFencedDivs(data.content, '\\.comic(?:[ \\t]+layout=["\']?[\\w-]+["\']?)?', function (attrs, body) {
    var layout = pickLayout(attrs);
    var images = body.split('\n').map(function (l) { return IMAGE_LINE.exec(l.trim()); }).filter(Boolean)
      .map(function (m) { return { alt: m[1], src: m[2] }; });
    if (images.length !== layout.panels.length) return body;
    return '\n\n' + renderComic(layout, images) + '\n\n';
  });
  return data;
});
