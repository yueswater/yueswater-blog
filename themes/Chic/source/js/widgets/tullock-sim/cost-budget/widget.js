// Tullock contest simulator for cost, budget and overspend penalty (the third post). Embed:
//   <div class="tullock-sim" data-kind="cost-budget"></div>
// plus `tullock_sim: true` in the post front matter.
import { PenalizedContest } from '../core/penalized.js'
import { formula, outcomes } from '../core/penalizedForm.js'
import { sweepByQ, sweepByB } from '../core/penalizedSweep.js'
import { el, fmt, typeset } from '../ui/dom.js'
import { makePlot } from '../ui/plot.js'
import { sliders, resetButton, loadState, saveState } from '../ui/controls.js'
import { header, tabBar, readout, evenRows } from '../ui/chrome.js'
import { figureByQ, figureByB, figureDynamics } from './figures.js'
import { T } from './text.js'

const STORE = 'tullock-sim:cb:v1'
const DEFS = { n: [2, 20, 1, 5], q: [1, 4, 0.05, 1], B: [1, 40, 0.5, 8], lam: [0, 3, 0.05, 0.5], V: [20, 100, 10, 100], c: [1, 4, 0.01, 1] }
const MODES = ['byQ', 'byB', 'dyn']
const KEYS = ['form', 'eq', 'pay', 'tc', 'diss', 'kind']
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length

export function mount(box) {
  box.replaceChildren()
  const saved = loadState(STORE)
  let mode = MODES.includes(saved.mode) ? saved.mode : 'byQ'

  const persist = () => saveState(STORE, { ...Object.fromEntries(Object.keys(DEFS).map((k) => [k, ctl.val[k]])), mode })
  let pending = false
  const schedule = () => {
    if (pending) return
    pending = true
    requestAnimationFrame(() => { pending = false; update(); persist() })
  }

  const ctl = sliders({ defs: DEFS, labels: T, saved, onInput: schedule })
  const reset = resetButton(T.reset, () => { ctl.reset(); update(); persist() })
  const tabs = tabBar([['byQ', T.tabQ], ['byB', T.tabB], ['dyn', T.tabDyn]], mode, (m) => { mode = m; update(true); persist() })
  const plot = makePlot()
  const warn = el('p', { className: 'ts-warn', hidden: true })
  const table = readout(KEYS, T)
  const left = el('div', { className: 'ts-left' }, tabs, plot.root)
  const right = el('div', { className: 'ts-right' }, ctl.box, el('div', { className: 'ts-row' }, reset), warn, table.table)
  box.append(header(T.title), el('div', { className: 'ts-main' }, left, right))
  const fit = evenRows(left, right, Object.keys(DEFS).length + 1 + KEYS.length)

  // a sweep is kept while only the sliders it does not depend on move
  const memo = {}
  const sweep = (name, make, v, keys) => {
    const key = keys.map((k) => v[k]).join()
    if (memo[name]?.key !== key) memo[name] = { key, value: make(v) }
    return memo[name].value
  }

  function figureOf(v, game, f, here, eq) {
    if (mode === 'byQ') return figureByQ(sweep('q', sweepByQ, v, ['V', 'c', 'n', 'B', 'lam']), v)
    if (mode === 'byB') return figureByB(sweep('b', sweepByB, v, ['V', 'c', 'q', 'n', 'lam']), v, here.D)
    return figureDynamics(eq.history, f.x, game.hi)
  }

  function update(fresh = false) {
    const v = ctl.val
    const game = new PenalizedContest(v.V, v.c, v.q, v.n, v.B, v.lam)
    const f = formula(v.V, v.c, v.q, v.n, v.B, v.lam)
    const here = outcomes(v.V, v.c, v.q, v.n, v.B, v.lam, f.x)
    const eq = game.findEquilibrium()
    plot.show(figureOf(v, game, f, here, eq), fresh)
    warn.hidden = eq.converged
    if (!eq.converged) { warn.textContent = T.warnNo; typeset(warn) }
    fit()
    const xBar = mean(eq.x)
    const num = outcomes(v.V, v.c, v.q, v.n, v.B, v.lam, xBar)
    table.set('form', fmt(f.x, 3))
    table.set('eq', eq.converged ? fmt(xBar, 3) : '—')
    table.set('pay', eq.converged ? fmt(num.payoff, 4) : '—')
    table.set('tc', eq.converged ? fmt(num.tc, 2) : '—')
    table.set('diss', eq.converged ? fmt(num.D, 4) : '—')
    table.set('kind', T[f.kind])
    typeset(table.table)
  }
  update()
}
