#!/usr/bin/env node
// Build the downloadable PDFs: every post under source/_posts is converted from Markdown into
// Typst, wrapped in reports/template, and compiled to reports/out/<post path>/<zh|en>.pdf
// (not tracked by git; reports/tools/upload.mjs pushes them to Supabase Storage).
//
//   node reports/tools/build.mjs               # every post
//   node reports/tools/build.mjs line-sticker  # posts whose path contains this text
//
// Run from the repository root (make reports does). Needs the `typst` CLI.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'

const require = createRequire(import.meta.url)
const kramed = require('kramed')
const yaml = require('js-yaml')

const ROOT = process.cwd()
const only = process.argv[2]

// ---------- Typst escaping ----------
const esc = (s) => s
  .replace(/\\/g, '\\\\')
  .replace(/([#$*_`<>@~\[\]])/g, '\\$1')
  .replace(/\/(?=[\/*])/g, '\\/')
  .replace(/^(\s*)([=+\-])(?=\s)/gm, '$1\\$2')
const str = (s) => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"'

// ---------- inline Markdown -> Typst ----------
function inline(src, ctx) {
  const re = /(`+)([\s\S]+?)\1|!\[([^\]]*)\]\(([^)\s]+)[^)]*\)|\[((?:[^\]\\]|\\.)+)\]\(([^)\s]+)[^)]*\)|\*\*([\s\S]+?)\*\*|(?<![*\w])\*([^*\s][^*]*?)\*(?!\*)|<br\s*\/?>|<kbd>([\s\S]*?)<\/kbd>|<\/?[a-zA-Z][^>]*>|(https?:\/\/[^\s)<>）」]+)|\[\^([^\]]+)\]|\$(?=\S)([^$\n]*?\S)\$(?!\d)/g
  let out = '', last = 0, m
  while ((m = re.exec(src))) {
    out += esc(src.slice(last, m.index))
    last = m.index + m[0].length
    if (m[1]) out += `#raw(${str(m[2])})`
    else if (m[4] !== undefined) out += `#box(image(${str(ctx.img(m[4]))}, height: 1.1em))`
    else if (m[5] !== undefined) out += `#link(${str(m[6])})[${inline(m[5], ctx)}]`
    else if (m[7] !== undefined) out += `#strong[${inline(m[7], ctx)}]`
    else if (m[8] !== undefined) out += `#emph[${inline(m[8], ctx)}]`
    else if (m[0].startsWith('<br')) out += ' \\ '
    else if (m[9] !== undefined) out += `#box(fill: tint-light, inset: (x: 3pt, y: 1pt), raw(${str(m[9])}))`
    else if (m[10]) out += `#link(${str(m[10])})[${esc(m[10])}]`
    else if (m[11] !== undefined) {
      const note = ctx.notes && ctx.notes[m[11]]
      out += note !== undefined ? `#footnote[${inline(note, { ...ctx, notes: {} })}]` : esc(m[0])
    }
    else if (m[12] !== undefined) out += '#mi(`' + m[12] + '`)'
    // other inline html tags are dropped
  }
  return out + esc(src.slice(last))
}

// ---------- block rendering ----------
function render(src, ctx) {
  const tokens = kramed.lexer(src)
  tokens.links = tokens.links || {}
  const pos = { i: 0 }
  return blocks(tokens, pos, ctx, () => false)
}

function blocks(tokens, pos, ctx, stop) {
  const out = []
  while (pos.i < tokens.length && !stop(tokens[pos.i])) {
    const t = tokens[pos.i++]
    switch (t.type) {
      case 'space': case 'hr': break
      case 'math':
        out.push('#mitex(`' + t.text.trim() + '`)')
        break
      case 'heading':
        {
          const level = Math.max(1, t.depth - ctx.top)
          // practice sections carry no number
          if (/^(練習題?|Exercises?|Practice)\s*$/i.test(t.text)) out.push(`#heading(level: ${level}, numbering: none)[${inline(t.text, ctx)}]`)
          else out.push(`${'='.repeat(level)} ${inline(t.text, ctx)}`)
        }
        break
      case 'paragraph':
      case 'text':
        out.push(inline(t.text, ctx))
        break
      case 'code': {
        const lang = t.lang && !['plaintext', 'text'].includes(t.lang) ? `lang: ${str(t.lang)}, ` : ''
        out.push(`#raw(block: true, ${lang}${str(t.text)})`)
        break
      }
      case 'blockquote_start': {
        const inner = blocks(tokens, pos, ctx, (x) => x.type === 'blockquote_end')
        pos.i++
        out.push(`#block(fill: tint-light, inset: (x: 12pt, y: 8pt), width: 100%, stroke: (left: 2.5pt + primary))[\n${inner}\n]`)
        break
      }
      case 'list_start': {
        const marker = t.ordered ? '+' : '-'
        const items = []
        while (tokens[pos.i] && tokens[pos.i].type !== 'list_end') {
          pos.i++ // list_item_start / loose_item_start
          const inner = blocks(tokens, pos, ctx, (x) => x.type === 'list_item_end')
          pos.i++
          items.push(`${marker} ${inner.replace(/\n/g, '\n  ')}`)
        }
        pos.i++
        out.push(items.join('\n'))
        break
      }
      case 'table': {
        const n = t.header.length
        const cell = (c) => `[${inline(c, ctx)}]`
        const rows = [t.header.map(cell), ...t.cells.map((r) => r.map(cell))]
        out.push(`#table(columns: ${n}, ${rows.map((r) => r.join(', ')).join(',\n  ')})`)
        break
      }
      case 'html':
        out.push(html(t.text, ctx))
        break
      default:
        console.warn(`  ! unhandled token: ${t.type}`)
    }
  }
  return out.filter((s) => s !== '').join('\n\n')
}

// Raw HTML in a post: figures, and the site's tab sets (flattened to labelled blocks).
function html(text, ctx) {
  if (text.includes('tabset-panel')) {
    const labels = {}
    for (const m of text.matchAll(/<button[^>]*data-tab="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)) {
      labels[m[1]] = m[2].replace(/<[^>]+>/g, '').trim()
    }
    const parts = text.split(/<div class="tabset-panel[^>]*data-tab="([^"]+)"[^>]*>/)
    const out = []
    for (let i = 1; i < parts.length; i += 2) {
      const body = parts[i + 1].replace(/(<\/div>\s*)+$/g, '').trim()
      out.push(`#tab-label(${str(labels[parts[i]] || parts[i])})\n\n${render(body, ctx)}`)
    }
    return out.join('\n\n')
  }
  const figs = [...text.matchAll(/<figure>\s*<img([^>]*)>\s*(?:<figcaption>([\s\S]*?)<\/figcaption>)?\s*<\/figure>/g)]
  if (figs.length) {
    return figs.map((m) => {
      const src = /src="([^"]+)"/.exec(m[1])?.[1]
      const alt = /alt="([^"]*)"/.exec(m[1])?.[1] || ''
      const max = /max-width:\s*(\d+)px/.exec(m[1])?.[1]
      const file = ctx.img(src)
      const cap = m[2] ? `, caption: [${inline(m[2], ctx)}]` : ''
      if (!fs.existsSync(path.join(ROOT, file))) {
        console.warn(`  ! missing image, left as a placeholder: ${src}`)
        return `#figure(block(width: 100%, height: 3cm, fill: tint-light, align(center + horizon, text(fill: muted)[（圖片：${esc(alt)}）]))${cap})`
      }
      const limit = max ? `, limit: ${(+max * 0.75).toFixed(0)}pt` : ''
      // some screenshots are JPEGs saved as .png; Typst trusts the extension, so say what it is
      const magic = fs.readFileSync(path.join(ROOT, file)).subarray(0, 4)
      const fmt = magic[0] === 0xff && magic[1] === 0xd8 ? ', format: "jpg"' : ''
      return `#fit-figure(${str('/' + file)}${fmt}${limit}${cap})`
    }).join('\n\n')
  }
  return '' // wrapper divs and other markup carry no content
}

// ---------- practice questions (::: exercises ... ::: q ... ::: answer, see themes/Chic/scripts/exercises.js) ----------
function splitOptions(lines) {
  let end = lines.length
  while (end > 0 && lines[end - 1].trim() === '') end--
  let i = end
  while (i > 0 && (/^[-*]\s+\S/.test(lines[i - 1]) || /^\s{2,}\S/.test(lines[i - 1]))) i--
  while (i < end && !/^[-*]\s+\S/.test(lines[i])) i++
  if (i >= end) return { stem: lines, options: [] }
  const options = []
  for (const l of lines.slice(i, end)) {
    if (/^[-*]\s+/.test(l)) options.push(l.replace(/^[-*]\s+/, ''))
    else options[options.length - 1] += ' ' + l.trim()
  }
  return { stem: lines.slice(0, i), options }
}

function exercisesTyp(block, ctx) {
  const qs = block.kids.filter((k) => k.name === 'q')
  const title = block.title || (ctx.lang === 'en' ? `${qs.length} ${qs.length === 1 ? 'question' : 'questions'}` : `共 ${qs.length} 題`)
  const items = qs.map((q) => {
    const { stem, options } = splitOptions(q.lines)
    const ans = q.kids.find((k) => k.name === 'answer')
    const longest = Math.max(0, ...options.map((o) => o.replace(/`/g, '').length))
    const cols = !options.length ? 1 : longest <= 14 ? 4 : longest <= 30 ? 2 : 1
    return `(stem: [${render(stem.join('\n').trim(), ctx)}], options: (${options.map((o) => `[${inline(o, ctx)}]`).join(', ')}${options.length === 1 ? ',' : ''}), cols: ${cols}, answer: ${ans ? `[${render(ans.lines.join('\n').trim(), ctx)}]` : 'none'})`
  })
  return `#exercises-box(${str(title)}, (${items.join(',\n  ')}${items.length === 1 ? ',' : ''}))`
}

// Pull every exercises block out of the Markdown; leave a marker paragraph that is swapped for the Typst later.
function extractExercises(md, ctx, out) {
  const res = []
  let inFence = false
  let cur = null
  for (const line of md.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
    const open = !inFence && /^:::\s*([a-z]+)\s*(.*)$/.exec(line)
    const close = !inFence && /^:::\s*$/.test(line)
    if (open && /^(exercises|q|answer)$/.test(open[1])) {
      cur = { name: open[1], title: open[2].trim(), lines: [], kids: [], parent: cur }
      continue
    }
    if (close && cur) {
      const done = cur
      cur = cur.parent
      if (cur) cur.kids.push(done)
      else {
        out.push(done)
        res.push('', `EXERCISESBLOCK${out.length - 1}X`, '')
      }
      continue
    }
    if (cur) cur.lines.push(line)
    else res.push(line)
  }
  return res.join('\n')
}

// ---------- admonitions (!!! type "title" + indented body) ----------
function extractAdmonitions(md, ctx, out) {
  const lines = md.split('\n')
  const res = []
  let inFence = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
    const m = !inFence && /^!!!([+-]?)\s+([A-Za-z]+)(?:\s+"(.*)")?\s*$/.exec(line)
    if (!m) { res.push(line); continue }
    const body = []
    let j = i + 1
    while (j < lines.length) {
      const l = lines[j]
      if (/^( {4}|\t)/.test(l)) body.push(l.replace(/^( {4}|\t)/, ''))
      else if (l.trim() === '' && j + 1 < lines.length && /^( {4}|\t)/.test(lines[j + 1])) body.push('')
      else break
      j++
    }
    i = j - 1
    const kind = m[2].toLowerCase()
    const title = m[3] || (kind[0].toUpperCase() + kind.slice(1))
    out.push(`#admonition(${str(kind)}, ${str(title)}, [${render(body.join('\n').trim(), ctx)}])`)
    res.push('', `ADMONBLOCK${out.length - 1}X`, '')
  }
  return res.join('\n')
}

// ---------- definition / theorem / lemma / proposition / corollary / example / proof (::: {.kind title="..."} ... :::, see themes/Chic/scripts/theoremDiv.js) ----------
const THEOREM_LABELS = {
  zh: { definition: '定義', theorem: '定理', lemma: '引理', proposition: '命題', corollary: '推論', example: '範例', proof: '證明' },
  en: { definition: 'Definition', theorem: 'Theorem', lemma: 'Lemma', proposition: 'Proposition', corollary: 'Corollary', example: 'Example', proof: 'Proof' },
}

// Runs after extractExercises, so exercise blocks are already markers and their bare `:::` closers are gone.
function extractTheorems(md, ctx, out) {
  const lines = md.split('\n')
  const res = []
  let inFence = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
    const m = !inFence && /^:::[ \t]*\{\.(definition|theorem|lemma|proposition|corollary|example|proof)(?:[ \t]+title="([^"\n]*)")?[ \t]*\}[ \t]*$/.exec(line)
    if (!m) { res.push(line); continue }
    // body runs to the next bare `:::` outside a code fence
    const body = []
    let j = i + 1
    let fence = false
    while (j < lines.length) {
      if (/^\s*(```|~~~)/.test(lines[j])) fence = !fence
      if (!fence && /^:::[ \t]*$/.test(lines[j])) break
      body.push(lines[j])
      j++
    }
    i = j // skip the closing :::
    // a .proof block right after a statement belongs to the same box (see theoremDiv.js)
    let proofBody = null
    if (m[1] !== 'proof' && m[1] !== 'example') {
      let k = j + 1
      while (k < lines.length && lines[k].trim() === '') k++
      if (k < lines.length && /^:::[ \t]*\{\.proof\}[ \t]*$/.test(lines[k])) {
        const pb = []
        let q = k + 1
        let pfence = false
        while (q < lines.length) {
          if (/^\s*(```|~~~)/.test(lines[q])) pfence = !pfence
          if (!pfence && /^:::[ \t]*$/.test(lines[q])) break
          pb.push(lines[q])
          q++
        }
        proofBody = pb
        i = q
      }
    }
    // the name: a leading "# 名稱" line in the body, or title="..." in the fence
    let name = m[2] && m[2].trim() ? m[2].trim() : ''
    const first = body.findIndex((l) => l.trim() !== '')
    const lead = first === 0 ? /^#{1,6}[ \t]+(.+?)[ \t]*$/.exec(body[0]) : null
    if (lead) { name = lead[1]; body.shift() }
    const title = name ? `[${render(name, ctx).trim()}]` : 'none'
    const sep = ctx.lang === 'en' ? ': ' : '：'
    const proof = proofBody ? `, proof: [${render(proofBody.join('\n').trim(), ctx)}], proof-label: ${str(THEOREM_LABELS[ctx.lang].proof)}` : ''
    out.push(`#theorem-box(${str(m[1])}, ${str(THEOREM_LABELS[ctx.lang][m[1]])}, ${title}, [${render(body.join('\n').trim(), ctx)}], sep: ${str(sep)}${proof})`)
    res.push('', `THEOREMBLOCK${out.length - 1}X`, '')
  }
  return res.join('\n')
}

// ---------- one post ----------
function build(post) {
  const file = path.resolve(post)
  const dir = path.dirname(file)
  const raw = fs.readFileSync(file, 'utf8')
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(raw)
  const meta = yaml.load(fm[1])
  const md = raw.slice(fm[0].length)

  // the shallowest heading in the post becomes level 1 (posts usually start at ##)
  // (headings only: lines inside code fences, like `# comment`, do not count)
  const depths = []
  let fenced = false
  for (const line of md.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced
    else if (!fenced) { const m = /^(#{1,6})\s/.exec(line); if (m) depths.push(m[1].length) }
  }
  const top = Math.min(...depths, 6) - 1
  const ctx = { top, img: (p) => (/^https?:|^\//.test(p) ? p : path.relative(ROOT, path.join(dir, p))) }
  // footnote definitions ([^id]: text) are pulled out and inlined as #footnote[...] at their markers
  ctx.notes = {}
  const mdBody = md.replace(/^\[\^([^\]]+)\]:[ \t]*([^\n]*(?:\n(?!\n|\[\^)[^\n]*)*)/gm, (_, id, text) => {
    ctx.notes[id] = text.replace(/\s*\n\s*/g, ' ').trim()
    return ''
  })
  ctx.lang = meta.lang === 'en' ? 'en' : 'zh'
  const exBlocks = []
  const admons = []
  const theorems = []
  const mdNoEx = extractAdmonitions(extractTheorems(extractExercises(mdBody, ctx, exBlocks), ctx, theorems), ctx, admons)
  let body = render(mdNoEx, ctx)
  exBlocks.forEach((b, i) => { body = body.replace(`EXERCISESBLOCK${i}X`, () => exercisesTyp(b, ctx)) })
  admons.forEach((t, i) => { body = body.replace(`ADMONBLOCK${i}X`, () => t) })
  theorems.forEach((t, i) => { body = body.replace(`THEOREMBLOCK${i}X`, () => t) })

  const cats = [...new Set(meta.categories || [])]
  const date = new Date(meta.date)
  const d = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
  const link = String(meta.permalink || '').replace(/^\/|\/$/g, '')
  const url = link ? `yueswater.com/${link}/` : undefined

  const lang = meta.lang === 'en' ? 'en' : 'zh'
  const slug = slugOf(meta, post)
  const out = path.join('reports', '.build', slug, lang)
  fs.mkdirSync(out, { recursive: true })
  fs.writeFileSync(path.join(out, 'body.typ'), `#import "/reports/template/template.typ": tab-label, fit-figure, exercises-box, admonition, theorem-box\n#import "/reports/template/theme.typ": *\n#import "@preview/mitex:0.2.6": mi, mitex\n\n${body}\n`)
  fs.writeFileSync(path.join(out, 'main.typ'), `#import "/reports/template/template.typ": report, end-report

#show: report.with(
  title: ${str(meta.title)},
  category: ${str(cats.slice(0, 2).join(' · ') || (meta.lang === 'en' ? 'Article' : '文章'))},
  lang: ${str(meta.lang === 'en' ? 'en' : 'zh')},
  site: ${str(meta.lang === 'en' ? 'Yueswater' : '岳氏礦泉水')},
  edition: ${str(String(d[0]))},
  date: datetime(year: ${d[0]}, month: ${d[1]}, day: ${d[2]}),
  authors: (("Anthony", ""),),
  url: ${url ? str(url) : 'none'},
)

#include "body.typ"

#end-report()
`)
  fs.mkdirSync(path.join('reports', 'out', slug), { recursive: true })
  const pdf = path.join('reports', 'out', slug, `${lang}.pdf`)
  execFileSync('typst', ['compile', '--root', '.', path.join(out, 'main.typ'), pdf], { stdio: 'pipe' })
  return pdf
}

// folder name for a post: its permalink without the language suffix, e.g. articles/python/python-zip-enum
function slugOf(meta, post) {
  const link = String(meta.permalink || '').replace(/^\/|\/$/g, '')
  return (link || path.relative('source/_posts', path.dirname(post))).replace(/-en$/, '')
}

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) yield* walk(p)
    else if (/^index(-en)?\.md$/.test(e.name)) yield p
  }
}

// sections that get no PDF (diary entries are personal)
const SKIP = ['diary/']
const posts = [...walk('source/_posts')]
  .filter((p) => !SKIP.some((d) => path.relative('source/_posts', p).startsWith(d)))
  .filter((p) => !only || p.includes(only))
  .sort()
const failed = []
for (const post of posts) {
  const rel = path.relative('source/_posts', post)
  try {
    const pdf = build(post)
    console.log(`ok    ${rel}  ->  ${pdf}`)
  } catch (err) {
    const msg = String(err.stderr || err.message || err).split('\n').filter(Boolean).slice(0, 4).join(' | ')
    failed.push(rel)
    console.log(`FAIL  ${rel}\n      ${msg}`)
  }
}
console.log(`\n${posts.length - failed.length}/${posts.length} converted`)
if (failed.length) process.exitCode = 1
