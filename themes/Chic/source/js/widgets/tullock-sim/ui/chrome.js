// The widget's frame: the brand bar, the tab bar and the read-out table.
import { el, typeset } from './dom.js'

// brand-coloured bar: title on the left, source download on the right
export function header(title, zipUrl, zipLabel) {
  const src = el('a', { href: zipUrl })
  src.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M4 20h16"/></svg>'
  src.append(zipLabel)
  const name = el('span', { className: 'ts-title', textContent: title })
  typeset(name) // the title may hold math: Tullock contest simulator ($n$ players)
  return el('div', { className: 'ts-head' }, name, src)
}

// tabs: [[id, label], ...]; onSelect(id) runs only when the tab changes
export function tabBar(items, current, onSelect) {
  const root = el('div', { className: 'ts-tabs', role: 'tablist' })
  const buttons = {}
  let now = current
  for (const [id, text] of items) {
    const b = el('button', { type: 'button', textContent: text, role: 'tab' })
    b.setAttribute('aria-selected', String(id === now))
    b.addEventListener('click', () => {
      if (id === now) return
      now = id
      for (const k in buttons) buttons[k].setAttribute('aria-selected', String(k === now))
      onSelect(id)
    })
    buttons[id] = b
    root.append(b)
  }
  return root
}

// a two-column table: label | value; set(key, text) fills a value
export function readout(keys, labels) {
  const cells = {}
  const table = el('table')
  for (const k of keys) {
    cells[k] = el('td')
    table.append(el('tr', {}, el('td', { textContent: labels[k] }), cells[k]))
  }
  typeset(table)
  return { table, set: (k, text) => { cells[k].textContent = text } }
}

// Side by side, the right column's rows (sliders, option row, table) share the left column's height evenly:
// the first row at the top, the last at the bottom, one --ts-pitch between them. Stacked (narrow), it unsets
// the pitch. Notes and warnings keep their own height. Returns the function that recomputes it.
export function evenRows(left, right, rows) {
  const fit = () => {
    const side = right.offsetLeft > left.offsetLeft
    const extra = [...right.querySelectorAll('.ts-note, .ts-warn')].reduce((h, e) => h + (e.hidden ? 0 : e.offsetHeight), 0)
    if (side) right.style.setProperty('--ts-pitch', `${(left.offsetHeight - extra) / rows}px`)
    else right.style.removeProperty('--ts-pitch')
  }
  new ResizeObserver(fit).observe(left)
  return fit
}
