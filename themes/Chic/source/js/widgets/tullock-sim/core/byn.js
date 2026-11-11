// The equilibrium as the number of players n grows, one row per n (no DOM).
// Every row is a symmetric pure equilibrium, found numerically:
//   n <= r/(r-1) (or r <= 1): all n players spend the same positive amount.
//   n >  r/(r-1): no all-in equilibrium exists, but k = floor(r/(r-1)) players spending x and the rest staying
//   out is one, as long as an outsider does not want in. That equilibrium does not depend on n, so it is solved once.
import { Contest } from './contest.js'

export const N_FULL = 20 // up to here the widget simulates every player; beyond it only the symmetric equilibrium
export const N_MAX = 1000
const NS = [2, 3, 4, 5, 7, 10, 15, 20, 30, 50, 100, 200, 500, 1000] // the plotted n: few enough that the markers do not pile up on the log axis

// the largest all-in size: r <= k / (k - 1)  <=>  k <= r / (r - 1)
export const allInLimit = (r) => (r > 1 ? Math.floor(r / (r - 1) + 1e-9) : Infinity)

// k active players with the others out: the largest k whose symmetric solution survives the entry test, or null
export function activeEquilibrium(V, c, r, kMax) {
  for (let k = kMax; k >= 2; k--) {
    const x = new Contest(V, c, r, k).symmetricEquilibrium()
    if (x === null) continue
    if (new Contest(V, c, r, k + 1).bestResponse(k * x ** r) === 0) return { k, x }
  }
  return null
}

// a sweep over n for fixed V, c, r: `at(n)` is the row { n, k, share, D } (share = c x / V of an active player,
// D = k share), or null when no symmetric pure equilibrium exists; `rows` are the rows for the plotted n.
export function sweepByN(V, c, r) {
  const top = allInLimit(r)
  let partial
  const at = (n) => {
    let k, x
    if (n <= top) {
      k = n
      x = new Contest(V, c, r, n).symmetricEquilibrium()
    } else {
      partial ??= activeEquilibrium(V, c, r, top) ?? false
      if (partial) ({ k, x } = partial)
    }
    if (x == null) return null
    return { n, k, share: (c * x) / V, D: (k * c * x) / V }
  }
  return { top, at, rows: NS.map(at).filter(Boolean) }
}
