// One simulation as plain data. Mirrors src/tullock/summary.py (same keys, camelCase).
import { Contest } from './contest.js'

// `x0` (optional): where the iteration starts; the default is deliberately asymmetric
export function run(V, c, r, n = 2, points = 161, { x0 } = {}) {
  const game = new Contest(V, c, r, n)
  const xs = Array.from({ length: points }, (_, k) => (game.scale * k) / (points - 1))
  const eq = game.findEquilibrium({ x0 })
  const out = {
    params: { V, c, r, n },
    curve: { x: xs, br: xs.map((t) => game.symmetricBestResponse(t)) },
    equilibrium: { x: eq.x, converged: eq.converged, iterations: eq.iterations },
    closedForm: game.closedForm(),
    payoff: eq.x.map((xi, i) => game.payoff(xi, game.restOf(eq.x, i))),
    winProb: eq.x.map((xi, i) => game.winProb(xi, game.restOf(eq.x, i))),
    dissipation: game.dissipation(eq.x),
    hasPureEquilibrium: game.hasPureEquilibrium,
    // x1 = 60 and x2 = 40 (everyone else 40): player 1's chance
    demoWinProb: game.winProb(60, (n - 1) * 40 ** r),
  }
  // the model itself rides along for the page, but stays out of JSON
  Object.defineProperty(out, 'game', { value: game, enumerable: false })
  Object.defineProperty(out, 'history', { value: eq.history, enumerable: false })
  return out
}
