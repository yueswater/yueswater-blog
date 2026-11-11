// Two scrolling columns, hours 00 to 23 and minutes in steps of 5. `onPick(hour, minute)` fires on every click.
import { el } from '../dom.js'

const pad = (n) => String(n).padStart(2, '0')
export const STEP = 5

export function createTimePicker(selected, onPick) {
  let h = selected.getHours(), m = selected.getMinutes()
  const column = (name, values, current, pick) => {
    const items = values.map((v) => el('button', {
      class: 'tc-item', type: 'button', 'data-v': v,
      onclick: () => { pick(v); onPick(h, m); mark() },
    }, pad(v)))
    return { name, items, node: el('div', { class: 'tc-col', role: 'listbox', 'aria-label': name }, ...items), current }
  }
  const hours = column('時', Array.from({ length: 24 }, (_, i) => i), () => h, (v) => { h = v })
  const mins = column('分', Array.from({ length: 60 / STEP }, (_, i) => i * STEP), () => m, (v) => { m = v })

  function mark() {
    for (const c of [hours, mins]) for (const b of c.items) b.classList.toggle('on', Number(b.dataset.v) === c.current())
  }
  mark()
  const node = el('div', { class: 'tc' }, hours.node, mins.node)
  // call once the panel is visible: bring the chosen hour and minute into view
  const reveal = () => { for (const c of [hours, mins]) c.node.scrollTop = c.node.querySelector('.on').offsetTop - c.node.offsetHeight / 2 + 16 }
  return { node, reveal }
}
