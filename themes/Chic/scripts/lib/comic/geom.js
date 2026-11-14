/**
 * Plain polygon geometry for the comic layouts (scripts/comicDiv.js). Points are [x, y] in canvas units
 * (the canvas is 100 wide and h tall, y grows downward); polygons are arrays of points, convex.
 *
 * Side-effect free CommonJS: Hexo loads every file under scripts/, so nothing here may touch `hexo`.
 */
var EPS = 1e-9;

function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
function cross(u, v) { return u[0] * v[1] - u[1] * v[0]; }

// axis-aligned bounding box {x, y, w, h}
function box(poly) {
  var xs = poly.map(function (p) { return p[0]; });
  var ys = poly.map(function (p) { return p[1]; });
  var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
  var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function signedArea(poly) {
  var s = 0;
  for (var i = 0; i < poly.length; i++) {
    var p = poly[i], q = poly[(i + 1) % poly.length];
    s += p[0] * q[1] - q[0] * p[1];
  }
  return s / 2;
}

function area(poly) { return Math.abs(signedArea(poly)); }

function centroid(poly) {
  var a = signedArea(poly), cx = 0, cy = 0;
  for (var i = 0; i < poly.length; i++) {
    var p = poly[i], q = poly[(i + 1) % poly.length], k = p[0] * q[1] - q[0] * p[1];
    cx += (p[0] + q[0]) * k;
    cy += (p[1] + q[1]) * k;
  }
  return [cx / (6 * a), cy / (6 * a)];
}

function rect(w, h) { return [[0, 0], [w, 0], [w, h], [0, h]]; }

// signed distance of p from the line a->b; positive on the side where cross(b - a, p - a) > 0
function side(a, b, p) {
  var d = sub(b, a);
  return cross(d, sub(p, a)) / Math.hypot(d[0], d[1]);
}

// drop repeated points and points lying on the segment between their neighbours
function clean(poly) {
  var out = poly.filter(function (p, i) {
    var q = poly[(i + poly.length - 1) % poly.length];
    return Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-7;
  });
  return out.filter(function (p, i) {
    var q = out[(i + out.length - 1) % out.length], r = out[(i + 1) % out.length];
    return Math.abs(cross(sub(p, q), sub(r, p))) > 1e-7;
  });
}

// Sutherland-Hodgman: keep the part of poly whose signed distance from line a->b is at least d
function clipHalf(poly, a, b, d) {
  var out = [];
  for (var i = 0; i < poly.length; i++) {
    var p = poly[i], q = poly[(i + 1) % poly.length];
    var sp = side(a, b, p) - d, sq = side(a, b, q) - d;
    if (sp >= -EPS) out.push(p);
    if ((sp > EPS && sq < -EPS) || (sp < -EPS && sq > EPS)) {
      var t = sp / (sp - sq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return clean(out);
}

// does every turn go the same way
function isConvex(poly) {
  var pos = 0, neg = 0;
  for (var i = 0; i < poly.length; i++) {
    var p = poly[i], q = poly[(i + 1) % poly.length], r = poly[(i + 2) % poly.length];
    var c = cross(sub(q, p), sub(r, q));
    if (c > 1e-7) pos++; else if (c < -1e-7) neg++;
  }
  return poly.length >= 3 && (pos === 0 || neg === 0);
}

// area of the overlap of two convex polygons
function intersectArea(p, q) {
  var flip = signedArea(q) < 0, out = p;
  for (var i = 0; i < q.length && out.length; i++) {
    var a = q[i], b = q[(i + 1) % q.length];
    out = flip ? clipHalf(out, b, a, 0) : clipHalf(out, a, b, 0);
  }
  return out.length >= 3 ? area(out) : 0;
}

function segDist(p, a, b) {
  var d = sub(b, a), t = ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / (d[0] * d[0] + d[1] * d[1]);
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + d[0] * t), p[1] - (a[1] + d[1] * t));
}

// smallest distance between two disjoint polygons (the gutter between them)
function distance(p, q) {
  var best = Infinity;
  [[p, q], [q, p]].forEach(function (pair) {
    pair[0].forEach(function (pt) {
      pair[1].forEach(function (b, i) {
        best = Math.min(best, segDist(pt, b, pair[1][(i + 1) % pair[1].length]));
      });
    });
  });
  return best;
}

module.exports = {
  box: box, area: area, centroid: centroid, rect: rect, side: side, clean: clean, clipHalf: clipHalf,
  isConvex: isConvex, intersectArea: intersectArea, distance: distance
};
