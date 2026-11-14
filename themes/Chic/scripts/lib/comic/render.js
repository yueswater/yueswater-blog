/**
 * HTML for one comic page: a <section> holding four clip-pathed <figure>/<img> panels and the frame SVG.
 * Geometry is stored in canvas units (100 wide, h tall) and converted to percent of the section here, so the
 * page scales with the column at any aspect ratio.
 *
 * A `legacy` layout emits the markup the original single layout produced (no data-layout, no inline style; the
 * stylesheet's square default sizes it), so posts written before layouts existed render byte-identically.
 */
var geom = require('./geom');

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function num(n) { return Math.round(n * 1000) / 1000; }
function pct(n) { return (Math.round(n * 100) / 100) + '%'; }

// images: [{ alt, src }, ...] in panel order
function renderComic(layout, images) {
  var h = layout.h, legacy = layout.legacy;
  var polys = layout.panels.map(function (poly) {
    return poly.map(function (p) { return [p[0], p[1] / h * 100]; });   // canvas units -> percent
  });
  var html = legacy
    ? '<section class="comic">'
    : '<section class="comic" data-layout="' + layout.id + '" style="aspect-ratio:100/' + (Math.round(h * 100) / 100) +
      ';max-width:' + layout.maxWidth + 'px">';
  images.forEach(function (img, i) {
    var poly = polys[i], b = geom.box(poly);
    var clip = poly.map(function (p) { return pct(p[0]) + ' ' + pct(p[1]); }).join(', ');
    html += '<figure class="comic-panel" style="clip-path:polygon(' + clip + ')">' +
      '<img src="' + escapeAttr(img.src) + '" alt="' + escapeAttr(img.alt) + '" loading="lazy" ' +
      'style="object-position:' + layout.focus[i] + ';left:' + pct(b.x) + ';top:' + pct(b.y) + ';width:' + pct(b.w) + ';height:' + pct(b.h) + '"></figure>';
  });
  html += '<svg class="comic-frame" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">';
  polys.forEach(function (poly) {
    html += '<polygon points="' + poly.map(function (p) { return num(p[0]) + ',' + num(p[1]); }).join(' ') + '"/>';
  });
  return html + '</svg></section>';
}

module.exports = { renderComic: renderComic };
