// A date and time field in the admin's own style: a button showing the value, opening a calendar and two time columns.
import { el, fmtTime } from '../dom.js'
import { createCalendar } from './calendar.js'
import { createTimePicker, STEP } from './timeColumns.js'

// the next multiple of STEP minutes at or after `ms`
const snap = (ms) => new Date(Math.ceil(ms / (STEP * 60000)) * STEP * 60000)
const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>'

export function createDateTime(initialMs) {
  let value = snap(initialMs)
  const text = el('span', {})
  const icon = el('span', { class: 'dt-icon' })
  icon.innerHTML = ICON
  const field = el('button', { class: 'dt-field', type: 'button', 'aria-expanded': 'false', onclick: () => toggle() }, text, icon)
  const sync = () => { text.textContent = fmtTime(value.toISOString()) }
  const set = (y, mo, d, h, mi) => { value = new Date(y, mo, d, h, mi); sync() }

  const calendar = createCalendar(value, (d) => set(d.getFullYear(), d.getMonth(), d.getDate(), value.getHours(), value.getMinutes()))
  const time = createTimePicker(value, (h, mi) => set(value.getFullYear(), value.getMonth(), value.getDate(), h, mi))
  const panel = el('div', { class: 'dt-panel', hidden: true }, calendar.node, time.node)

  function toggle() {
    panel.hidden = !panel.hidden
    field.setAttribute('aria-expanded', String(!panel.hidden))
    if (!panel.hidden) time.reveal()
  }
  sync()
  return { node: el('div', { class: 'dt' }, field, panel), value: () => value }
}
