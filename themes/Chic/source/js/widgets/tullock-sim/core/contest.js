// The contest model for n players: win probability, payoff, best response, equilibrium.
// Mirrors src/tullock/contest.py; tests/test_js_parity.py keeps the two in step.
// No DOM in here, so Node can import it too.
const INV_PHI = (Math.sqrt(5) - 1) / 2

export class Contest {
  constructor(V, c, r, n = 2) {
    if (V <= 0 || c <= 0 || r <= 0) throw new Error('V, c, r must be positive')
    if (n < 2) throw new Error('n must be at least 2')
    Object.assign(this, { V, c, r, n })
  }

  // spending beyond V/c costs more than the prize, so it is never best
  get scale() { return this.V / this.c }

  // `rest` is the sum of the others' expenditures raised to the power r
  winProb(own, rest) {
    const total = own ** this.r + rest
    return total === 0 ? 1 / this.n : own ** this.r / total
  }

  payoff(own, rest) { return this.V * this.winProb(own, rest) - this.c * own }

  restOf(x, i) {
    let s = 0
    for (let j = 0; j < x.length; j++) if (j !== i) s += x[j] ** this.r
    return s
  }

  dissipation(x) { return (this.c * x.reduce((a, b) => a + b, 0)) / this.V }

  // best expenditure against `rest`: a coarse grid first (for r > 1 the payoff is not concave),
  // then golden section around the best cell, then compare with spending nothing
  bestResponse(rest, grid = 200) { // `rest` makes every evaluation O(1), so a huge n is fine
    const hi = this.scale
    const f = (t) => this.payoff(t, rest)
    const step = hi / grid
    let k = 0, best = -Infinity
    for (let j = 0; j <= grid; j++) {
      const v = f(j * step)
      if (v > best) { best = v; k = j }
    }
    let a = Math.max(0, (k - 1) * step), b = Math.min(hi, (k + 1) * step)
    for (let i = 0; i < 80 && b - a >= 1e-12 * Math.max(1, hi); i++) {
      const m1 = b - INV_PHI * (b - a), m2 = a + INV_PHI * (b - a)
      if (f(m1) < f(m2)) a = m1
      else b = m2
    }
    const x = (a + b) / 2
    return f(x) >= f(0) ? x : 0
  }

  // one player's best expenditure when every rival spends t (n = 2: the usual best-response curve)
  symmetricBestResponse(t) { return this.bestResponse((this.n - 1) * t ** this.r) }

  // symmetric pure-strategy equilibrium exists iff r <= n / (n - 1) (Pérez-Castrillo and Verdier 1992)
  get hasPureEquilibrium() { return this.r <= this.n / (this.n - 1) }

  closedForm() {
    return this.hasPureEquilibrium ? (this.r * (this.n - 1) * this.V) / (this.c * this.n ** 2) : null
  }

  // Only the equilibrium where everybody spends the same: solve BR(x) = x, O(1) per evaluation, so n = 1000 is fine.
  // Find where BR(x) - x goes from positive to negative on a log grid, then bisect. BR can jump from positive
  // straight to 0; that jump is not a fixed point, so the root is checked and null is returned if it fails.
  symmetricEquilibrium(points = 600) {
    const hi = this.scale, lo0 = hi * 1e-12
    const grid = Array.from({ length: points + 1 }, (_, k) => lo0 * (hi / lo0) ** (k / points))
    const g = (t) => this.symmetricBestResponse(t) - t
    let found = null, prev = g(grid[0])
    for (let k = 1; k <= points; k++) {
      const cur = g(grid[k])
      if (prev > 0 && cur <= 0) {
        let a = grid[k - 1], b = grid[k]
        for (let i = 0; i < 100; i++) {
          const m = Math.sqrt(a * b)
          if (g(m) > 0) a = m
          else b = m
        }
        if (Math.abs(g(a)) <= 1e-6 * a) found = Math.sqrt(a * b)
      }
      prev = cur
    }
    return found
  }

  // everyone best-responds in turn (damped) until nobody moves. The default start is asymmetric,
  // so reaching the symmetric point is a real check. `history` keeps x after every round.
  findEquilibrium({ x0, tol = 1e-6, maxIter = 500, damping = 0.5 } = {}) {
    const { n, scale } = this
    const x = x0 ? [...x0] : Array.from({ length: n }, (_, i) => (scale * (i + 1)) / (2 * (n + 1)))
    const history = [[...x]]
    for (let it = 1; it <= maxIter; it++) {
      let move = 0
      for (let i = 0; i < n; i++) {
        const next = (1 - damping) * x[i] + damping * this.bestResponse(this.restOf(x, i))
        move = Math.max(move, Math.abs(next - x[i]))
        x[i] = next
      }
      history.push([...x])
      if (move < tol * scale) return { x, converged: true, iterations: it, history }
    }
    return { x, converged: false, iterations: maxIter, history }
  }
}
