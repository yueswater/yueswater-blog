/**
 * Inline TeX -> self-contained SVG at build time (MathJax 4, TeX Gyre Pagella, the same font the posts
 * use), so titles in lists and prev/next links show their math at once, with no MathJax download
 * and no typesetting in the browser. The SVG draws its glyphs as paths: no web font is needed.
 */
const SRC = '@mathjax/src/cjs/';
const { mathjax } = require(SRC + 'mathjax.js');
const { TeX } = require(SRC + 'input/tex.js');
const { SVG } = require(SRC + 'output/svg.js');
const { liteAdaptor } = require(SRC + 'adaptors/liteAdaptor.js');
const { RegisterHTMLHandler } = require(SRC + 'handlers/html.js');
// file names are case-sensitive on Linux (Vercel): NoUndefined, not Noundefined
for (const [dir, file] of [['base', 'Base'], ['ams', 'Ams'], ['newcommand', 'Newcommand'], ['noundefined', 'NoUndefined']]) {
  require(SRC + 'input/tex/' + dir + '/' + file + 'Configuration.js');
}
const { MathJaxPagellaFont } = require('@mathjax/mathjax-pagella-font/cjs/svg.js');

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const doc = mathjax.document('', {
  InputJax: new TeX({ packages: ['base', 'ams', 'newcommand', 'noundefined'] }),
  OutputJax: new SVG({ fontData: MathJaxPagellaFont, fontCache: 'none' }),
});

const cache = new Map();

// the <mjx-container> markup for one inline formula (the same tex always gives the same markup)
module.exports = function texSvg(tex) {
  if (!cache.has(tex)) cache.set(tex, adaptor.outerHTML(doc.convert(tex, { display: false })));
  return cache.get(tex);
};
