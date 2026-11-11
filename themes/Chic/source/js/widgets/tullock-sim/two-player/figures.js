// The three figures of the two-player widget. Each takes the simulation `s` (core/summary.js) and the
// reader's choice `ch` = { x1, x2, path } and returns { els, labels, legend }: SVG source plus label slots.
import { frame, polylines, axes, dotted, hline, tick, openDot, filledDot, DASH } from '../ui/geometry.js'

const AXIS = 100 // the drawing always spans 0..AXIS, so changing V or c visibly moves things
const PAY = 50 // the payoff tab spans -PAY..PAY
export const FILE = { br: 'tullock-best-response', pay: 'tullock-payoff', win: 'tullock-win-probability' }

const LEG = {
  br: [{ key: 'br1', tex: '$x_1 = BR_1(x_2)$', dash: '' }, { key: 'br2', tex: '$x_2 = BR_2(x_1)$', dash: DASH }],
  pay: [{ key: 'pil', tex: '$\\pi_1(x_1, x_2)$', dash: '' }],
  win: [{ key: 'pc', tex: '$p_1(x_1, x_2)$', dash: '' }],
}
const label = (id, tex, x, y, ax, ay, key = id) => ({ id, key, tex, x, y, ax, ay })

// the axis names and the origin, the same on every tab
function baseLabels(f, y0, yName) {
  return [
    label('x1', '$x_1$', f.W - f.M + 20, y0, 0, 0.5),
    label(yName.id, yName.tex, f.M, f.M - 20, 0.5, 1),
    label('zero', '$0$', f.M - 6, y0 + 5, 1, 0),
  ]
}

// Start at the reader's (x1, x2); player 1 best-responds to x2, then player 2 to the new x1, and so on.
// The staircase is the path the two players would follow if they kept best-responding in turn.
function reactionPath(s, ch, f) {
  const br = (other) => s.game.bestResponse(other ** s.params.r)
  const pts = [[ch.x1, ch.x2]]
  let [a, b] = pts[0]
  for (let i = 0; i < 12; i++) {
    const na = br(b); pts.push([na, b])
    const nb = br(na); pts.push([na, nb])
    const move = Math.abs(na - a) + Math.abs(nb - b)
    a = na; b = nb
    if (move < 0.02) break
  }
  const d = pts.map((p) => `${f.x(Math.min(p[0], AXIS)).toFixed(2)},${f.y(Math.min(p[1], AXIS)).toFixed(2)}`).join(' ')
  return `<polyline points="${d}" class="ts-path" fill="none" stroke-width="1.3" stroke-linejoin="round"/>`
}

export function figureBR(s, ch) {
  const f = frame({ xd: [0, AXIS], yd: [0, AXIS] })
  const vc = s.game.scale, eq = s.equilibrium
  const { x: xs, br } = s.curve
  const cut = (i) => (br[i] === 0) !== (br[i - 1] === 0) && Math.abs(br[i] - br[i - 1]) > 0.03 * AXIS
  const els = [
    axes(f, f.H - f.M, f.H - f.M),
    tick(f.x(vc), f.H - f.M, false), tick(f.M, f.y(vc), true),
    polylines(xs.map((t, i) => [f.x(br[i]), f.y(t)]), cut, ' stroke-width="1.6"'),
    polylines(xs.map((t, i) => [f.x(t), f.y(br[i])]), cut, ` stroke-width="1.6"${DASH}`),
  ]
  const labels = [
    ...baseLabels(f, f.H - f.M, { id: 'x2', tex: '$x_2$' }),
    label('vcx', '$\\frac{V}{c}$', f.x(vc), f.H - f.M + 7, 0.5, 0, 'vc'),
    label('vcy', '$\\frac{V}{c}$', f.M - 8, f.y(vc), 1, 0.5, 'vc'),
  ]
  if (eq.converged) {
    const [a, b] = eq.x
    els.push(dotted(f.x(a), f.y(b), f.M, f.H - f.M), filledDot(f.x(a), f.y(b)))
    labels.push(label('x1s', '$x_1^*$', f.x(a), f.H - f.M + 5, 0.5, 0), label('x2s', '$x_2^*$', f.M - 7, f.y(b), 1, 0.5))
  }
  if (ch.path) els.push(reactionPath(s, ch, f))
  els.push(dotted(f.x(ch.x1), f.y(ch.x2), f.M, f.H - f.M), openDot(f.x(ch.x1), f.y(ch.x2)))
  return { els: els.join(''), labels, legend: LEG.br }
}

// Player 1's payoff against the x2 the reader chose (not the equilibrium x2*), so the curve and its peak move with the sliders.
export function figurePay(s, ch) {
  const f = frame({ xd: [0, AXIS], yd: [-PAY, PAY] })
  const y0 = f.y(0)
  const rest = ch.x2 ** s.params.r
  const pi = (t) => s.game.payoff(t, rest)
  const xs = s.curve.x, ys = xs.map(pi)
  let k = 0
  ys.forEach((v, i) => { if (v > ys[k]) k = i })
  const clamp = (v) => Math.max(-PAY, Math.min(PAY, v))
  const cut = (i) => Math.abs(ys[i]) > PAY || Math.abs(ys[i - 1]) > PAY
  // filled dot: the best x1 against this x2 (the equilibrium x1* when x2 = x2*); open dot: the chosen x1
  const els = [
    axes(f, y0, f.H - f.M),
    polylines(xs.map((t, i) => [f.x(t), f.y(clamp(ys[i]))]), cut, ' stroke-width="1.6"'),
    dotted(f.x(xs[k]), f.y(clamp(ys[k])), f.M, y0), filledDot(f.x(xs[k]), f.y(clamp(ys[k]))),
    dotted(f.x(ch.x1), f.y(clamp(pi(ch.x1))), f.M, y0), openDot(f.x(ch.x1), f.y(clamp(pi(ch.x1)))),
  ]
  return { els: els.join(''), labels: baseLabels(f, y0, { id: 'pi1', tex: '$\\pi_1$' }), legend: LEG.pay }
}

// p1 = x1^r / (x1^r + x2^r) as x1 runs along the axis, x2 fixed at the reader's value
export function figureWin(s, ch) {
  const f = frame({ xd: [0, AXIS], yd: [0, 1] })
  const rest = ch.x2 ** s.params.r
  const N = 160
  const pts = Array.from({ length: N + 1 }, (_, k) => {
    const t = (AXIS * k) / N
    return [f.x(t), f.y(s.game.winProb(t, rest))]
  })
  const p = s.game.winProb(ch.x1, rest), px = f.x(ch.x1), py = f.y(p)
  const els = [
    axes(f, f.H - f.M, f.H - f.M),
    tick(f.M, f.y(1), true), tick(f.M, f.y(0.5), true),
    hline(f.M, f.W - f.M, f.y(0.5)),
    polylines(pts, () => false, ' stroke-width="1.6"'),
    dotted(px, py, f.M, f.H - f.M), openDot(px, py),
  ]
  const labels = [
    ...baseLabels(f, f.H - f.M, { id: 'p1', tex: '$p_1$' }),
    label('one', '$1$', f.M - 8, f.y(1), 1, 0.5),
    label('half', '$0.5$', f.M - 8, f.y(0.5), 1, 0.5),
  ]
  return { els: els.join(''), labels, legend: LEG.win }
}

export const FIGURE = { br: figureBR, pay: figurePay, win: figureWin }
