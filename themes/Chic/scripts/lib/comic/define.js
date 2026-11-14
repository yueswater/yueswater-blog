/**
 * defineLayout(spec): turn a layout recipe into the finished layout object the renderer and the preview use.
 *
 *   spec = {
 *     id: 'zigzag',          // kebab slug, what a post writes in `layout=`
 *     name: '鋸齒斜帶',        // zh-TW, short
 *     family: '...',          // group heading in the preview
 *     desc: '...',            // one line
 *     h: 150,                 // canvas height in units (the width is always 100)
 *     build: function (canvas) { return [p1, p2, p3, p4]; },   // or `panels: [...]` literal polygons
 *     legacy: true,           // optional: emit the pre-layout markup (only the default layout uses it)
 *     focus: [...]            // optional object-position per panel (default: portrait art keeps its top)
 *   }
 *
 * Panels are four convex polygons [[x, y], ...] in reading order (left to right, top to bottom).
 */
var geom = require('./geom');
var size = require('./size');

var BASE_WIDTH = 720;   // px: max width of a square page, also the cap for wide pages
var ROUND = 1e4;

function snap(poly) {
  return poly.map(function (p) { return [Math.round(p[0] * ROUND) / ROUND, Math.round(p[1] * ROUND) / ROUND]; });
}

function gcd(a, b) { return b ? gcd(b, a % b) : a; }

// 100 x h as the smallest whole-number ratio within 0.5%, e.g. 125 -> "4:5", 100 * 16 / 9 -> "9:16"
function ratioLabel(h) {
  var r = h / 100;
  for (var den = 1; den <= 20; den++) {
    var num = Math.round(r * den);
    if (num > 0 && Math.abs(num / den - r) / r < 0.005) {
      var g = gcd(den, num);
      return (den / g) + ':' + (num / g);
    }
  }
  return '100:' + (Math.round(h * 10) / 10);
}

// tall pages are narrowed so their area stays near the square page's: width = 720 / sqrt(h / 100)
function maxWidth(h) {
  return Math.round(BASE_WIDTH / Math.sqrt(Math.max(1, h / 100)));
}

function defineLayout(spec) {
  var h = spec.h, canvas = geom.rect(100, h);
  var panels = (spec.panels || spec.build(canvas)).map(snap);
  if (panels.length !== 4) throw new Error('layout ' + spec.id + ': needs exactly 4 panels, got ' + panels.length);
  var info = panels.map(function (poly) {
    var b = geom.box(poly);
    return { box: b, size: size.suggest(b), fill: geom.area(poly) / (b.w * b.h) };
  });
  return {
    id: spec.id, name: spec.name, family: spec.family, desc: spec.desc,
    legacy: !!spec.legacy,
    w: 100, h: h, ratio: ratioLabel(h), maxWidth: maxWidth(h),
    panels: panels, info: info,
    focus: spec.focus || info.map(function (i) { return i.size.orient === 'portrait' ? '50% 12%' : '50% 50%'; })
  };
}

module.exports = { defineLayout: defineLayout, ratioLabel: ratioLabel, maxWidth: maxWidth, BASE_WIDTH: BASE_WIDTH };
