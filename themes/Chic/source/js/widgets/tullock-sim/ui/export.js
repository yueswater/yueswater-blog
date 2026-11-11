// Downloading a figure. The figure you get is its own SVG in the bw-math-diagrams style: black lines,
// transparent background, arrow axes, every label LaTeX-set (paths from labels.generated.js), so it
// needs no font and no MathJax. PNG is that SVG drawn on a white canvas; PDF is made from it by
// jsPDF + svg2pdf.js, loaded only when asked.
import { LABELS } from '../labels.generated.js'

const K = 1.2
const EW = 410, EH = 412

// fig: { els, labels, legend } as the figure modules return it
export function figureToSvg(fig) {
  const out = [fig.els.replace(/class="ts-dot"/g, 'fill="currentColor"').replace(/class="ts-path"/g, 'stroke="currentColor"')]
  const lab = (key, x, y, ax, ay, k = K) => {
    const l = LABELS[key]
    if (l) out.push(`<g fill="currentColor" transform="translate(${(x - ax * l.w * k).toFixed(2)} ${(y - ay * l.h * k).toFixed(2)}) scale(${k})">${l.body}</g>`)
  }
  for (const l of fig.labels) lab(l.key, l.x, l.y, l.ax, l.ay)
  fig.legend.forEach((e, i) => {
    const l = LABELS[e.key] || { w: 0 }
    const y = 20 + i * 24
    const x0 = EW - 6 - l.w * 1.1
    out.push(`<path d="M${x0 - 36} ${y}h28" fill="none" stroke="currentColor" stroke-width="1.6"${e.dash}/>`)
    lab(e.key, x0, y, 0, 0.5, 1.1)
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${EW} ${EH}" width="${EW}" height="${EH}" color="#000">${out.join('')}</svg>`
}

function save(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

function svgToPng(svg, scale = 3) {
  const sized = svg.replace(`width="${EW}" height="${EH}"`, `width="${EW * scale}" height="${EH * scale}"`)
  const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml;charset=utf-8' }))
  return new Promise((ok, no) => {
    const img = new Image()
    img.onload = () => {
      const cv = Object.assign(document.createElement('canvas'), { width: EW * scale, height: EH * scale })
      const ctx = cv.getContext('2d')
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, cv.width, cv.height)
      ctx.drawImage(img, 0, 0, cv.width, cv.height)
      cv.toBlob((b) => (b ? ok(b) : no(new Error('png'))), 'image/png')
    }
    img.onerror = () => no(new Error('svg image'))
    img.src = url
  }).finally(() => URL.revokeObjectURL(url))
}

const loadScript = (src) => new Promise((ok, no) => {
  if (document.querySelector(`script[src="${src}"]`)) return ok()
  document.head.appendChild(Object.assign(document.createElement('script'), { src, onload: ok, onerror: no }))
})

async function svgToPdf(svg) {
  await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js')
  await loadScript('https://cdn.jsdelivr.net/npm/svg2pdf.js@2.2.4/dist/svg2pdf.umd.min.js')
  const w = EW * 0.75, h = EH * 0.75
  const holder = Object.assign(document.createElement('div'), { innerHTML: svg })
  holder.style.cssText = 'position:fixed;left:-9999px;top:0'
  document.body.appendChild(holder)
  try {
    const doc = new window.jspdf.jsPDF({ unit: 'pt', format: [w, h], orientation: w > h ? 'l' : 'p' })
    await doc.svg(holder.firstElementChild, { x: 0, y: 0, width: w, height: h })
    return doc.output('blob')
  } finally {
    holder.remove()
  }
}

// format: 'svg' | 'png' | 'pdf'
export async function download(fig, baseName, format) {
  const svg = figureToSvg(fig)
  const name = `${baseName}.${format}`
  if (format === 'svg') save(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), name)
  else if (format === 'png') save(await svgToPng(svg), name)
  else save(await svgToPdf(svg), name)
}

// the "download figure" row: label + SVG / PNG / PDF buttons. getFigure() returns the figure on show.
export function downloadRow(label, baseName, getFigure) {
  const row = Object.assign(document.createElement('div'), { className: 'ts-dl' })
  row.append(label)
  for (const f of ['svg', 'png', 'pdf']) {
    const b = Object.assign(document.createElement('button'), { type: 'button', textContent: f.toUpperCase() })
    b.addEventListener('click', async () => {
      b.disabled = true
      try { await download(getFigure(), baseName(), f) } catch (e) { console.error(e) } finally { b.disabled = false }
    })
    row.append(b)
  }
  return row
}
