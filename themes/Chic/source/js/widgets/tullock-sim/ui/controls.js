// Sliders, the check box and the reset button, plus remembering them in this browser.
import { el, typeset } from './dom.js'

// what the reader set is kept in localStorage; any failure (private mode, blocked storage) just means no memory
export const loadState = (key) => {
  try { return JSON.parse(localStorage.getItem(key)) || {} } catch (e) { return {} }
}
export const saveState = (key, state) => {
  try { localStorage.setItem(key, JSON.stringify(state)) } catch (e) { /* ignore */ }
}

// defs: { name: [min, max, step, default] }, or [min, max, step, default, 'log'] for a whole-number slider
// that moves on a log scale (so 2..1000 stays usable). onInput() runs after any slider moves.
export function sliders({ defs, labels, saved, onInput }) {
  const val = {}, inputs = {}, outputs = {}
  const box = el('div', { className: 'ts-ctl' })
  for (const k in defs) {
    const [lo, hi, st, d0, kind] = defs[k]
    const log = kind === 'log'
    const toPos = (v) => Math.round((1000 * Math.log(v / lo)) / Math.log(hi / lo))
    const fromPos = (p) => Math.round(lo * (hi / lo) ** (p / 1000))
    const v0 = typeof saved[k] === 'number' && saved[k] >= lo && saved[k] <= hi ? saved[k] : d0
    const inp = log ? el('input', { type: 'range', min: 0, max: 1000, step: 1, value: toPos(v0) }) : el('input', { type: 'range', min: lo, max: hi, step: st, value: v0 })
    const out = el('output', { textContent: v0 })
    val[k] = v0
    inputs[k] = inp
    outputs[k] = out
    inp.addEventListener('input', () => { val[k] = log ? fromPos(+inp.value) : +inp.value; out.textContent = val[k]; onInput() })
    box.append(el('label', { textContent: labels[k] }), inp, out)
  }
  typeset(box)
  return {
    box,
    val,
    reset() {
      for (const k in defs) {
        const [lo, hi, , d0, kind] = defs[k]
        val[k] = d0
        inputs[k].value = kind === 'log' ? Math.round((1000 * Math.log(d0 / lo)) / Math.log(hi / lo)) : d0
        outputs[k].textContent = d0
      }
    },
  }
}

// the animated check box used for "show the reaction path"
export function option(text, checked, onChange) {
  const chk = el('input', { type: 'checkbox', checked })
  chk.addEventListener('change', () => onChange(chk.checked))
  const mark = el('span', { className: 'ts-box' })
  mark.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" pathLength="1"/></svg>'
  const root = el('label', { className: 'ts-opt' }, chk, mark, text)
  return { root, set: (v) => { chk.checked = v } }
}

export const resetButton = (text, onClick) => {
  const b = el('button', { type: 'button', className: 'ts-reset', textContent: text })
  b.addEventListener('click', onClick)
  return b
}
