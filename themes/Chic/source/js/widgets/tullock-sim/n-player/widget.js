// Tullock contest simulator for n players (the second post). Embed:
//   <div class="tullock-sim" data-kind="n-player" data-zip="https://.../tullock-sim-{lang}.zip"></div>
// plus `tullock_sim: true` in the post front matter.
import { Contest } from '../core/contest.js'
import { run } from '../core/summary.js'
import { runSymmetric } from '../core/symmetric.js'
import { isSymmetric, startNear } from '../core/analysis.js'
import { sweepByN, N_FULL } from '../core/byn.js'
import { LANG, el, fmt, typeset } from '../ui/dom.js'
import { makePlot } from '../ui/plot.js'
import { sliders, option, resetButton, loadState, saveState } from '../ui/controls.js'
import { header, tabBar, readout, evenRows } from '../ui/chrome.js'
import { figureByN, figureDeviation, figureDynamics } from './figures.js'
import { T } from './text.js'

const STORE = 'tullock-sim:n:v2'
// n moves on a log scale up to 1000; r runs past n / (n - 1) on purpose: the point is to watch the equilibrium disappear
const DEFS = { n: [2, 1000, 1, 5, 'log'], r: [0.2, 2.5, 0.01, 1], V: [20, 100, 10, 100], c: [1, 4, 0.01, 1] }
const MODES = ['byN', 'dev', 'dyn']
const KEYS = ['form', 'eq', 'pay', 'tc', 'diss', 'cond']
const sum = (a) => a.reduce((x, y) => x + y, 0)

export function mount(box) {
  const zip = (box.dataset.zip || '').replace('{lang}', LANG)
  box.replaceChildren()
  const saved = loadState(STORE)
  let mode = MODES.includes(saved.mode) ? saved.mode : 'byN'
  let near = saved.near === true
  let sweepFor = '', sweep = null

  const persist = () => saveState(STORE, { ...Object.fromEntries(Object.keys(DEFS).map((k) => [k, ctl.val[k]])), mode, near })
  let pending = false
  const schedule = () => {
    if (pending) return
    pending = true
    requestAnimationFrame(() => { pending = false; update(); persist() })
  }

  const ctl = sliders({ defs: DEFS, labels: T, saved, onInput: schedule })
  const startOpt = option(T.near, near, (v) => { near = v; schedule() })
  const reset = resetButton(T.reset, () => { ctl.reset(); near = false; startOpt.set(false); update(); persist() })
  const tabs = tabBar([['byN', T.tabN], ['dev', T.tabDev], ['dyn', T.tabDyn]], mode, (m) => { mode = m; update(true); persist() })
  const plot = makePlot()
  const note = el('p', { className: 'ts-note', hidden: true })
  const warn = el('p', { className: 'ts-warn', hidden: true })
  const table = readout(KEYS, T)
  const left = el('div', { className: 'ts-left' }, tabs, plot.root)
  const right = el('div', { className: 'ts-right' }, ctl.box, el('div', { className: 'ts-row' }, startOpt.root, reset), note, warn, table.table)
  box.append(header(T.title, zip, T.zip), el('div', { className: 'ts-main' }, left, right))
  const fit = evenRows(left, right, Object.keys(DEFS).length + 1 + KEYS.length)

  // the sweep over n does not depend on n itself: keep it while only n moves
  function sweepOf(v) {
    const key = [v.V, v.c, v.r].join()
    if (key !== sweepFor) { sweep = sweepByN(v.V, v.c, v.r); sweepFor = key }
    return sweep
  }

  function simulate(v) {
    if (v.n > N_FULL) return runSymmetric(v.V, v.c, v.r, v.n)
    const x0 = near ? startNear(new Contest(v.V, v.c, v.r, v.n)) : undefined
    return run(v.V, v.c, v.r, v.n, 2, { x0 })
  }

  function figureOf(v, s) {
    if (mode === 'byN') return figureByN(sweepOf(v), s, v)
    if (mode === 'dev') return figureDeviation(s.game)
    return figureDynamics(s, s.game)
  }

  function explain(s, sym, v) {
    const eq = s.equilibrium
    note.hidden = v.n <= N_FULL
    note.textContent = ''
    if (!note.hidden) { note.textContent = T.big(N_FULL); typeset(note) }
    let text = ''
    if (!sym) {
      if (v.n > N_FULL) text = T.warnNone
      else if (!eq.converged) text = T.warnNo
      else text = T.warnOut(eq.x.filter((xi) => xi > 1e-3 * Math.max(...eq.x)).length, v.n)
    }
    warn.hidden = sym
    if (text) { warn.textContent = text; typeset(warn) }
  }

  function update(fresh = false) {
    const v = ctl.val, s = simulate(v)
    plot.show(figureOf(v, s), fresh)
    const x = s.equilibrium.x, ok = s.equilibrium.converged, sym = ok && isSymmetric(x)
    explain(s, sym, v)
    fit()
    table.set('form', fmt(s.closedForm, 3))
    table.set('eq', ok ? fmt(sum(x) / x.length, 3) : '—')
    table.set('pay', ok ? fmt(sum(s.payoff) / s.payoff.length, 4) : '—')
    table.set('tc', ok ? fmt(v.c * sum(x), 2) : '—')
    table.set('diss', ok ? fmt(s.dissipation, 4) : '—')
    table.set('cond', `${s.hasPureEquilibrium ? T.holds : T.fails}（${fmt(v.r)} ${s.hasPureEquilibrium ? '≤' : '>'} ${fmt(v.n / (v.n - 1), 3)}）`)
  }
  update()
}
