// LaTeX to a self-contained SVG with MathJax (the font the site's posts use), entirely in the browser: glyphs are
// paths, so no web font, no network and nothing for the canvas to taint on.
import { mathjax } from '@mathjax/src/js/mathjax.js'
import { TeX } from '@mathjax/src/js/input/tex.js'
import { SVG } from '@mathjax/src/js/output/svg.js'
import { liteAdaptor } from '@mathjax/src/js/adaptors/liteAdaptor.js'
import { RegisterHTMLHandler } from '@mathjax/src/js/handlers/html.js'
import '@mathjax/src/js/input/tex/base/BaseConfiguration.js'
import '@mathjax/src/js/input/tex/ams/AmsConfiguration.js'
import '@mathjax/src/js/input/tex/newcommand/NewcommandConfiguration.js'
import '@mathjax/src/js/input/tex/noundefined/NoUndefinedConfiguration.js'
import { MathJaxPagellaFont } from '@mathjax/mathjax-pagella-font/js/svg.js'
import './fonts.js'

mathjax.asyncLoad = async () => {} // every glyph range is already bundled (fonts.js)
const adaptor = liteAdaptor()
RegisterHTMLHandler(adaptor)
const doc = mathjax.document('', {
  InputJax: new TeX({ packages: ['base', 'ams', 'newcommand', 'noundefined'] }),
  OutputJax: new SVG({ fontData: MathJaxPagellaFont, fontCache: 'none' }),
})

const num = (s, name) => { const m = s.match(new RegExp(`${name}="(-?[\\d.]+)ex"`)); return m ? Number(m[1]) : NaN }

// -> { inner, viewBox, wEx, hEx, dEx } for one formula; throws when MathJax cannot parse it
export async function texToSvg(tex, display) {
  const html = await mathjax.handleRetriesFor(() => adaptor.outerHTML(doc.convert(tex, { display })))
  const open = html.match(/<svg\b[^>]*>/)
  const end = html.lastIndexOf('</svg>')
  if (!open || end < 0 || /data-mml-node="merror"/.test(html)) throw new Error('bad latex')
  const tag = open[0]
  const dMatch = tag.match(/vertical-align:\s*(-?[\d.]+)ex/)
  const viewBox = (tag.match(/viewBox="([^"]+)"/) || [])[1]
  const out = { inner: html.slice(open.index + tag.length, end), viewBox, wEx: num(tag, 'width'), hEx: num(tag, 'height'), dEx: dMatch ? -Number(dMatch[1]) : 0 }
  if (!viewBox || !(out.wEx > 0) || !(out.hEx > 0)) throw new Error('bad latex')
  return out
}
