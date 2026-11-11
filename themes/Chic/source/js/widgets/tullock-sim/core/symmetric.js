// The same read-out as summary.js, for a huge n (up to 1000): the full player-by-player iteration costs
// O(n^2) per round, so only the symmetric equilibrium is solved (Contest.symmetricEquilibrium), and the
// "iteration" is one representative player best-responding to everybody else doing the same thing.
import { Contest } from './contest.js'

// x_{k+1} = x_k + d (BR(x_k) - x_k) with d = 2/n: stable for any n (a step of 1/2 would blow up past n = 4)
export function meanFieldPath(g, rounds = 60) {
  const d = Math.min(0.5, 2 / g.n)
  let x = g.scale / (2 * (g.n + 1))
  const path = [[x]]
  for (let k = 0; k < rounds; k++) {
    x += d * (g.symmetricBestResponse(x) - x)
    path.push([x])
  }
  return path
}

export function runSymmetric(V, c, r, n) {
  const game = new Contest(V, c, r, n)
  const star = game.symmetricEquilibrium()
  const ok = star !== null
  const x = Array.from({ length: n }, () => (ok ? star : 0))
  const rest = ok ? (n - 1) * star ** r : 0
  const out = {
    params: { V, c, r, n },
    equilibrium: { x, converged: ok, iterations: 0 },
    closedForm: game.closedForm(),
    payoff: x.map((xi) => (ok ? game.payoff(xi, rest) : 0)),
    winProb: x.map((xi) => (ok ? game.winProb(xi, rest) : 0)),
    dissipation: ok ? game.dissipation(x) : 0,
    hasPureEquilibrium: game.hasPureEquilibrium,
  }
  Object.defineProperty(out, 'game', { value: game, enumerable: false })
  Object.defineProperty(out, 'history', { value: meanFieldPath(game), enumerable: false })
  return out
}
