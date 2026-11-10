// Report template for downloadable posts.
// Layout derived from the SinoPac report template (itself based on @preview/breezy-report
// 0.1.0, (c) Breanna Barraclough, MIT, https://github.com/brebarra/breezy-report);
// palette, fonts, labels and logo are this site's. Everything visual lives in theme.typ.

#import "theme.typ": *

#let in-body = state("in-body", false)

#let end-report() = in-body.update(false)

// Small label used in front of the per-OS / per-variant blocks of a post's tab sets.
// Figure that scales itself: wide shots take 85% of the text width, tall ones shrink
// toward 70%, so a portrait screenshot never towers over the text around it.
// `limit` is an optional hard cap (the post's own max-width); height is capped too.
#let fit-figure(path, format: auto, limit: none, caption: none) = layout(size => {
  let src = image(path, format: format)
  let natural = measure(src)
  let r = natural.height / natural.width
  let t = calc.max(0, calc.min(1, (r - 0.6) / 1.0))
  let w = size.width * (0.85 - 0.15 * t)
  w = calc.min(w, 0.55 * 297mm / r)
  if limit != none { w = calc.min(w, limit) }
  figure(image(path, width: w, format: format), caption: caption)
})

// Cover title: a colon ends the first line ("主標：副標" puts the subtitle on its own line), and the
// type size steps down from 36pt until every line fits `w`, so a title stays within two lines.
// `code` spans in a title are set in the monospace face; plain() drops the backticks where only text is wanted.
#let plain(t) = t.replace("`", "")
#let rich(t) = t.split("`").enumerate().map(((i, seg)) => if calc.odd(i) { text(font: (mono, zh), weight: "bold", seg) } else { seg }).join()

#let cover-title(t, w) = context {
  let m = t.match(regex("[:：]"))
  let parts = if m == none { (t,) } else { (t.slice(0, m.end), t.slice(m.end).trim()) }
  let set-line(s, l) = text(size: s, font: heading-fonts, weight: "black", fill: white, top-edge: "ascender", bottom-edge: "descender", l)
  let sizes = (36pt, 34pt, 32pt, 30pt, 28pt, 26pt, 24pt)
  let fits(s) = parts.all(l => measure(set-line(s, rich(l))).width <= w)
  let chosen = sizes.last()
  for s in sizes {
    if fits(s) { chosen = s; break }
  }
  block(width: w, set-line(chosen, parts.map(rich).join(linebreak())))
}

// !!! note / tip / warning ... callouts: tinted block, brand-blue bar, bold title line.
#let admonition(kind, title, body) = block(width: 100%, fill: tint-light, stroke: (left: 2.5pt + primary), inset: (x: 12pt, y: 9pt), breakable: true, {
  text(font: heading-fonts, weight: "bold", fill: primary)[#title]
  v(0.35em)
  body
})

