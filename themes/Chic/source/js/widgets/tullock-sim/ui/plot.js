// The drawing area: an SVG for the curves, HTML spans (one per label slot) laid over it so MathJax
// can typeset the labels.
import { el, svgEl, typeset, pct } from './dom.js'

export function makePlot(W = 400, H = 400) {
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' })
  const legend = el('div', { className: 'ts-leg' })
  // labels are placed in percent of this inner box, so it must be exactly as tall as the SVG
  const inner = el('div', { className: 'ts-in' }, svg, legend)
  const root = el('div', { className: 'ts-plot' }, inner)
  let spans = {}
  let legendFor = null

  function placeLabels(labels) {
    const live = new Set()
    for (const l of labels) {
      live.add(l.id)
      let sp = spans[l.id]
      if (!sp || sp.dataset.tex !== l.tex) {
        if (sp) sp.remove()
        sp = el('span', { className: 'ts-lab', textContent: l.tex })
        sp.dataset.tex = l.tex
        inner.append(sp)
        spans[l.id] = sp
        typeset(sp)
      }
      sp.style.cssText = `left:${pct(l.x, W)};top:${pct(l.y, H)};transform:translate(${-l.ax * 100}%,${-l.ay * 100}%)`
    }
    for (const id in spans) if (!live.has(id)) { spans[id].remove(); delete spans[id] }
  }

  function placeLegend(entries) {
    if (legendFor === entries) return
    legendFor = entries
    legend.replaceChildren()
    for (const e of entries) {
      const s = svgEl('svg', { viewBox: '0 0 30 6' })
      // a legend entry is a line sample, or a dot sample (filled or open) when `dot` is set
      if (e.dot) svgEl('circle', { cx: 15, cy: 3, r: 2.6, fill: e.dot === 'open' ? 'none' : 'var(--ts-accent)', stroke: e.dot === 'open' ? 'currentColor' : 'none', 'stroke-width': 1.4 }, s)
      else svgEl('path', { d: 'M0 3H30', stroke: 'currentColor', 'stroke-width': 1.8, ...(e.dash ? { 'stroke-dasharray': '4 3' } : {}) }, s)
      legend.append(el('span', { className: 'ts-le' }, s, el('span', { textContent: e.tex })))
    }
    typeset(legend)
  }

  return {
    root,
    // `fresh` drops every label slot (used when the tab changes, as ids mean different things)
    show(fig, fresh) {
      svg.innerHTML = fig.els
      if (fresh) { for (const id in spans) spans[id].remove(); spans = {} }
      placeLabels(fig.labels)
      placeLegend(fig.legend)
      // a figure can move the legend down a notch (fig.legendTop, e.g. '34%') when the corner is where its curves are,
      // or put it in a row under the plot (fig.legendBelow)
      legend.style.top = fig.legendTop || ''
      legend.classList.toggle('below', !!fig.legendBelow)
      ;(fig.legendBelow ? root : inner).append(legend)
    },
  }
}
