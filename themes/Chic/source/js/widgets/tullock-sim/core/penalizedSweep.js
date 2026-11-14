// Sweeps for the cost-and-budget widget (no DOM): the dissipation rate against q, and against the budget B
// (as a share of the unconstrained equilibrium x*). `curve` is the post's formula, `dots` the numerical equilibrium.
import { PenalizedContest } from './penalized.js'
import { formula, outcomes } from './penalizedForm.js'

export const Q_MAX = 4
export const RATIO_MAX = 1.4
const Q_DOTS = [1, 1.5, 2, 2.5, 3, 3.5, 4]
const RATIO_DOTS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4]
const grid = (lo, hi, k) => Array.from({ length: k + 1 }, (_, i) => lo + ((hi - lo) * i) / k)

// D from the numerical equilibrium of one game, or null if none is found
function numericD(V, c, q, n, B, lam) {
  const x = new PenalizedContest(V, c, q, n, B, lam).symmetricEquilibrium()
  return x === null ? null : outcomes(V, c, q, n, B, lam, x).D
}

function formulaD(V, c, q, n, B, lam) {
  return outcomes(V, c, q, n, B, lam, formula(V, c, q, n, B, lam).x).D
}

export function sweepByQ({ V, c, n, B, lam }) {
  const D = (q) => formulaD(V, c, q, n, B, lam)
  return {
    curve: grid(1, Q_MAX, 120).map((q) => [q, D(q)]),
    dots: Q_DOTS.map((q) => [q, numericD(V, c, q, n, B, lam)]).filter((p) => p[1] !== null),
    at: D,
  }
}

// the horizontal axis is B / x* for the current q (x* does not depend on B or lam)
export function sweepByB({ V, c, q, n, lam }) {
  const xStar = formula(V, c, q, n, 1e9, 0).xStar
  const D = (ratio) => formulaD(V, c, q, n, ratio * xStar, lam)
  return {
    xStar,
    curve: grid(0.02, RATIO_MAX, 120).map((t) => [t, D(t)]),
    dots: RATIO_DOTS.map((t) => [t, numericD(V, c, q, n, t * xStar, lam)]).filter((p) => p[1] !== null),
    free: formulaD(V, c, q, n, 1e9, 0), // no budget: D* = (n - 1) / (q n)
  }
}
