// Drawing primitives for the figures: scales, axes, polylines, dots. They return SVG source strings.
export const DASH = ' stroke-dasharray="4 3"'

// a linear map from data [d0, d1] to pixels [p0, p1]
export const scale = (d0, d1, p0, p1) => (v) => p0 + ((v - d0) / (d1 - d0)) * (p1 - p0)

// like scale, but on a log axis (d0 > 0)
export const logScale = (d0, d1, p0, p1) => (v) => p0 + (Math.log(v / d0) / Math.log(d1 / d0)) * (p1 - p0)

// a W x H figure with margin M; x runs over xd = [x0, x1], y over yd = [y0, y1]; xlog puts x on a log axis
export function frame({ W = 400, H = 400, M = 36, xd, yd, xlog = false }) {
  const sx = xlog ? logScale : scale
  return { W, H, M, x: sx(xd[0], xd[1], M, W - M), y: scale(yd[0], yd[1], H - M, M) }
}

const f2 = (v) => v.toFixed(2)

// a polyline that is cut where `cut(i)` says the curve jumps between point i-1 and i
export function polylines(pts, cut, attrs = '') {
  const parts = []
  let cur = []
  pts.forEach((p, i) => {
    if (i && cut(i)) { parts.push(cur); cur = [] }
    cur.push(p)
  })
  parts.push(cur)
  return parts
    .filter((q) => q.length > 1)
    .map((q) => `<polyline points="${q.map((p) => `${f2(p[0])},${f2(p[1])}`).join(' ')}" fill="none" stroke="currentColor"${attrs}/>`)
    .join('')
}

// arrow axes: the x axis at pixel row y0, the y axis from yBottom upward
export function axes({ W, M }, y0, yBottom) {
  return `<path d="M${M} ${y0}H${W - M + 14}M${M} ${yBottom}V${M - 14}" fill="none" stroke="currentColor" stroke-width="1.2"/>` +
    `<path d="M${W - M + 14} ${y0}l-7 -3.5v7zM${M} ${M - 14}l-3.5 7h7z" fill="currentColor"/>`
}

export const dotted = (x, y, x0, y0) =>
  `<path d="M${x} ${y}V${y0}M${x} ${y}H${x0}" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="1 3" opacity="0.7"/>`

export const hline = (x0, x1, y, attrs = ' stroke-dasharray="1 3" opacity="0.7"') =>
  `<path d="M${x0} ${y}H${x1}" fill="none" stroke="currentColor" stroke-width="1"${attrs}/>`

export const tick = (x, y, horizontal) =>
  `<path d="M${horizontal ? `${x - 3} ${y}h6` : `${x} ${y - 3}v6`}" fill="none" stroke="currentColor" stroke-width="1"/>`

// the reader's own point is an open dot, so it reads apart from the filled equilibrium dot
export const openDot = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/>`
export const filledDot = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="5" class="ts-dot"/>`
