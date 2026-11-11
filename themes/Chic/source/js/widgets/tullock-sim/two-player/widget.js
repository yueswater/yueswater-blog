// Tullock contest simulator, two players (the first post). Embed:
//   <div class="tullock-sim" data-zip="https://.../tullock-sim-{lang}.zip"></div>
// plus `tullock_sim: true` in the post front matter. Do not put a raw <script> in the post body:
// kramed swallows everything after it.
import { run } from '../core/summary.js'
import { LANG, el, fmt, typeset } from '../ui/dom.js'
import { makePlot } from '../ui/plot.js'
import { sliders, option, resetButton, loadState, saveState } from '../ui/controls.js'
import { header, tabBar, readout, evenRows } from '../ui/chrome.js'
import { downloadRow } from '../ui/export.js'
import { FIGURE, FILE } from './figures.js'
import { T } from './text.js'

const STORE = 'tullock-sim:v1'
// r stops at 2: beyond it the equilibrium payoff (2 - r)V/4 is negative and no pure-strategy equilibrium exists
const DEFS = { V: [20, 100, 10, 100], c: [1, 4, 0.01, 1], r: [0.2, 2, 0.01, 1], x1: [0, 100, 1, 60], x2: [0, 100, 1, 40] }
const MODES = ['br', 'pay', 'win']
const KEYS = ['eq', 'p', 'pay', 'diss', 'demo']

export function mount(box) {
  const zip = (box.dataset.zip || '').replace('{lang}', LANG)
  box.replaceChildren()
  const saved = loadState(STORE)
  let mode = MODES.includes(saved.mode) ? saved.mode : 'br'
  let path = saved.path === true
  let figure = null

  const persist = () => saveState(STORE, { ...Object.fromEntries(Object.keys(DEFS).map((k) => [k, ctl.val[k]])), path, mode })
  let pending = false
  const schedule = () => {
    if (pending) return
    pending = true
    requestAnimationFrame(() => { pending = false; update(); persist() })
  }

  const ctl = sliders({ defs: DEFS, labels: T, saved, onInput: schedule })
  const opt = option(T.path, path, (v) => { path = v; schedule() })
  opt.root.hidden = mode !== 'br'
  const reset = resetButton(T.reset, () => { ctl.reset(); path = false; opt.set(false); update(); persist() })
  const row = el('div', { className: 'ts-row' }, opt.root, reset)
  const tabs = tabBar([['br', T.tabBr], ['pay', T.tabPay], ['win', T.tabWin]], mode, (m) => {
    mode = m
    opt.root.hidden = mode !== 'br'
    update(true)
    persist()
  })
  const plot = makePlot()
  const warn = el('p', { className: 'ts-warn', textContent: T.warn, hidden: true })
  const table = readout(KEYS, T)
  const dl = downloadRow(T.dl, () => FILE[mode], () => figure)

  // wide: the figure on the left, the sliders and numbers on the right; narrow: stacked
  const left = el('div', { className: 'ts-left' }, tabs, plot.root, dl)
  const right = el('div', { className: 'ts-right' }, ctl.box, row, warn, table.table)
  box.append(header(T.title, zip, T.zip), el('div', { className: 'ts-main' }, left, right))
  typeset(warn)
  const fit = evenRows(left, right, Object.keys(DEFS).length + 1 + KEYS.length)

  function update(fresh = false) {
    const v = ctl.val, s = run(v.V, v.c, v.r)
    figure = FIGURE[mode](s, { x1: v.x1, x2: v.x2, path })
    plot.show(figure, fresh)
    const e = s.equilibrium, ok = e.converged
    warn.hidden = ok
    fit()
    table.set('eq', ok ? e.x.map((x) => fmt(x)).join(', ') : '—')
    table.set('p', ok ? s.winProb.map((x) => fmt(x, 3)).join(', ') : '—')
    table.set('pay', ok ? s.payoff.map((x) => fmt(x)).join(', ') : '—')
    table.set('diss', ok ? fmt(s.dissipation, 3) : '—')
    // p_1 for the two expenditures the reader picked, with the same contest function as run()
    const p1 = s.game.winProb(v.x1, v.x2 ** v.r)
    table.set('demo', [p1, 1 - p1].map((x) => fmt(x, 3)).join(', '))
  }
  update()
}
