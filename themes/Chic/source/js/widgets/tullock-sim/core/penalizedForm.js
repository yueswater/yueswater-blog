// The post's closed forms for the penalized contest (no DOM): the unconstrained equilibrium x*, the penalty
// threshold lamBar, and the equilibrium spending in the three cases of the proposition.
//   free: B >= x*          every spends x*
//   cap:  lam >= lamBar    every spends B
//   soft: otherwise        every spends the root of (n - 1)V / (n^2 x) = c x^(q - 1) + lam, between B and x*
export function formula(V, c, q, n, B, lam) {
  const A = ((n - 1) * V) / (c * n * n)
  const xStar = A ** (1 / q)
  const lamBar = (c * A) / B - c * B ** (q - 1)
  if (B >= xStar) return { x: xStar, xStar, lamBar, kind: 'free' }
  if (lam >= lamBar) return { x: B, xStar, lamBar, kind: 'cap' }
  // psi falls from lamBar - lam > 0 at B to -lam < 0 at x*: bisect
  const psi = (x) => (c * A) / x - c * x ** (q - 1) - lam
  let a = B, b = xStar
  for (let i = 0; i < 100; i++) {
    const m = (a + b) / 2
    if (psi(m) > 0) a = m
    else b = m
  }
  return { x: (a + b) / 2, xStar, lamBar, kind: 'soft' }
}

// what follows from the spending x of every player; the fine is a transfer, so it is not in the cost
export function outcomes(V, c, q, n, B, lam, x) {
  const cost = (c / q) * x ** q
  return {
    tc: n * cost,
    D: (n * cost) / V,
    payoff: V / n - cost - lam * Math.max(x - B, 0),
  }
}