// ::: {.definition} / {.theorem} / {.lemma} / {.proposition} / {.example} callouts (the site's
// themes/Chic/scripts/theoremDiv.js). Every kind opens with a badge strip "定義：名稱". `kind` picks the
// look: definition = tinted block, thick bar, blue strip; theorem (also lemma, proposition) = outlined
// box, dark strip; example = open block with a dashed rule. `label` is the localised name, `title`
// optional content, `sep` the colon between them.
#let theorem-box(kind, label, title, body, sep: "：") = {
  // every kind opens with a badge strip that reads "定義：名稱"; the kind picks the look
  let head(fill) = text(font: body-fonts, size: 9.5pt, weight: "bold", fill: fill, {
    label
    if title != none { [#sep#title] }
  })
  let strip(bg, fg) = block(width: 100%, fill: bg, inset: (x: 12pt, y: 5pt), sticky: true, head(fg))
  if kind == "theorem" or kind == "lemma" or kind == "proposition" {
    block(width: 100%, stroke: 0.8pt + ink, inset: 0pt, breakable: true, above: 1.1em, below: 1.1em, {
      strip(ink, white)
      block(width: 100%, inset: (x: 12pt, y: 9pt), body)
    })
  } else if kind == "example" {
    block(width: 100%, stroke: (left: (paint: muted, thickness: 1.2pt, dash: "dashed")), inset: (left: 12pt, y: 0pt), breakable: true, above: 1.1em, below: 1.1em, {
      block(width: 100%, stroke: (bottom: (paint: muted, thickness: 0.6pt, dash: "dashed")), inset: (y: 5pt), sticky: true, head(muted))
      block(width: 100%, inset: (y: 8pt), body)
    })
  } else {
    block(width: 100%, fill: tint-light, stroke: (left: 3.5pt + primary), inset: 0pt, breakable: true, above: 1.1em, below: 1.1em, {
      strip(primary, white)
      block(width: 100%, inset: (x: 12pt, y: 9pt), body)
    })
  }
}

// Practice questions: one callout, numbered questions, options in 4 / 2 / 1 columns (chosen by the
// converter from option length), the answer always shown (a PDF cannot fold it away).
#let exercises-box(title, qs) = block(width: 100%, stroke: 0.6pt + border, fill: white, inset: 0pt, {
  block(width: 100%, inset: (x: 12pt, y: 9pt), stroke: (bottom: 0.6pt + border), sticky: true, {
    box(width: 7pt, height: 7pt, fill: primary)
    h(8pt)
    text(weight: "bold")[#title]
  })
  for (i, q) in qs.enumerate() {
    block(width: 100%, inset: 12pt, breakable: false, stroke: if i > 0 { (top: 0.6pt + border) } else { none },
      grid(columns: (22pt, 1fr), column-gutter: 8pt,
        box(width: 17pt, height: 17pt, fill: primary, align(center + horizon, text(fill: white, size: 8pt, weight: "bold", font: mono)[#str(i + 1)])),
        {
          q.stem
          if q.options.len() > 0 {
            v(0.4em)
            grid(columns: (1fr,) * q.cols, row-gutter: 0.55em, column-gutter: 12pt,
              ..q.options.enumerate().map(((j, o)) => grid(columns: (1.2em, 1fr),
                text(fill: primary, font: mono, size: 0.85em, weight: "bold", "ABCDEFGH".at(j)), o)))
          }
          if q.answer != none {
            v(0.7em)
            block(width: 100%, fill: tint-light, inset: (x: 9pt, y: 7pt), stroke: (left: 2pt + primary), q.answer)
          }
        }))
  }
})

#let tab-label(name) = block(above: 1.1em, below: 0.5em, sticky: true, {
  box(width: 0.5em, height: 0.5em, fill: primary)
  h(0.5em)
  text(font: heading-fonts, weight: "bold", size: 0.92em, fill: primary)[#name]
})

#let report(
  edition: "2026",
  date: datetime.today(),
  category: "Category",
  site: "岳氏礦泉水",
  lang: "zh",     // "zh" or "en": picks the labels (contents, figure, table)
  title: "Report Title",
  authors: (),    // array of (name, caption) pairs, already in display order
  url: none,      // address of the original post, printed on the cover
  accent: primary,
  body,
) = {
  show: setup-text

  // Paragraph gaps, display maths, figures, tables and lists are all one line gap apart.
  set par(leading: body-leading, spacing: 1.25em, justify: false)
  show math.equation: set text(font: (math-font, zh))
  show math.equation.where(block: true): set block(above: body-leading, below: body-leading)
  show figure: set block(above: 1.1em, below: 1.1em)
  show list: set block(above: body-leading, below: body-leading)
  show enum: set block(above: body-leading, below: body-leading)

  // Numbers without a trailing full stop (1, 1.1), then 1em before the title.
  set heading(numbering: (..nums) => [#nums.pos().map(str).join(".")#h(1em)])
  show heading: it => block(
    above: 1.6em,
    below: 0.9em,
    text(font: heading-fonts, weight: "bold", fill: accent, it),
  )

  // Code: white block on the paper colour, square, no border (same as the site).
  show raw.where(block: true): it => block(
    fill: white,
    stroke: 0.5pt + border,
    inset: 10pt,
    width: 100%,
    breakable: true,
    text(fill: rgb("#1e293b"), size: 0.9em, it),
  )
  // Inline code: square tinted chip.
  show raw.where(block: false): it => box(
    fill: tint-light,
    inset: (x: 3pt),
    outset: (y: 2.5pt),
    text(fill: primary.darken(25%), it),
  )
  set line(length: 100%)

  // Markers drawn as shapes (circle radius 0.2em, triangle 0.55em high).
  let marker-size = 0.55em
  let marker-lift = -0.1em  // raise the shapes to the middle of the x-height
  set list(marker: (
    box(baseline: marker-lift - 0.075em, rect(width: 0.4em, height: 0.4em, fill: accent, stroke: none)),
    box(baseline: marker-lift, polygon(
      fill: accent,
      (0pt, 0pt),
      (marker-size * 0.95, marker-size / 2),
      (0pt, marker-size),
    )),
    text(fill: accent)[–],
  ))
  set enum(numbering: n => text(fill: accent, weight: "bold", font: heading-fonts)[#n.])

  show figure.caption: it => text(size: 0.9em, fill: muted)[
    #text(fill: accent, font: heading-fonts, weight: "medium")[#it.supplement #it.counter.display(it.numbering)]#it.separator#it.body
  ]
  show ref: it => text(fill: accent, it)
  show cite: it => text(fill: accent, it)
  show link: it => text(fill: accent, it)

  show figure.where(kind: image): set figure(supplement: if lang == "en" [Figure] else [圖])
  show figure.where(kind: table): set figure(supplement: if lang == "en" [Table] else [表])
  set math.equation(numbering: "(1)", supplement: [式])

  // Table header: accent fill, white bold text; light steel borders.
  show table.cell.where(y: 0): set text(weight: "bold", font: heading-fonts, fill: white)
  set table(
    stroke: 0.5pt + border,
    fill: (x, y) => if y == 0 { accent },
    inset: 6pt,
    align: left,
  )

  set page(
    paper: "a4",
    margin: (top: 2.5cm, bottom: 2.5cm, left: 2cm, right: 2cm),
    // Running header on every page after the cover. The logo and the text swap sides on
    // odd/even pages: odd pages carry the logo on the right, even pages on the left.
    header: context {
      if in-body.get() {
        let odd = calc.odd(counter(page).get().first())
        let side = if odd { right } else { left }
        let text-side = if odd { left } else { right }
        place(top + left, dx: -2cm, block(
          width: 100% + 4cm,
          height: 1.75cm,
          fill: accent,
          clip: true,
          {
            place(top + side, dx: if odd { -2cm } else { 2cm }, dy: 0.5cm,
              image("assets/logo-white.png", height: 0.75cm))
            place(top + text-side, dx: if odd { 2cm } else { -2cm }, dy: 0.34cm, {
              set align(text-side)
              set text(font: heading-fonts, fill: white)
              text(size: 10.5pt, weight: "bold")[#plain(title).split(regex("[:：]")).at(0)]
              linebreak()
              text(size: 8.5pt, fill: tint-light)[#site]
            })
          },
        ))
      }
    },
  )

  // ---- Cover page: full-bleed accent colour, white tab, title in the middle ----------
  // Offsets are relative to the page margins (left/right 2cm, top 2.5cm, bottom 2.5cm).
  place(top + left, dx: -2cm, dy: -2.5cm, rect(
    width: 21cm,
    height: 29.7cm,
    fill: accent,
  ))
  place(top + left, dx: -0.4cm, dy: -2.5cm, rect(width: 1.75cm, height: 2.3cm, fill: white))
  // Bottom-left: three overlapping irregular facets bleeding off the page corner,
  // from the lightest tint (back) to white (front).
  let facet(fill, pts) = polygon(fill: fill, ..pts.map(((x, y)) => (x * 1cm, y * 1cm)))
  place(bottom + left, dx: -2cm, dy: 2.5cm, block(width: 6.2cm, height: 6cm, {
    place(top + left, facet(border, ((0, 1.4), (3.6, 0), (5.6, 2.9), (3.0, 6), (0, 6))))
    place(top + left, facet(tint, ((0, 2.9), (2.5, 2.1), (4.0, 4.4), (2.0, 6), (0, 6))))
    place(top + left, facet(white, ((0, 4.5), (1.4, 4.0), (2.2, 6), (0, 6))))
  }))

  // Logo, top right, level with the white tab.
  place(top + right, dx: 0cm, dy: -2.3cm,
    image("assets/logo-white.png", height: 2.1cm))

  place(top + left, dx: -0.4cm, dy: 7.5cm, {
    line(length: 1.75cm, stroke: 1.5pt + white)
    v(0.6em)
    cover-title(title, 17cm)
    v(0.95em)
    line(length: 1.75cm, stroke: 1.5pt + white)
    v(0.8em)
    set text(font: heading-fonts, fill: white)
    text(size: 15pt)[#category · #edition]
    v(0.5em)
    text(size: 20pt, weight: "medium")[#site]
  })

  place(bottom + right, dx: 0cm, dy: -0.7cm, align(right, {
    set text(font: heading-fonts, fill: white)
    for a in authors {
      text(size: 15pt, weight: "bold")[#a.at(0)]
      if a.at(1) != "" {
        linebreak()
        text(size: 9.5pt, fill: tint-light)[#a.at(1)]
      }
      v(0.7em)
    }
  }))

  // Copyright line, year is the build year.
  place(top + right, dx: 0cm, dy: 29.7cm - 2.3cm - 2.5cm,
    text(size: 10.5pt, font: heading-fonts, fill: tint-light, top-edge: "cap-height")[© #datetime.today().year() Yueswater])

  pagebreak()

  // Page numbers restart after the cover.
  counter(page).update(1)
  set page(footer: context align(center, text(fill: accent, size: 9pt, font: (mono, zh))[-- #counter(page).get().first() --]))

  outline(title: if lang == "en" [Contents] else [目錄], depth: 2)

  in-body.update(true)
  pagebreak()
  set par(first-line-indent: (amount: 0em, all: false))
  body
}
