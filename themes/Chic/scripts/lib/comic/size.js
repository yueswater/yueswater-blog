/**
 * Suggested art size for one panel, picked from the geometry: the nearest (by aspect ratio) of the three
 * sizes the image generator offers, since the panel image is cropped to the polygon's bounding box with
 * object-fit: cover.
 */
var SIZES = [
  { orient: 'landscape', zh: '橫式', w: 1536, h: 1024 },
  { orient: 'portrait', zh: '直式', w: 1024, h: 1536 },
  { orient: 'square', zh: '方形', w: 1024, h: 1024 }
];

// b is a bounding box {w, h}; returns the size, the aspect, and how much of the image survives the crop
function suggest(b) {
  var aspect = b.w / b.h, best = null, bestDist = Infinity;
  SIZES.forEach(function (s) {
    var d = Math.abs(Math.log(aspect / (s.w / s.h)));
    if (d < bestDist) { bestDist = d; best = s; }
  });
  var r = best.w / best.h;
  return {
    orient: best.orient, zh: best.zh, w: best.w, h: best.h, label: best.w + 'x' + best.h,
    aspect: aspect, keep: Math.min(aspect / r, r / aspect)
  };
}

module.exports = { SIZES: SIZES, suggest: suggest };
