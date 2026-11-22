// Turns a formula into the <img> tag of the mail. The picture is a PNG the admin browser drew and stored in the
// private bucket; only a signed link on our own storage origin is accepted (images.mjs). The LaTeX source goes in
// the alt text, escaped. Without a usable picture the formula stays as plain escaped text.
import { escapeHtml } from './escape.mjs'
import { imageResolver } from './images.mjs'
import { mathKey } from './mathTokens.mjs'

const INLINE_STYLE = (d) => `display:inline-block;vertical-align:${-d}px;border:0;margin:0 1px`
const DISPLAY_STYLE = 'display:inline-block;max-width:100%;height:auto;border:0'
const BLOCK_STYLE = 'margin:0 0 14px;text-align:center'

// { origin, images, math } -> (item) => html or null; item: { display, tex, raw } from maskMath
export function mathResolver({ origin, images = {}, math = [] } = {}) {
  const url = imageResolver({ origin, images })
  const byKey = new Map(math.map((m) => [mathKey(m.display, m.tex), m]))
  return (item) => {
    const m = byKey.get(mathKey(item.display, item.tex))
    const src = m && url(m.path)
    if (!src) return null
    const img = `<img src="${escapeHtml(src)}" alt="${escapeHtml(item.raw)}" width="${m.w}" height="${m.h}" style="${item.display ? DISPLAY_STYLE : INLINE_STYLE(m.d)}">`
    return item.display ? `<div style="${BLOCK_STYLE}">${img}</div>` : img
  }
}

// the stored file names the mail has to sign
export const mathPaths = (math = []) => [...new Set(math.map((m) => m.path))]
