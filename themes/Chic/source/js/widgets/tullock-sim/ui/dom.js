// Small DOM helpers shared by every widget.
export const LANG = (document.documentElement.lang || 'zh').toLowerCase().startsWith('zh') ? 'zh' : 'en'

// el('div', { className: 'x' }, child, 'text')
export function el(tag, props = {}, ...kids) {
  const e = Object.assign(document.createElement(tag), props)
  e.append(...kids)
  return e
}

const NS = 'http://www.w3.org/2000/svg'
export function svgEl(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag)
  for (const k in attrs) e.setAttribute(k, attrs[k])
  if (parent) parent.appendChild(e)
  return e
}

export const fmt = (v, d = 2) => (v === null || v === undefined ? '—' : Number(v).toFixed(d))
export const pct = (v, total) => `${(v / total) * 100}%`

// MathJax is loaded asynchronously by the page: typeset once it is there. The synchronous
// MathJax.typeset is used on purpose: typesetPromise waits for the page's startup promise,
// which the page config leaves pending, so it would never run.
export function typeset(node) {
  const go = () => {
    const mj = window.MathJax
    if (mj && typeof mj.typeset === 'function') {
      try { mj.typeset([node]) } catch (e) { console.error(e) }
    } else setTimeout(go, 100)
  }
  go()
}
