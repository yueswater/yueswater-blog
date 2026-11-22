// One formula to a transparent PNG: the SVG is drawn onto a canvas through a data: URL image (no foreignObject, no
// remote files, so Chrome and Safari both leave the canvas untainted).
import { texToSvg } from './engine.js'
import { layoutFormula, fitScale, MATH_RASTER_SCALE, TEXT_COLOR } from './layout.mjs'

const svgText = (m, wPx, hPx) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${wPx}" height="${hPx}" viewBox="${m.viewBox}" style="color:${TEXT_COLOR}">${m.inner}</svg>`

function loadImage(svg) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('svg image failed'))
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })
}

// the logical size, with no drawing (cheap): { w, h, d, shrunk }
export async function measure(tex, display) {
  const { w, h, d, shrunk } = layoutFormula(await texToSvg(tex, display), display)
  return { w, h, d, shrunk }
}

export async function rasterize(tex, display, scale = MATH_RASTER_SCALE) {
  const m = await texToSvg(tex, display)
  const L = layoutFormula(m, display)
  const w = display ? L.w : Math.max(1, Math.round(L.w))
  const h = Math.max(1, Math.round(L.h))
  const s = fitScale(w, h, scale)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.floor(w * s))
  canvas.height = Math.max(1, Math.floor(h * s))
  const img = await loadImage(svgText(m, Math.max(1, L.drawW * s), Math.max(1, L.drawH * s)))
  canvas.getContext('2d').drawImage(img, L.x * s, 0, L.drawW * s, L.drawH * s)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('canvas export failed')
  return { blob, w, h, d: Math.round(L.d * 10) / 10, shrunk: L.shrunk, scale: s }
}
