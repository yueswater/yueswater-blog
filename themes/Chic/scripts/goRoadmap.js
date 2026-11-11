/**
 * Go series roadmap, drawn as a gopher's burrow (an underground cross-section).
 *
 *   {% go_roadmap 圖說文字 %}     (the text after the tag name becomes the figcaption)
 *
 * The route lives in source/_data/go-roadmap.yml: three stages, each a list of chambers
 * (one chamber = one post of the series). A chamber lights up and becomes a link as soon as a
 * post whose front-matter `permalink` equals its `slug` exists under source/_posts, so finishing
 * a post is all it takes: no need to touch this chart again. A chamber without a post yet stays
 * dark and dashed. The chamber of the post the tag is used in is not a link (you are already there).
 *
 * Everything is rendered at build time as one inline SVG (no JS). The burrow is hand-wobbled on
 * purpose: chambers are blobs and tunnels vary in width and bend, all from a seeded random
 * generator so a rebuild draws exactly the same cave. Gopher sprites are
 * /images/go-roadmap/NN-name.webp; the gopher design is Renée French's (CC BY 4.0), the poses
 * were redrawn from it, so the post carries the credit in its figure caption.
 */
var fs = require('fs');
var pathFn = require('path');
var yaml = require('js-yaml');

// viewBox is as wide as the article column (~560 units shown at ~700 px), so text lands near body size
var W = 560, K = 0.085;
var STEP = 64, TOP = 290;
var XL = 190, XM = 280, XR = 370;
var RX = 118, RY = 23;

// trimmed size of each sprite on its original 1024 px canvas
var SPRITE = {
  '01-wave': [780, 930], '02-peek': [719, 713], '03-dig': [765, 914], '04-lamp': [639, 965],
  '05-read': [596, 916], '06-type': [651, 939], '07-map': [607, 928], '08-cart': [848, 662],
  '09-box': [602, 924], '10-think': [494, 963], '11-sleep': [896, 662], '12-cheer': [673, 927]
};

var goRoadmapCount = 0;
var CSS = '.go-roadmap{margin:1.5em 0}' +
  '.go-roadmap svg{display:block;width:100%;height:auto;font-family:inherit}' +
  '.go-roadmap{--sky:#dff1fb;--g-back:#3d8f46;--g-mid:#5fb55a;--g-front:#86cf6a;--s1:#e3c9a3;--s2:#cfa57a;--s3:#b98d63;--s4:#9c7350;--label-deep:#fff3de;--label-mid:#4a3020;--tunnel:#4a3424;--cave:#4a3424;--cave-line:#8b6a4a;--dim:#e2cfb3;--label:#6b4a2e;--lit:#ffe9b0;--lit-line:#e0a526;--lit-ink:#3a2a12}' +
  '.dark-theme .go-roadmap{--sky:#13263f;--g-back:#1d5328;--g-mid:#2f7a3a;--g-front:#44a04c;--s1:#5a4330;--s2:#4a3626;--s3:#3b2b1e;--s4:#2e2017;--label-deep:#c9a77c;--label-mid:#c9a77c;--tunnel:#150e09;--cave:#1c130d;--cave-line:#7a5d43;--dim:#dcc8a8;--label:#c9a77c;--lit:#ffe2a0;--lit-line:#f0b73a;--lit-ink:#3a2a12}' +
  '.go-roadmap .sky{fill:var(--sky)}.go-roadmap .g-back{fill:var(--g-back)}.go-roadmap .g-mid{fill:var(--g-mid)}.go-roadmap .g-front{fill:var(--g-front)}' +
  '.go-roadmap .stem{fill:none;stroke:var(--g-back);stroke-width:1.2;stroke-linecap:round}.go-roadmap .fl-a{fill:#fff}.go-roadmap .fl-b{fill:#ffd54a}.go-roadmap .fl-c{fill:#ff9cc2}' +
  '.go-roadmap .l1{fill:var(--s1)}.go-roadmap .l2{fill:var(--s2)}.go-roadmap .l3{fill:var(--s3)}.go-roadmap .l4{fill:var(--s4)}' +
  '.go-roadmap .stage.d0,.go-roadmap .stage.d1,.go-roadmap .stage.d2{fill:var(--label-mid)}.go-roadmap .stage.d3{fill:var(--label-deep)}' +
  '.go-roadmap .gr-frame{overflow:hidden}.go-roadmap.pl .gr-frame{position:sticky;z-index:1}' +
  '.go-roadmap .pebble{fill:var(--label-mid);fill-opacity:.2}.go-roadmap .speck{fill:var(--tunnel);fill-opacity:.22}' +
  '.go-roadmap .tunnel{fill:var(--tunnel)}' +
  '.go-roadmap .cave{fill:var(--cave);stroke:var(--cave-line);stroke-width:2;stroke-dasharray:5 4;stroke-linejoin:round}' +
  '.go-roadmap .cave-t{fill:var(--dim);font-size:14px}' +
  '.go-roadmap .on .cave{fill:var(--lit);stroke:var(--lit-line);stroke-width:2.5;stroke-dasharray:none}' +
  '.go-roadmap .on .cave-t{fill:var(--lit-ink)}' +
  '.go-roadmap a{cursor:pointer}.go-roadmap a:hover .cave,.go-roadmap a:focus-visible .cave{stroke-width:4;filter:brightness(1.06)}' +
  '.go-roadmap a:focus-visible{outline:none}' +
  '.go-roadmap .stage{fill:var(--label);font-size:15px;letter-spacing:.1em}' +
  '.go-roadmap .note{fill:var(--label);font-size:14px}' +
  '.go-roadmap .edge{fill:none;stroke:var(--label);stroke-opacity:.3;stroke-width:1.5}' +
  '';

