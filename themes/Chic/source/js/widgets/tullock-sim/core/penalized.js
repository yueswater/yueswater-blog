// The contest of the third post: cost (c/q) x^q, a budget B, and a penalty `lam` per unit spent beyond B (no DOM).
// r = 1 throughout. The payoff is concave in one's own spending whenever the others spend something,
// so a golden-section search is enough for a best response. Nothing here uses the closed forms of the post:
// the widget compares this numerical equilibrium with them (penalizedForm.js).
const INV_PHI = (Math.sqrt(5) - 1) / 2

export class PenalizedContest {
  constructor(V, c, q, n, B, lam) {
    if (V <= 0 || c <= 0 || q < 1 || n < 2 || B <= 0 || lam < 0) throw new Error('bad parameters')
    Object.assign(this, { V, c, q, n, B, lam })
  }

  // spending where the cost alone reaches the prize is never best
  get hi() { return ((this.q * this.V) / this.c) ** (1 / this.q) }

  cost(x) { return (this.c / this.q) * x ** this.q }

  winProb(own, rest) {
    const total = own + rest
    return total === 0 ? 1 / this.n : own / total
  }

  payoff(own, rest) {
    return this.V * this.winProb(own, rest) - this.cost(own) - this.lam * Math.max(own - this.B, 0)
  }

  restOf(x, i) {
    let s = 0
    for (let j = 0; j < x.length; j++) if (j !== i) s += x[j]
    return s
  }

  bestResponse(rest) {
    const f = (t) => this.payoff(t, rest)
    let a = 0, b = this.hi
    for (let i = 0; i < 100; i++) {
      const m1 = b - INV_PHI * (b - a), m2 = a + INV_PHI * (b - a)
      if (f(m1) < f(m2)) a = m1
      else b = m2
    }
    return (a + b) / 2
  }

  // the equilibrium where everybody spends the same: solve BR((n - 1) t) = t.
  // Find where BR - t goes from positive to negative on a log grid, then bisect.
  symmetricEquilibrium(points = 300) {
    const hi = this.hi, lo0 = hi * 1e-9
    const g = (t) => this.bestResponse((this.n - 1) * t) - t
    let a = lo0, ga = g(a)
    for (let k = 1; k <= points; k++) {
      const b = lo0 * (hi / lo0) ** (k / points), gb = g(b)
      if (ga > 0 && gb <= 0) {
        let lo = a, up = b
        for (let i = 0; i < 80; i++) {
          const m = Math.sqrt(lo * up)
          if (g(m) > 0) lo = m
          else up = m
        }
        return Math.sqrt(lo * up)
      }
      a = b
      ga = gb
    }
    return null
  }

  // everyone best-responds in turn (damped) until nobody moves; the default start is asymmetric.
  // `history` keeps x after every round.
  findEquilibrium({ x0, tol = 1e-7, maxIter = 300, damping = 0.5 } = {}) {
    const { n, hi } = this
    const x = x0 ? [...x0] : Array.from({ length: n }, (_, i) => (hi * (i + 1)) / (2 * (n + 1)))
    const history = [[...x]]
    for (let it = 1; it <= maxIter; it++) {
      let move = 0
      for (let i = 0; i < n; i++) {
        const next = (1 - damping) * x[i] + damping * this.bestResponse(this.restOf(x, i))
        move = Math.max(move, Math.abs(next - x[i]))
        x[i] = next
      }
      history.push([...x])
      if (move < tol * hi) return { x, converged: true, iterations: it, history }
    }
    return { x, converged: false, iterations: maxIter, history }
  }
}
