// The three figures of the cost-and-budget widget. A figure is { els, labels, legend }: SVG source plus label slots.
// byQ: the dissipation rate against q. byB: against the budget (as a share of x*). dynamics: every player round by round.
import { frame, polylines, axes, dotted, hline, tick, DASH } from '../ui/geometry.js'
import { Q_MAX, RATIO_MAX } from '../core/penalizedSweep.js'
import { T } from './text.js'

const ROUNDS = 60
const Q_TICKS = [1, 2, 3, 4]
const RATIO_TICKS = [0.5, 1]
const label = (id, tex, x, y, ax, ay) => ({ id, key: id, tex, x, y, ax, ay })
const dot = (x, y) => `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="3.4" class="ts-dot"/>`
const axisNames = (f, y0, xTex, yTex) => [
  label('xname', xTex, f.W - f.M + 20, y0, 0, 0.5), label('yname', yTex, f.M, f.M - 20, 0.5, 1),
]
const line = (f, pts) => polylines(pts.map(([a, b]) => [f.x(a), f.y(b)]), () => false, ' stroke-width="1.6"')
const legend = [{ tex: T.legForm, dash: '' }, { tex: T.legNum, dot: 'filled' }]

export function figureByQ(sw, v) {
  const f = frame({ xd: [1, Q_MAX], yd: [0, 1.08] }) // an equilibrium never dissipates more than V (1)
  const here = sw.at(v.q)
  const els = [
    axes(f, f.H - f.M, f.H - f.M), tick(f.M, f.y(1), true), tick(f.M, f.y(0.5), true), hline(f.M, f.W - f.M, f.y(1)),
    line(f, sw.curve), ...sw.dots.map(([q, D]) => dot(f.x(q), f.y(D))),
    ...Q_TICKS.map((q) => tick(f.x(q), f.H - f.M, false)),
    dotted(f.x(v.q), f.y(here), f.M, f.H - f.M),
  ]
  const labels = [
    ...axisNames(f, f.H - f.M, '$q$', '$D$'),
    label('one', '$1$', f.M - 8, f.y(1), 1, 0.5), label('half', '$0.5$', f.M - 8, f.y(0.5), 1, 0.5),
    ...Q_TICKS.map((q) => label(`q${q}`, `$${q}$`, f.x(q), f.H - f.M + 7, 0.5, 0)),
  ]
  return { els: els.join(''), labels, legend, legendBelow: true }
}

export function figureByB(sw, v, here) {
  const top = sw.free * 1.15
  const f = frame({ xd: [0, RATIO_MAX], yd: [0, top] })
  const ratio = Math.min(v.B / sw.xStar, RATIO_MAX)
  const els = [
    axes(f, f.H - f.M, f.H - f.M), hline(f.M, f.W - f.M, f.y(sw.free)),
    line(f, sw.curve), ...sw.dots.map(([t, D]) => dot(f.x(t), f.y(D))),
    ...RATIO_TICKS.map((t) => tick(f.x(t), f.H - f.M, false)),
    dotted(f.x(ratio), f.y(here), f.M, f.H - f.M),
  ]
  const labels = [
    ...axisNames(f, f.H - f.M, '$B / x^*$', '$D$'),
    label('zero', '$0$', f.M - 6, f.H - f.M + 5, 1, 0),
    label('free', '$\\frac{n - 1}{qn}$', f.M - 8, f.y(sw.free), 1, 0.5),
    ...RATIO_TICKS.map((t) => label(`r${t}`, `$${t}$`, f.x(t), f.H - f.M + 7, 0.5, 0)),
  ]
  return { els: els.join(''), labels, legend, legendBelow: true }
}

export function figureDynamics(history, xForm, hi) {
  const h = history.slice(0, ROUNDS + 1)
  const top = Math.max(xForm, ...h.map((row) => Math.max(...row))) * 1.2 || hi
  const f = frame({ xd: [0, ROUNDS], yd: [0, top] })
  const els = [axes(f, f.H - f.M, f.H - f.M)]
  for (let i = 0; i < h[0].length; i++) {
    els.push(polylines(h.map((row, k) => [f.x(k), f.y(Math.min(row[i], top))]), () => false, ' stroke-width="1.1" opacity="0.75"'))
  }
  els.push(hline(f.M, f.W - f.M, f.y(xForm), DASH + ' opacity="1"'))
  const labels = [...axisNames(f, f.H - f.M, '$k$', '$x_i$'), label('zero', '$0$', f.M - 6, f.H - f.M + 5, 1, 0)]
  return { els: els.join(''), labels, legend: [{ tex: T.legX, dash: '' }, { tex: T.legFormX, dash: DASH }] }
}