function esc(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function norm(slug) {
  return String(slug || '').replace(/^\/+/, '').replace(/\/?$/, '/');
}
function f(n) { return (+n).toFixed(1); }

// seeded random numbers, so every build draws the same burrow
function rng(seed) {
  var a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// smooth closed curve through points (Catmull-Rom -> cubic Beziers)
function closedPath(P) {
  var n = P.length, d = 'M' + f(P[0][0]) + ' ' + f(P[0][1]);
  for (var i = 0; i < n; i++) {
    var p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    d += 'C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
      f(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
  }
  return d + 'Z';
}
// smooth open curve, returned as the segments after the first point (for joining paths)
function openSegs(P) {
  var n = P.length, d = '';
  for (var i = 0; i < n - 1; i++) {
    var p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n - 1, i + 2)];
    d += 'C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
      f(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
  }
  return d;
}

// a cave chamber: a lumpy blob. Radius = 1 + three low-frequency waves + per-point noise, so the outline has
// real bumps and dents; vertical lumps are stronger because the chamber is flat. Kept above 80% of the
// ellipse in x so the title and number always stay inside.
function blob(cx, cy, rx, ry, seed) {
  var r = rng(seed), n = 22, P = [];
  var ax = [0.07 + r() * 0.04, 0.05 + r() * 0.05, 0.03 + r() * 0.04], px = [r() * 6.3, r() * 6.3, r() * 6.3];
  var ay = [0.16 + r() * 0.08, 0.14 + r() * 0.1, 0.1 + r() * 0.08], py = [r() * 6.3, r() * 6.3, r() * 6.3];
  for (var i = 0; i < n; i++) {
    var t = (i / n) * 6.2832;
    var kx = 1 + ax[0] * Math.sin(t + px[0]) + ax[1] * Math.sin(2 * t + px[1]) + ax[2] * Math.sin(3 * t + px[2]) + (r() - 0.5) * 0.1;
    var ky = 1 + ay[0] * Math.sin(t + py[0]) + ay[1] * Math.sin(2 * t + py[1]) + ay[2] * Math.sin(3 * t + py[2]) + (r() - 0.5) * 0.26;
    P.push([cx + rx * Math.max(0.82, kx) * Math.cos(t), cy + ry * Math.max(0.72, ky) * Math.sin(t)]);
  }
  var xs = P.map(function (q) { return q[0]; }), ys = P.map(function (q) { return q[1]; });
  return {
    d: closedPath(P),
    mx: (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2,
    my: (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2
  };
}

// a tunnel: a ribbon along the cubic segments whose width and sideways position keep changing
function ribbon(segs, seed) {
  var r = rng(seed), ph1 = r() * 6, ph2 = r() * 6, ph3 = r() * 6;
  var pts = [];
  segs.forEach(function (s) {
    for (var i = 0; i < 24; i++) {
      var t = i / 24, u = 1 - t;
      pts.push([
        u * u * u * s[0][0] + 3 * u * u * t * s[1][0] + 3 * u * t * t * s[2][0] + t * t * t * s[3][0],
        u * u * u * s[0][1] + 3 * u * u * t * s[1][1] + 3 * u * t * t * s[2][1] + t * t * t * s[3][1]
      ]);
    }
  });
  var end = segs[segs.length - 1][3];
  pts.push([end[0], end[1]]);
  var L = [], R = [], len = 0;
  for (var i = 0; i < pts.length; i += 3) {
    var a = pts[Math.max(0, i - 2)], b = pts[Math.min(pts.length - 1, i + 2)];
    var dx = b[0] - a[0], dy = b[1] - a[1], m = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = -dy / m, ny = dx / m;
    if (i) { var q = pts[i - 3]; len += Math.hypot(pts[i][0] - q[0], pts[i][1] - q[1]); }
    var hw = 8 + 3 * Math.sin(len * 0.05 + ph1) + 1.8 * Math.sin(len * 0.13 + ph2) + (r() - 0.5) * 1.2;
    var sh = 3.2 * Math.sin(len * 0.028 + ph3);
    var cx = pts[i][0] + nx * sh, cy = pts[i][1] + ny * sh;
    L.push([cx + nx * hw, cy + ny * hw]);
    R.push([cx - nx * hw, cy - ny * hw]);
  }
  R.reverse();
  return 'M' + f(L[0][0]) + ' ' + f(L[0][1]) + openSegs(L) + 'L' + f(R[0][0]) + ' ' + f(R[0][1]) + openSegs(R) + 'Z';
}

// a wobbly horizontal line between two soil layers
function edgePoints(y, seed) {
  var r = rng(seed), P = [], x = -10;
  while (x < W + 40) { P.push([x, y + (r() - 0.5) * 9]); x += 26 + r() * 28; }
  return P;
}

// grass blades along y0: thin curved triangles of random height, width and lean, as one path per layer
function blades(seed, y0, hMin, hMax, step, lean, skipFrom, skipTo) {
  var r = rng(seed), d = '', x = -6;
  while (x < W + 6) {
    var w = 3 + r() * 4, h = hMin + r() * (hMax - hMin), l = (r() - 0.5) * lean * 2;
    if (x > skipFrom && x < skipTo) { x += step * (0.6 + r() * 0.8); continue; }
    d += 'M' + f(x) + ' ' + f(y0) + 'Q' + f(x + w * 0.2) + ' ' + f(y0 - h * 0.6) + ' ' + f(x + w / 2 + l) + ' ' + f(y0 - h) +
      'Q' + f(x + w * 0.8) + ' ' + f(y0 - h * 0.5) + ' ' + f(x + w) + ' ' + f(y0) + 'Z';
    x += step * (0.6 + r() * 0.8);
  }
  return d;
}
function flowers(seed, y0) {
  var r = rng(seed), out = '';
  for (var i = 0; i < 9; i++) {
    var x = 20 + r() * (W - 40), h = 14 + r() * 8, c = ['fl-a', 'fl-b', 'fl-c'][Math.floor(r() * 3)];
    out += '<path class="stem" d="M' + f(x) + ' ' + f(y0) + 'q' + f((r() - 0.5) * 4) + ' ' + f(-h / 2) + ' ' + f((r() - 0.5) * 3) + ' ' + f(-h) + '"/>' +
      '<circle class="' + c + '" cx="' + f(x) + '" cy="' + f(y0 - h - 1) + '" r="2.6"/>';
  }
  return out;
}

// permalinks of every post on disk (the model may not hold all posts yet while one is rendering)
function publishedPermalinks(dir) {
  var found = {};
  (function walk(d) {
    fs.readdirSync(d, { withFileTypes: true }).forEach(function (e) {
      var p = pathFn.join(d, e.name);
      if (e.isDirectory()) return walk(p);
      if (!/\.md$/.test(e.name)) return;
      var head = fs.readFileSync(p, 'utf8').split(/\n---\s*\n/)[0];
      var m = head.match(/^permalink:\s*['"]?([^'"\n]+?)['"]?\s*$/m);
      if (m && !/^draft:\s*true/m.test(head) && !/^published:\s*false/m.test(head)) found[norm(m[1].trim())] = true;
    });
  })(dir);
  return found;
}


var SCRIPT = [
  "(function(){var fig=document.currentScript.parentNode;",
  "if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;",
  "var svg=fig.querySelector('svg'),frame=fig.querySelector('.gr-frame'),track=fig.querySelector('.gr-track'),",
  "W=+fig.dataset.w,H=+fig.dataset.h,gs=[].slice.call(svg.querySelectorAll('[data-sp]')),TOP=88,fh=0,sc=1,range=0,raf=0;",
  "function layout(){var cw=track.clientWidth;sc=cw/W;fh=Math.max(360,Math.min(640,innerHeight-TOP-24));",
  "var fu=fh/sc;range=Math.max(0,H-fu);frame.style.height=fh+'px';frame.style.top=TOP+'px';",
  "svg.setAttribute('viewBox','0 0 '+W+' '+fu.toFixed(1));track.style.height=(range*sc+fh)+'px';",
  "fig.classList.add('pl');update()}",
  "function update(){raf=0;var r=track.getBoundingClientRect(),span=r.height-fh,",
  "p=span>0?Math.min(1,Math.max(0,(TOP-r.top)/span)):0,o=p*range;",
  "gs.forEach(function(g){g.setAttribute('transform','translate(0 '+(-g.dataset.sp*o).toFixed(1)+')')})}",
  "function tick(){if(!raf)raf=requestAnimationFrame(update)}",
  "addEventListener('scroll',tick,{passive:true});addEventListener('resize',layout);layout()})()"
].join('');

function sprite(name, cx, bottom) {
  var s = SPRITE[name], w = s[0] * K, h = s[1] * K;
  return '<image href="/images/go-roadmap/' + name + '.webp" x="' + f(cx - w / 2) + '" y="' + f(bottom - h) +
    '" width="' + f(w) + '" height="' + f(h) + '"/>';
}

// Hexo caches a post's rendered content, so a chart drawn inside the tag would go stale when another post
// is added (the series post itself is untouched). The tag therefore only leaves a placeholder; the chart is
// drawn by the after_render:html filter below, which runs on every page render.
hexo.extend.tag.register('go_roadmap', function (args) {
  var caption = (args || []).join(' ').trim();
  return '<figure data-go-roadmap="' + Buffer.from(caption, 'utf8').toString('base64') + '"></figure>';
});

hexo.extend.filter.register('after_render:html', function (html, locals) {
  if (typeof html !== 'string' || html.indexOf('data-go-roadmap') === -1) return html;
  var page = (locals && locals.page) || {};
  return html.replace(/<figure data-go-roadmap="([^"]*)"><\/figure>/g, function (m, b64) {
    return buildRoadmap(Buffer.from(b64, 'base64').toString('utf8'), page.lang === 'en', norm(page.path));
  });
});

function buildRoadmap(caption, en, here) {
  // footnote markers written in the caption ([^label], already renumbered to [^N] by footnoteNumbers.js)
  // never reach the Markdown renderer, so emit the same markup it produces for a reference
  caption = caption.replace(/\[\^(\d+)\]/g, '<sup><a href="#fn_$1" id="reffn_$1">$1</a></sup>');
  var cfg = yaml.load(fs.readFileSync(pathFn.join(hexo.source_dir, '_data', 'go-roadmap.yml'), 'utf8'));
  var live = publishedPermalinks(pathFn.join(hexo.source_dir, '_posts'));
  var T = function (o) { return (en && o.title_en) || o.title; };

  // flat list of chambers: the entrance first, then the stages in order
  var items = [{ node: cfg.entrance, x: XM, y: 214 }];
  var stageTop = [];
  var idx0 = 0;
  cfg.stages.forEach(function (st) {
    stageTop.push(TOP + idx0 * STEP - STEP / 2);
    st.nodes.forEach(function (n) {
      items.push({ node: n, x: idx0 % 2 === 0 ? XL : XR, y: TOP + idx0 * STEP, n: idx0 + 1 });
      idx0++;
    });
  });
  var last = items[items.length - 1].y;
  var H = last + 215;

  var out = [];
  var nStages = cfg.stages.length;
  var uid = ++goRoadmapCount;

  // layer 1: the ground that scrolls with the page window: sky, soil layers (one per stage, each darker,
  // with a ragged top edge), grass and the stage names
  var edges = [];
  for (var si = 1; si < nStages; si++) edges.push(edgePoints(stageTop[si], 11 + 12 * si));
  var layer = function (cls, pts) {
    return '<path class="' + cls + '" d="M' + f(pts[0][0]) + ' ' + f(pts[0][1]) + openSegs(pts) + 'L' + (W + 40) + ' ' + H + 'L-10 ' + H + 'Z"/>';
  };
  out.push('<g data-sp="1">');
  out.push('<rect class="sky" width="' + W + '" height="140"/>');
  out.push('<rect class="l1" y="136" width="' + W + '" height="' + (H - 136) + '"/>');
  edges.forEach(function (pts, i) { out.push(layer('l' + (i + 2), pts)); });
  edges.forEach(function (pts) { out.push('<path class="edge" d="M' + f(pts[0][0]) + ' ' + f(pts[0][1]) + openSegs(pts) + '"/>'); });
  var gp = edgePoints(142, 31);
  out.push('<path class="g-mid" d="M' + f(gp[0][0]) + ' ' + f(gp[0][1]) + openSegs(gp) + 'L' + (W + 40) + ' 128L-10 128Z"/>');
  out.push('<path class="g-back" d="' + blades(41, 133, 11, 24, 5, 4) + '"/>');
  out.push(flowers(5, 133));
  out.push('<path class="g-mid" d="' + blades(43, 135, 8, 17, 5.5, 4) + '"/>');
  cfg.stages.forEach(function (st, si) {
    out.push('<text class="stage d' + si + '" x="14" y="' + (si === 0 ? 172 : stageTop[si] + 26) + '">' + esc(T(st)) + '</text>');
  });
  out.push('</g>');

  // layer 2 (far): small pebbles that move slower than the ground, so the soil has depth. They sit inside a clip
  // that follows the ground, so they never rise above the surface.
  var clipId = 'grc' + uid;
  var pr = rng(7), far = '', near = '';
  for (var q = 0; q < 120; q++) {
    far += '<ellipse class="pebble" cx="' + f(pr() * W) + '" cy="' + f(150 + pr() * (0.6 * H + 900)) + '" rx="' + f(1.2 + pr() * 2.4) + '" ry="' + f(1 + pr() * 1.6) + '"/>';
  }
  var nr = rng(19);
  for (var q2 = 0; q2 < 70; q2++) {
    near += '<ellipse class="speck" cx="' + f(nr() * W) + '" cy="' + f(150 + nr() * (1.35 * H + 900)) + '" rx="' + f(3 + nr() * 5) + '" ry="' + f(2.2 + nr() * 3.4) + '"/>';
  }
  out.push('<defs><clipPath id="' + clipId + '"><rect x="0" y="142" width="' + W + '" height="' + (H - 142) + '"/></clipPath></defs>');
  out.push('<g data-sp="1"><g clip-path="url(#' + clipId + ')"><g data-sp="-0.4">' + far + '</g></g></g>');

  // layer 3: tunnels, chambers and gophers, moving with the ground
  out.push('<g data-sp="1">');
  out.push('<path class="tunnel" d="' + blob(XM, 138, 34, 8, 3).d + '"/>');
  var segs = [[[XM, 138], [XM + 4, 160], [XM - 3, 190], [XM, items[0].y]]];
  for (var k = 1; k < items.length; k++) {
    var a2 = items[k - 1], b2 = items[k];
    segs.push([[a2.x, a2.y], [a2.x, a2.y + 34], [b2.x, b2.y - 34], [b2.x, b2.y]]);
  }
  out.push('<path class="tunnel" d="' + ribbon(segs, 5) + '"/>');
  var lastIt = items[items.length - 1];
  out.push('<path class="tunnel" style="opacity:.55" d="' +
    ribbon([[[lastIt.x, last + 10], [lastIt.x, last + 70], [XM, last + 60], [XM, last + 100]]], 9) + '"/>');
  items.forEach(function (it, idx) {
    // the English edition of a post lives at <slug>-en/; chambers without one stay dark in English
    var slug = norm(it.node.slug);
    if (en) slug = slug.replace(/\/$/, '-en/');
    var isOn = !!live[slug], isHere = slug === here;
    var title = esc(T(it.node));
    var cave = blob(it.x, it.y, RX, RY, 100 + idx * 17);
    var g = '<g class="' + (isOn ? 'on' : 'off') + '">' +
      '<path class="cave" d="' + cave.d + '"/>' +
      '<text class="cave-t" x="' + f(cave.mx) + '" y="' + f(cave.my + 5) + '" text-anchor="middle">' + title + '</text>' +
      '</g>';
    if (isOn && !isHere) {
      out.push('<a href="/' + slug + '"><title>' + title + '</title>' + g + '</a>');
    } else {
      out.push('<g><title>' + title + (isOn ? '' : (en ? ' (coming soon)' : '（還沒挖到）')) + '</title>' + g + '</g>');
    }
  });
  // gophers: on the grass, beside the chambers (always on the free side), and at the end of the route
  out.push(sprite('01-wave', 130, 139));
  out.push(sprite('02-peek', 470, 143));
  items.forEach(function (it) {
    var name = it.node.gopher;
    if (!name) return;
    var s = SPRITE[name];
    out.push(sprite(name, it.x === XL ? W - 6 - s[0] * K / 2 : 6 + s[0] * K / 2, it.y + 30));
  });
  out.push('<path class="g-front" d="' + blades(47, 142, 5, 11, 6, 3, XM - 42, XM + 42) + '"/>');
  var endY = last + 165;
  out.push(sprite('12-cheer', 120, endY + 12));
  out.push(sprite('11-sleep', 440, endY + 12));
  out.push('</g>');

  // layer 4 (near): bigger specks in front that move faster than the ground
  out.push('<g data-sp="1"><g clip-path="url(#' + clipId + ')"><g data-sp="0.35">' + near + '</g></g></g>');

  var label = en ? 'Roadmap of the Go notes series, drawn as a gopher burrow' : 'Go 筆記系列的學習路線圖，畫成地鼠挖的地洞';
  return '<figure class="go-roadmap" data-pl data-w="' + W + '" data-h="' + H + '"><style>' + CSS + '</style>' +
    '<div class="gr-track"><div class="gr-frame"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' +
    out.join('') + '</svg></div></div>' + (caption ? '<figcaption>' + caption + '</figcaption>' : '') +
    '<script>' + SCRIPT + '</script></figure>';
}
