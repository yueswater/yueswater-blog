// The three figures of the n-player widget. A figure is { els, labels, legend }: SVG source plus label slots.
// byN: the equilibrium against the number of players. deviation: one player's payoff as he moves away
// from the candidate. dynamics: every player's expenditure round by round.
import { frame, polylines, axes, dotted, hline, tick, openDot, filledDot, DASH } from '../ui/geometry.js'
import { candidate, deviation } from '../core/analysis.js'
import { N_FULL, N_MAX } from '../core/byn.js'
import { T } from './text.js'

const T_MAX = 3, ROUNDS = 60
const N_TICKS = [2, 5, 10, 30, 100, 300, 1000]
const LO = -0.15, HI = 0.3 // the deviation tab's vertical range: tight, so a small loss at t = 1 still shows
const label = (id, tex, x, y, ax, ay) => ({ id, key: id, tex, x, y, ax, ay })
const dot = (x, y) => `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="3.4" class="ts-dot"/>`
const ring = (x, y) => `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="3.4" fill="none" stroke="currentColor" stroke-width="1.3"/>`
const axisNames = (f, y0, xTex, yTex) => [
  label('xname', xTex, f.W - f.M + 20, y0, 0, 0.5), label('yname', yTex, f.M, f.M - 20, 0.5, 1),
]

// the formula curve for real n (log-spaced) over n in [lo, hi]
function curve(f, lo, hi, share) {
  const pts = []
  for (let k = 0; k <= 240; k++) {
    const n = 2 * (N_MAX / 2) ** (k / 240)
    if (n >= lo && n <= hi) pts.push([f.x(n), f.y(share(n))])
  }
  return pts
}

export function figureByN(sweep, s, v) {
  const { top, rows } = sweep
  const f = frame({ xd: [2, N_MAX], yd: [0, 1.08], xlog: true }) // an equilibrium never dissipates more than V (1); the extra is air above the line
  const D = (n) => (v.r * (n - 1)) / n, one = (n) => (v.r * (n - 1)) / n ** 2
  const last = rows.filter((q) => q.k < q.n)[0] // first n where somebody stays out
  const ln = (pts, extra = '') => polylines(pts, () => false, ` stroke-width="1.6"${extra}`)
  const els = [
    axes(f, f.H - f.M, f.H - f.M), tick(f.M, f.y(1), true), tick(f.M, f.y(0.5), true),
    hline(f.M, f.W - f.M, f.y(1)),
    ln(curve(f, 2, top, D)), ln(curve(f, 2, top, one), DASH),
    ...N_TICKS.map((n) => tick(f.x(n), f.H - f.M, false)),
  ]
  if (v.r > 1 && top < N_MAX) {
    // past the all-in limit the equilibrium has k players in and the rest out: both lines go flat
    if (last) {
      const nx = Math.max(top, 2)
      els.push(ln([[f.x(nx), f.y(last.D)], [f.x(N_MAX), f.y(last.D)]]), ln([[f.x(nx), f.y(last.share)], [f.x(N_MAX), f.y(last.share)]], DASH))
    }
  }
  for (const row of rows) {
    // filled: everybody in. open: only k of the n spend (the share is that of an active player)
    const mark = row.k === row.n ? dot : ring
    els.push(mark(f.x(row.n), f.y(row.D)), mark(f.x(row.n), f.y(row.share)))
  }
  const here = sweep.at(v.n)
  els.push(dotted(f.x(v.n), f.y(Math.min(1, here ? here.D : D(v.n))), f.M, f.H - f.M))
  const labels = [
    ...axisNames(f, f.H - f.M, '$n$', '$D$'),
    label('one', '$1$', f.M - 8, f.y(1), 1, 0.5), label('half', '$0.5$', f.M - 8, f.y(0.5), 1, 0.5),
    ...N_TICKS.map((n) => label(`n${n}`, `$${n}$`, f.x(n), f.H - f.M + 7, 0.5, 0)),
  ]
  const legend = [{ tex: T.legNum, dot: 'filled' }]
  if (rows.some((q) => q.k < q.n)) legend.push({ tex: T.legOut, dot: 'open' })
  const end = rows[rows.length - 1] // the dashed line is named at its right end, above it (the solid one is the axis's D)
  if (end) labels.push(label('lone', '$cx_i / V$', f.W - f.M, f.y(end.share) - 8, 1, 1))
  return { els: els.join(''), labels, legend, legendBelow: true }
}

export function figureDeviation(g) {
  const f = frame({ xd: [0, T_MAX], yd: [LO, HI] })
  const y0 = f.y(0), { ts, f: ys, tBest } = deviation(g, T_MAX)
  const clamp = (v) => Math.max(LO, Math.min(HI, v))
  const cut = (i) => ys[i] > HI || ys[i] < LO || ys[i - 1] < LO
  const own = ys[Math.round((1 / T_MAX) * (ts.length - 1))]
  const els = [
    axes(f, y0, f.H - f.M), tick(f.x(1), y0, false),
    polylines(ts.map((t, i) => [f.x(t), f.y(clamp(ys[i]))]), cut, ' stroke-width="1.6"'),
    dotted(f.x(1), f.y(clamp(own)), f.M, y0), openDot(f.x(1), f.y(clamp(own))),
  ]
  // filled dot: where he really does best (found numerically); it sits on t = 1 only if the candidate is an equilibrium
  if (tBest <= T_MAX) {
    const yb = g.payoff(tBest * candidate(g), (g.n - 1) * candidate(g) ** g.r) / g.V
    els.push(filledDot(f.x(tBest), f.y(clamp(yb))))
  }
  const labels = [
    ...axisNames(f, y0, '$t$', '$\\pi_i / V$'), label('zero', '$0$', f.M - 6, y0 + 5, 1, 0), label('t1', '$1$', f.x(1), y0 + 7, 0.5, 0),
  ]
  return { els: els.join(''), labels, legend: [{ tex: T.legPay, dash: '' }] }
}

export function figureDynamics(s, g) {
  const h = s.history.slice(0, ROUNDS + 1)
  const big = g.n > N_FULL // one representative player: the vertical range follows his path
  const top = big ? Math.max(...h.map((row) => row[0]), g.closedForm() ?? 0) * 1.2 : g.scale / 2
  const f = frame({ xd: [0, ROUNDS], yd: [0, top] })
  const els = [axes(f, f.H - f.M, f.H - f.M)]
  if (!big) els.push(tick(f.M, f.y(top), true))
  for (let i = 0; i < h[0].length; i++) {
    els.push(polylines(h.map((row, k) => [f.x(k), f.y(Math.min(row[i], top))]), () => false, ' stroke-width="1.1" opacity="0.75"'))
  }
  const cf = g.closedForm()
  if (cf !== null) els.push(hline(f.M, f.W - f.M, f.y(cf), DASH + ' opacity="1"'))
  const labels = [
    ...axisNames(f, f.H - f.M, '$k$', '$x_i$'), label('zero', '$0$', f.M - 6, f.H - f.M + 5, 1, 0),
    ...(big ? [] : [label('top', '$\\frac{V}{2c}$', f.M - 8, f.y(top), 1, 0.5)]),
  ]
  const legend = [{ tex: big ? T.legRep : T.legX, dash: '' }, ...(cf === null ? [] : [{ tex: T.legForm, dash: DASH }])]
  return { els: els.join(''), labels, legend }
}
