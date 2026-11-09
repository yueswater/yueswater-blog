// Theme: palette and fonts for the downloadable reports. Everything visual is set here.
// Colours are the site's (see themes/Chic/source/css/variable.styl).

// ---- Palette: one accent (the site blue), every other tone derived from it ----------
#let primary = rgb("#1747e6")           // cover, headings, table header, links
#let border = primary.lighten(50%)      // table borders
#let tint = primary.lighten(70%)        // secondary text on the blue band
#let tint-light = primary.lighten(90%)  // code-block fill, running-header text
#let page-bg = rgb("#f4f9fd")           // the site's paper colour
#let ink = rgb("#0f172a")               // default text colour
#let muted = rgb("#4a5f7a")             // captions, small print

// ---- Fonts (installed system fonts; PDFs are built locally and the file is committed) -
#let sans-en = "Roboto"
#let zh = "Noto Sans TC"
#let mono = "JetBrains Mono"
#let math-font = "New Computer Modern Math"
#let body-leading = 0.8em  // line gap; also the gap around figures, tables and lists

#let body-fonts = (sans-en, zh)
#let heading-fonts = (sans-en, zh)

#let setup-text(doc) = {
  set text(font: body-fonts, weight: "regular", size: 10.5pt, lang: "zh", region: "tw", fill: ink)
  show strong: set text(font: heading-fonts, weight: "bold")
  show emph: set text(style: "italic")
  show raw: set text(font: (mono, zh), size: 0.92em)
  doc
}
