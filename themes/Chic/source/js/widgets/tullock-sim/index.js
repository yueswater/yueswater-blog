// Entry point: finds every .tullock-sim box on the page and mounts the widget its data-kind names
// (default: two-player). Each widget is a separate module, loaded only when a page uses it.
import { installStyles } from './ui/styles.js'

const WIDGETS = {
  'two-player': () => import('./two-player/widget.js'),
  'n-player': () => import('./n-player/widget.js'),
}

async function init() {
  const boxes = [...document.querySelectorAll('.tullock-sim')]
  if (!boxes.length) return
  installStyles()
  for (const box of boxes) {
    const load = WIDGETS[box.dataset.kind || 'two-player']
    if (load) (await load()).mount(box)
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
else init()
