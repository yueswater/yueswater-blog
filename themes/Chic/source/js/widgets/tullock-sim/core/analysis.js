// What the n-player post looks at, as plain numbers (no DOM): the deviation test and the start point.

const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length

// the symmetric candidate from the first-order condition; a number for every r, an equilibrium only if r <= n/(n-1)
export const candidate = (g) => (g.r * (g.n - 1) * g.V) / (g.c * g.n ** 2)

// One player spends t times the candidate x*, everyone else spends x*. Returns his payoff over V for
// each t, and the t that really is best (found numerically): 1 if the candidate is an equilibrium, 0 if he is better off out.
export function deviation(g, tMax = 3, points = 241) {
  const xc = candidate(g)
  const rest = (g.n - 1) * xc ** g.r
  const ts = Array.from({ length: points }, (_, k) => (tMax * k) / (points - 1))
  return { ts, f: ts.map((t) => g.payoff(t * xc, rest) / g.V), tBest: g.bestResponse(rest) / xc }
}

// where the player-by-player iteration starts: close to the candidate but not equal (its spread is 40%).
// From far away the iteration can end in another equilibrium (for r > 1 there are several).
export const startNear = (g) => Array.from({ length: g.n }, (_, i) => candidate(g) * (0.8 + (0.4 * i) / (g.n - 1)))

// is the equilibrium found symmetric with everybody in?
export function isSymmetric(x) {
  const m = mean(x)
  return m > 0 && Math.min(...x) > 0 && (Math.max(...x) - Math.min(...x)) / m < 1e-3
}
