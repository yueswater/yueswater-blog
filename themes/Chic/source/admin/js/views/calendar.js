// A month grid: click a day. `onPick(date)` fires with midnight of that day; `set(date)` moves the selection.
import { el } from '../dom.js'

const WEEK = ['日', '一', '二', '三', '四', '五', '六']
const sameDay = (a, b) => a.toDateString() === b.toDateString()

export function createCalendar(selected, onPick) {
  let sel = selected
  let view = new Date(sel.getFullYear(), sel.getMonth(), 1)
  const title = el('span', { class: 'cal-title' })
  const grid = el('div', { class: 'cal-grid' })
  const step = (n) => el('button', {
    class: 'cal-nav', type: 'button', 'aria-label': n < 0 ? '上個月' : '下個月',
    onclick: () => { view = new Date(view.getFullYear(), view.getMonth() + n, 1); draw() },
  }, n < 0 ? '‹' : '›')

  function draw() {
    title.textContent = `${view.getFullYear()} 年 ${view.getMonth() + 1} 月`
    const first = new Date(view.getFullYear(), view.getMonth(), 1 - view.getDay())
    const today = new Date()
    const days = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i)
      const cls = ['cal-day', d.getMonth() !== view.getMonth() && 'out', sameDay(d, today) && 'today', sameDay(d, sel) && 'on']
      return el('button', { class: cls.filter(Boolean).join(' '), type: 'button', onclick: () => { sel = d; onPick(d); draw() } }, String(d.getDate()))
    })
    grid.replaceChildren(...WEEK.map((w) => el('span', { class: 'cal-wd' }, w)), ...days)
  }

  draw()
  return { node: el('div', { class: 'cal' }, el('div', { class: 'cal-head' }, step(-1), title, step(1)), grid) }
}
