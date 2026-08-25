/**
 * Photo carousel, in two forms.
 *
 * With per-photo captions, as a fenced block -- one list item per photo, in
 * the same order as the files:
 *
 *   :::gallery {source="day02/新加坡國立大學"}
 *   - 第一張照片說明文字
 *   - 第二張照片說明文字
 *   :::
 *
 * Or without captions, as a tag:
 *
 *   {% gallery day01/蘇丹回教堂 %}
 *
 * `source` is a path under the post's own images/ folder used as a filename
 * prefix: every image matching `<prefix>-NN.<ext>` in that folder is
 * collected and sorted by name, so the -01, -02 numbering is the display
 * order. Captions line up with that order; a photo past the end of the list
 * (or with an empty item) simply shows no caption.
 *
 * The files on disk are the source of truth -- adding a photo to the folder
 * is enough, no front-matter `photos:` list to keep in sync.
 *
 * Everything is rendered server-side, dots and captions included, so the
 * markup is complete before source/js/gallery.js wires up the paging; with
 * JS off the first photo still shows. Paths are relative to the post
 * ("images/day01/foo.jpg"), matching figureDiv.js -- indexImages.js copies
 * the images/ tree to each language's post URL.
 */
var fs = require('fs');
var pathFn = require('path');

var IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif)$/i;
var GALLERY_BLOCK = /^:::gallery[ \t]*\{([^}]*)\}[ \t]*\n([\s\S]*?)\n?:::[ \t]*$/gm;

var ICONS = {
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4 7 12l8 8"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8"/></svg>',
  expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>'
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function render(postSource, spec, captions) {
  spec = (spec || '').trim();
  if (!spec || !postSource) return '';
  captions = captions || [];

  var relDir = pathFn.dirname(spec);           // "day01", or "." when unnested
  var prefix = pathFn.basename(spec);          // "蘇丹回教堂"
  var imagesDir = pathFn.join(pathFn.dirname(postSource), 'images', relDir);
  if (!fs.existsSync(imagesDir)) {
    hexo.log.warn('gallery: no such folder ' + imagesDir);
    return '';
  }

  var files = fs.readdirSync(imagesDir)
    .filter(function (f) {
      return IMAGE_EXT.test(f) && f.indexOf(prefix + '-') === 0;
    })
    .sort();

  if (!files.length) {
    hexo.log.warn('gallery: nothing matches ' + spec + '-* in ' + imagesDir);
    return '';
  }

  if (captions.length > files.length) {
    hexo.log.warn('gallery: ' + spec + ' has ' + captions.length +
                  ' captions for ' + files.length + ' photos');
  }

  var urlBase = 'images/' + (relDir === '.' ? '' : relDir + '/');

  var slides = files.map(function (file, i) {
    var src = encodeURI(urlBase + file);
    var alt = captions[i] || (prefix + ' ' + (i + 1));
    // only the first photo of each carousel is worth loading eagerly
    var loading = i === 0 ? 'eager' : 'lazy';
    return '<li class="gallery-slide"' + (i === 0 ? ' data-active="true"' : '') + '>' +
           '<img src="' + src + '" alt="' + escapeHtml(alt) + '" loading="' + loading + '">' +
           '</li>';
  }).join('');

  // one caption element per photo, not a single line rewritten by JS, so
  // every photo carries its own text in the markup
  var captionEls = files.map(function (file, i) {
    return '<p class="gallery-caption"' + (i === 0 ? ' data-active="true"' : '') + '>' +
           escapeHtml(captions[i] || '') + '</p>';
  }).join('');

  var dots = files.map(function (file, i) {
    return '<button type="button" class="gallery-dot' + (i === 0 ? ' is-active' : '') +
           '" data-gallery-index="' + i + '" aria-label="' + (i + 1) + '"></button>';
  }).join('');

  var single = files.length < 2;

  return '<figure class="gallery' + (single ? ' is-single' : '') + '">' +
         '<div class="gallery-viewport">' +
         '<ul class="gallery-track">' + slides + '</ul>' +
         '<button type="button" class="gallery-nav gallery-prev" aria-label="Previous">' + ICONS.prev + '</button>' +
         '<button type="button" class="gallery-nav gallery-next" aria-label="Next">' + ICONS.next + '</button>' +
         '<button type="button" class="gallery-fullscreen" aria-label="Fullscreen">' + ICONS.expand + '</button>' +
         '<div class="gallery-dots">' + dots + '</div>' +
         '</div>' +
         '<figcaption class="gallery-captions">' + captionEls + '</figcaption>' +
         '</figure>';
}

hexo.extend.tag.register('gallery', function (args) {
  return render(this.full_source, args[0]);
});

hexo.extend.filter.register('before_post_render', function (data) {
  if (!data.content || data.content.indexOf(':::gallery') === -1) return data;

  data.content = data.content.replace(GALLERY_BLOCK, function (full, attrs, body) {
    var match = attrs.match(/source\s*=\s*"([^"]*)"/) || attrs.match(/source\s*=\s*'([^']*)'/);
    if (!match) {
      hexo.log.warn('gallery: block without a source="..." attribute');
      return full;
    }

    // one "- " list item per photo, in file order; a bare "-" means no caption
    var captions = body.split('\n')
      .map(function (line) { return line.match(/^[ \t]*[-*][ \t]*(.*)$/); })
      .filter(Boolean)
      .map(function (m) { return m[1].trim(); });

    return render(data.full_source, match[1], captions);
  });

  return data;
}, 14);
