/**
 * Authoring helpers: build panels by cutting a canvas (or any convex polygon) with lines that leave a
 * uniform gutter, measured perpendicular to the line (so a slanted divider keeps the same visual gap as
 * a straight one). A layout is a few of these calls.
 *
 *   cut(poly, a, b)          split by the line through a and b           -> [side where cross > 0, other side]
 *   vcut(poly, top, bottom)  near-vertical divider, x at the polygon's top / bottom -> [left, right]
 *   hcut(poly, left, right)  near-horizontal divider, y at its left / right         -> [top, bottom]
 *   vsplitW / hsplitW        n-way split by weights (a divider is a number or a [top, bottom] / [left, right] pair)
 *   cell(poly, ref, lines)   the part of poly on ref's side of every line (for diagonal / pinwheel pieces)
 */
var geom = require('./geom');

var GUTTER = 1.6;

function cut(poly, a, b, g) {
  var half = (g == null ? GUTTER : g) / 2;
  return [geom.clipHalf(poly, a, b, half), geom.clipHalf(poly, b, a, half)];
}

function vcut(poly, top, bottom, g) {
  var b = geom.box(poly);
  return cut(poly, [top, b.y], [bottom, b.y + b.h], g);
}

function hcut(poly, left, right, g) {
  var b = geom.box(poly);
  return cut(poly, [b.x + b.w, right], [b.x, left], g);
}

function pair(v) { return Array.isArray(v) ? v : [v, v]; }

// split by successive dividers: out[0] is the first piece, the rest continues
function splitBy(poly, dividers, cutter, g) {
  var out = [], rest = poly;
  dividers.forEach(function (v) {
    var d = pair(v), r = cutter(rest, d[0], d[1], g);
    out.push(r[0]);
    rest = r[1];
  });
  out.push(rest);
  return out;
}

function vsplit(poly, xs, g) { return splitBy(poly, xs, vcut, g); }
function hsplit(poly, ys, g) { return splitBy(poly, ys, hcut, g); }

// dividers at the cumulative share of the polygon's width / height, e.g. [38, 62] -> 38% | 62%
function shares(weights, start, size) {
  var total = weights.reduce(function (s, w) { return s + w; }, 0), acc = 0;
  return weights.slice(0, -1).map(function (w) { acc += w; return start + size * acc / total; });
}

function vsplitW(poly, weights, g) {
  var b = geom.box(poly);
  return vsplit(poly, shares(weights, b.x, b.w), g);
}

function hsplitW(poly, weights, g) {
  var b = geom.box(poly);
  return hsplit(poly, shares(weights, b.y, b.h), g);
}

// the piece of poly on the same side as ref of each line [a, b], backed off by half a gutter
function cell(poly, ref, lines, g) {
  var half = (g == null ? GUTTER : g) / 2;
  return lines.reduce(function (p, l) {
    return geom.side(l[0], l[1], ref) >= 0 ? geom.clipHalf(p, l[0], l[1], half) : geom.clipHalf(p, l[1], l[0], half);
  }, poly);
}

module.exports = {
  GUTTER: GUTTER, cut: cut, vcut: vcut, hcut: hcut, vsplit: vsplit, hsplit: hsplit,
  vsplitW: vsplitW, hsplitW: hsplitW, cell: cell
};
