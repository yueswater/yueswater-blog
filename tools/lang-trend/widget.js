// Interactive trend charts: the TIOBE index of the mainstream languages, and the share of UK job ads citing Go.
// Needs LT_DATA (data and logos), which build.py puts in front of this file.
// Usage in a post: set `lang_trend: true` in the front matter and put <div class="lang-trend"></div> (TIOBE)
// or <div class="lang-trend" data-set="jobs"></div> (Go job ads) where the chart goes.
;(() => {
  'use strict'
  const ZH = (document.documentElement.lang || 'zh').toLowerCase().startsWith('zh')
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const TXT = ZH
    ? {
        r10: '近 10 年', r5: '近 5 年', lin: '線性', log: '對數', replay: '重播',
        logHint: '對數座標：每一格約是 2 倍或 5 倍，方便比較數值小的語言',
        month: (t) => `${Math.floor(t / 12)} 年 ${(t % 12) + 1} 月`,
      }
    : {
        r10: 'Last 10 years', r5: 'Last 5 years', lin: 'Linear', log: 'Log', replay: 'Replay',
        logHint: 'Log scale: each gridline is about 2x or 5x, so smaller languages stay readable',
        month: (t) => `${MON[t % 12]} ${Math.floor(t / 12)}`,
      }

  // one config per chart: which series, their colour keys, default visibility, range buttons and end-of-line marks
  const SETS = {
    tiobe: {
      data: LT_DATA.tiobe,
      key: { Python: 'py', C: 'c', Java: 'java', 'C++': 'cpp', 'C#': 'cs', JavaScript: 'js', Go: 'go', 'Visual Basic': 'vb', R: 'r' },
      show0: ['Python', 'C', 'Java', 'C++', 'C#', 'JavaScript', 'Go'],
      ranges: [['10', 'r10'], ['5', 'r5'], ['all', 'rall']],
      scales: true,
      label: ZH ? '主流程式語言的 TIOBE 指數趨勢圖' : 'TIOBE index trend of the mainstream programming languages',
      rall: ZH ? '2001 年起' : 'Since 2001',
    },
    jobs: {
      data: LT_DATA.jobs,
      key: { permanent: 'perm', contract: 'cont' },
      show0: ['permanent', 'contract'],
      ranges: [['10', 'r10'], ['5', 'r5'], ['all', 'rall']],
      scales: false,
      label: ZH ? 'Go 在英國 IT 職缺廣告中的占比趨勢圖' : 'Share of UK IT job ads citing Go over time',
      rall: ZH ? '2012 年起' : 'Since 2012',
      name: ZH ? { permanent: '正職', contract: '約聘' } : { permanent: 'Permanent', contract: 'Contract' },
    },
  }
  function cfgOf(box) {
    const c = SETS[box.dataset.set] || SETS.tiobe
    if (c.order) return c
    c.order = Object.keys(c.key)
    c.series = c.data.series
    c.logo = c.data.logos || null
    c.last = c.data.last
    c.byt = {}
    for (const k of c.order) c.byt[k] = new Map(c.series[k])
    c.first = Math.min(...c.order.map((k) => c.series[k][0][0]))
    c.title = (k) => (c.name ? c.name[k] : k)
    return c
  }
  const NS = 'http://www.w3.org/2000/svg'
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches

  // Line colours were checked with the data-viz palette validator (CVD and normal-vision separation) against each surface.
  const css = `
.lang-trend{--lt-ink:#1a1a1a;--lt-soft:#6b6b6b;--lt-line:#d9d9d9;--lt-grid:#dbe4ee;--lt-accent:#1747e6;--lt-on:#fff;--lt-bg:#f4f9fd;
--lt-perm:#00a5cf;--lt-cont:#e8710a;
--lt-cs:#1f9d55;--lt-go:#00a5cf;--lt-c:#6f55d6;--lt-java:#e8710a;--lt-py:#2f6fb5;--lt-cpp:#d9367f;--lt-js:#d6a100;--lt-vb:#c4372f;--lt-r:#8a9a00;
margin:2em 0;padding:1.2em;border:1px solid var(--lt-line);background:var(--lt-bg);font-size:.9rem;line-height:1.5;color:var(--lt-ink)}
.dark-theme .lang-trend{--lt-ink:#e6e6e6;--lt-soft:#9a9a9a;--lt-line:#3a3a3a;--lt-grid:#223452;--lt-accent:#5aa9ff;--lt-on:#0f1b2d;--lt-bg:#0f1b2d;
--lt-perm:#009fc6;--lt-cont:#d96a08;
--lt-cs:#2aa863;--lt-go:#009fc6;--lt-c:#8b73f0;--lt-java:#d96a08;--lt-py:#4a8fd6;--lt-cpp:#e0508f;--lt-js:#b58900;--lt-vb:#d94a6a;--lt-r:#6ea800}
.lang-trend .lt-bar{display:flex;flex-wrap:wrap;gap:.6em 1.2em;align-items:center;margin-bottom:.8em}
.lang-trend .lt-seg{display:inline-flex}
.lang-trend button{font:inherit;color:var(--lt-accent);background:none;border:1px solid var(--lt-accent);padding:.15em .8em;cursor:pointer;margin:0}
.lang-trend .lt-seg button+button{margin-left:-1px}
.lang-trend button:hover{background:color-mix(in srgb,var(--lt-accent) 14%,transparent)}
.lang-trend .lt-seg button[aria-pressed=true]{color:var(--lt-on);background:var(--lt-accent)}
.lang-trend button:focus-visible{outline:2px solid var(--lt-accent);outline-offset:2px}
.lang-trend .lt-replay{margin-left:auto}
.lang-trend .lt-chips{display:flex;flex-wrap:nowrap;justify-content:safe center;gap:.35em;margin:.5em -3px 0;padding:4px 3px;overflow-x:auto;scrollbar-width:thin}
.lang-trend .lt-chip{display:inline-flex;flex:none;align-items:center;gap:.35em;line-height:1.5;border:0;border-radius:6px;background:none;color:var(--lt-ink);padding:.15em .5em .15em .3em;font-size:.8rem;white-space:nowrap}
.lang-trend .lt-chip svg{width:1.15em;height:1.15em}
.lang-trend .lt-chip i{width:.7em;height:.7em;margin:0 .2em;border-radius:50%;background:var(--c)}
.lang-trend .lt-chip:hover,.lang-trend .lt-chip:focus-visible{background:color-mix(in srgb,var(--c) 24%,transparent)}
.lang-trend .lt-chip[aria-pressed=false]{opacity:.4}
.lang-trend .lt-plot{position:relative}
.lang-trend .lt-plot svg.lt-main{display:block;width:100%;height:auto;overflow:visible;touch-action:pan-y}
.lang-trend .lt-plot svg:focus{outline:none}
.lang-trend .lt-plot svg:focus-visible{outline:2px solid var(--lt-accent);outline-offset:4px}
.lang-trend .lt-grid line{stroke:var(--lt-grid);stroke-width:1}
.lang-trend .lt-axis text{fill:var(--lt-soft);font-size:11px}
.lang-trend .lt-s{fill:none;stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round}
.lang-trend .lt-dim{opacity:.15}
.lang-trend .lt-lead{stroke:var(--lt-soft);stroke-width:1;fill:none;opacity:.6}
.lang-trend .lt-ring{fill:var(--lt-bg);stroke-width:1.8}
.dark-theme .lang-trend .lt-ring{fill:#eef3f9}
.lang-trend .lt-cross{stroke:var(--lt-soft);stroke-width:1;stroke-dasharray:3 3}
.lang-trend .lt-dot{stroke:var(--lt-bg);stroke-width:2}
.lang-trend .lt-tip{position:absolute;top:0;left:0;pointer-events:none;z-index:2;min-width:9.5em;padding:.45em .7em;font-size:.8rem;background:var(--lt-bg);border:1px solid var(--lt-line);box-shadow:0 2px 8px rgba(0,0,0,.12)}
.lang-trend .lt-tip b{display:block;margin-bottom:.25em;font-weight:600}
.lang-trend .lt-tip div{display:flex;align-items:center;gap:.45em;line-height:1.55}
.lang-trend .lt-tip i{width:.6em;height:.6em;border-radius:50%;flex:none}
.lang-trend .lt-tip span{margin-left:auto;padding-left:1em;font-variant-numeric:tabular-nums}
`
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)

  const el = (tag, props, parent) => { const n = Object.assign(document.createElement(tag), props); if (parent) parent.append(n); return n }
  const sv = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n }
  
  // "nice" gridlines for a linear axis that starts at 0
  function niceLinear(max) {
    const raw = max / 5, p = 10 ** Math.floor(Math.log10(raw)), f = raw / p
    const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p
    const top = Math.ceil(max / step - 1e-9) * step
    const ticks = []
    for (let v = 0; v <= top + step / 2; v += step) ticks.push(+v.toFixed(6))
    return { ticks, lo: 0, hi: top }
  }
  const LOG_TICKS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100]
  function niceLog(min, max) {
    const lo = [...LOG_TICKS].reverse().find((v) => v <= min * 0.9) ?? 0.1
    const hi = LOG_TICKS.find((v) => v >= max * 1.05) ?? 100
    return { ticks: LOG_TICKS.filter((v) => v >= lo && v <= hi), lo, hi }
  }

  function mount(box) {
    box.replaceChildren()
    const C = cfgOf(box)
    const miniLogo = (k) => (C.logo ? `<svg viewBox="0 0 128 128" aria-hidden="true">${C.logo[k]}</svg>` : '<i></i>')
    const color = (k) => `var(--lt-${C.key[k]})`
    const st = { vis: new Set(C.show0), range: '10', scale: 'lin', focus: null, reveal: reduceMotion ? 1 : 0, idx: null }
    let raf = 0, geo = null, lastW = 0

    // controls
    const bar = el('div', { className: 'lt-bar' }, box)
    const seg = (group, items) => {
      const wrap = el('div', { className: 'lt-seg', role: 'group' }, bar)
      for (const [v, text, title] of items) {
        const b = el('button', { type: 'button', textContent: text }, wrap)
        b.dataset.g = group; b.dataset.v = v
        if (title) b.title = title
        b.setAttribute('aria-pressed', String(st[group] === v))
        b.addEventListener('click', () => {
          st[group] = v
          wrap.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.v === v)))
          st.idx = null
          draw()
        })
      }
    }
    seg('range', [['10', TXT.r10], ['5', TXT.r5], ['all', C.rall]])
    if (C.scales) seg('scale', [['lin', TXT.lin], ['log', TXT.log, TXT.logHint]])
    const replay = el('button', { type: 'button', className: 'lt-replay', textContent: TXT.replay }, bar)
    replay.addEventListener('click', play)

    const plot = el('div', { className: 'lt-plot' }, box)
    const tip = el('div', { className: 'lt-tip', hidden: true }, plot)

    // legend: each language can be switched on and off; pointing at one highlights its line
    const chips = el('div', { className: 'lt-chips' }, box)
    const chipOf = {}
    for (const k of C.order) {
      const b = el('button', { type: 'button', className: 'lt-chip', innerHTML: `${miniLogo(k)}<span>${C.title(k)}</span>` }, chips)
      b.style.setProperty('--c', color(k))
      b.setAttribute('aria-pressed', String(st.vis.has(k)))
      b.addEventListener('click', () => {
        if (st.vis.has(k)) { if (st.vis.size > 1) st.vis.delete(k) } else st.vis.add(k)
        b.setAttribute('aria-pressed', String(st.vis.has(k)))
        st.idx = null
        draw()
      })
      b.addEventListener('pointerenter', () => { st.focus = k; applyFocus() })
      b.addEventListener('pointerleave', () => { st.focus = null; applyFocus() })
      chipOf[k] = b
    }

    function applyFocus() {
      plot.querySelectorAll('[data-k]').forEach((n) => n.classList.toggle('lt-dim', st.focus !== null && n.dataset.k !== st.focus))
    }

    function draw() {
      const W = Math.max(300, Math.round(plot.clientWidth || box.clientWidth - 40))
      lastW = W
      const narrow = W < 520
      const H = narrow ? 300 : 380
      const m = { l: narrow ? 38 : 44, r: C.logo ? (narrow ? 46 : 60) : 16, t: 12, b: 28 }
      const pw = W - m.l - m.r, ph = H - m.t - m.b
      const t1 = C.last
      const t0 = st.range === 'all' ? C.first : t1 - (st.range === '5' ? 60 : 120)
      const names = C.order.filter((k) => st.vis.has(k))
      const pts = {}
      let vmax = 0, vmin = Infinity
      for (const k of names) {
        pts[k] = C.series[k].filter((p) => p[0] >= t0)
        for (const p of pts[k]) { vmax = Math.max(vmax, p[1]); vmin = Math.min(vmin, p[1]) }
      }
      const yd = st.scale === 'log' ? niceLog(vmin, vmax) : niceLinear(vmax)
      const X = (t) => m.l + ((t - t0) / (t1 - t0)) * pw
      const Y = st.scale === 'log'
        ? (v) => m.t + (1 - (Math.log(v) - Math.log(yd.lo)) / (Math.log(yd.hi) - Math.log(yd.lo))) * ph
        : (v) => m.t + (1 - v / yd.hi) * ph
      geo = { X, Y, m, pw, ph, W, H, t0, t1, names }

      const svg = sv('svg', { class: 'lt-main', viewBox: `0 0 ${W} ${H}`, role: 'img', tabindex: '0' })
      svg.setAttribute('aria-label', `${C.label}. ${names.map((k) => `${C.title(k)} ${C.byt[k].get(t1)?.toFixed(2) ?? '-'}%`).join(', ')}`)
      const defs = sv('defs', {})
      const clip = sv('clipPath', { id: 'ltclip' + (mount.n = (mount.n || 0) + 1) })
      const clipRect = sv('rect', { x: m.l - 6, y: 0, width: 0, height: H })
      clip.append(clipRect); defs.append(clip); svg.append(defs)

      const grid = sv('g', { class: 'lt-grid' }), axis = sv('g', { class: 'lt-axis' })
      for (const v of yd.ticks) {
        const y = Y(v)
        grid.append(sv('line', { x1: m.l, x2: W - m.r, y1: y, y2: y }))
        const tx = sv('text', { x: m.l - 8, y: y + 4, 'text-anchor': 'end' }); tx.textContent = `${v}%`; axis.append(tx)
      }
      const perYear = pw / ((t1 - t0) / 12)
      const step = [1, 2, 5, 10].find((s) => s * perYear >= 50) || 10
      for (let y = Math.ceil(t0 / 12); y * 12 <= t1; y++) {
        if (y % step) continue
        const x = X(y * 12)
        const tx = sv('text', { x, y: H - 8, 'text-anchor': 'middle' }); tx.textContent = String(y); axis.append(tx)
        grid.append(sv('line', { x1: x, x2: x, y1: H - m.b, y2: H - m.b + 4 }))
      }
      svg.append(grid, axis)

      const lines = sv('g', { 'clip-path': `url(#${clip.id})` })
      for (const k of names) {
        const d = pts[k].map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('')
        lines.append(sv('path', { class: 'lt-s', 'data-k': k, d, style: `stroke:${color(k)}` }))
      }
      svg.append(lines)

      // the logo sits at the right end of each line; when lines end close together the logos are spread apart
      const size = narrow ? 20 : 24, gap = size + 2
      const ends = names.map((k) => ({ k, y: Y(pts[k][pts[k].length - 1][1]) })).sort((a, b) => a.y - b.y)
      const lo = m.t + size / 2, hi = H - m.b - size / 2
      ends.forEach((e, i) => { e.ly = Math.max(e.y, lo, i ? ends[i - 1].ly + gap : lo) })
      for (let i = ends.length - 1; i >= 0; i--) { ends[i].ly = Math.min(ends[i].ly, hi, i < ends.length - 1 ? ends[i + 1].ly - gap : hi) }
      const logos = sv('g', { class: 'lt-logos', opacity: 0 })
      for (const e of C.logo ? ends : []) {
        const g = sv('g', { 'data-k': e.k })
        const cx = W - m.r + 8 + size / 2
        g.append(sv('path', { class: 'lt-lead', d: `M${W - m.r} ${e.y.toFixed(1)}L${(cx - size / 2).toFixed(1)} ${e.ly.toFixed(1)}` }))
        if (C.logo) {
          g.append(sv('circle', { class: 'lt-ring', cx, cy: e.ly, r: size / 2, style: `stroke:${color(e.k)}` }))
          const lg = sv('svg', { x: cx - size * 0.33, y: e.ly - size * 0.33, width: size * 0.66, height: size * 0.66, viewBox: '0 0 128 128' })
          lg.innerHTML = C.logo[e.k]
          g.append(lg)
        }
        logos.append(g)
      }
      svg.append(logos)

      // hover layer
      const hover = sv('g', { class: 'lt-hover', visibility: 'hidden' })
      hover.append(sv('line', { class: 'lt-cross', y1: m.t, y2: H - m.b }))
      const dots = {}
      for (const k of names) { dots[k] = sv('circle', { class: 'lt-dot', r: 4.5, 'data-k': k, style: `fill:${color(k)}` }); hover.append(dots[k]) }
      svg.append(hover)
      const catcher = sv('rect', { x: m.l, y: m.t, width: pw, height: ph, fill: 'transparent' })
      svg.append(catcher)

      const times = [...new Set(names.flatMap((k) => pts[k].map((p) => p[0])))].sort((a, b) => a - b)
      const show = (i) => {
        i = Math.max(0, Math.min(times.length - 1, i)); st.idx = i
        const t = times[i], x = X(t)
        hover.setAttribute('visibility', 'visible')
        hover.firstChild.setAttribute('x1', x); hover.firstChild.setAttribute('x2', x)
        const rows = []
        for (const k of names) {
          const v = C.byt[k].get(t)
          if (v === undefined) { dots[k].setAttribute('visibility', 'hidden'); continue }
          dots[k].setAttribute('visibility', 'visible'); dots[k].setAttribute('cx', x); dots[k].setAttribute('cy', Y(v))
          rows.push([k, v])
        }
        rows.sort((a, b) => b[1] - a[1])
        tip.innerHTML = `<b>${TXT.month(t)}</b>` + rows.map(([k, v]) => `<div><i style="background:${color(k)}"></i>${C.title(k)}<span>${v.toFixed(2)}%</span></div>`).join('')
        tip.hidden = false
        const scale = plot.clientWidth / W, tw = tip.offsetWidth, px = x * scale
        const left = px + 14 + tw > plot.clientWidth ? px - tw - 14 : px + 14
        tip.style.transform = `translate(${Math.max(0, left)}px, ${m.t * scale + 6}px)`
        applyFocus()
      }
      const hide = () => { hover.setAttribute('visibility', 'hidden'); tip.hidden = true; st.idx = null }
      const at = (e) => {
        const r = svg.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * W
        const t = t0 + ((x - m.l) / pw) * (t1 - t0)
        let best = 0
        for (let i = 1; i < times.length; i++) if (Math.abs(times[i] - t) < Math.abs(times[best] - t)) best = i
        show(best)
      }
      catcher.addEventListener('pointermove', at)
      catcher.addEventListener('pointerdown', at)
      catcher.addEventListener('pointerleave', hide)
      svg.addEventListener('blur', hide)
      svg.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
        e.preventDefault()
        show((st.idx ?? times.length - 1) + (e.key === 'ArrowRight' ? 1 : -1))
      })

      geo.clipRect = clipRect; geo.logos = logos
      plot.querySelector('svg.lt-main')?.remove()
      tip.hidden = true
      plot.prepend(svg)
      setReveal()
      applyFocus()
    }

    function setReveal() {
      if (!geo) return
      const r = st.reveal
      geo.clipRect.setAttribute('width', (geo.pw + 12) * r)
      geo.logos.setAttribute('opacity', Math.max(0, Math.min(1, (r - 0.88) / 0.12)))
    }

    function play() {
      cancelAnimationFrame(raf)
      if (reduceMotion) { st.reveal = 1; setReveal(); return }
      const t0 = performance.now()
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / 1600)
        st.reveal = 1 - (1 - p) ** 3
        setReveal()
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      st.reveal = 0
      raf = requestAnimationFrame(tick)
    }

    draw()
    if ('IntersectionObserver' in window && !reduceMotion) {
      const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); play() } }, { threshold: 0.35 })
      io.observe(box)
    } else { st.reveal = 1; setReveal() }
    if ('ResizeObserver' in window) new ResizeObserver(() => { if (Math.abs(plot.clientWidth - lastW) > 1) draw() }).observe(box)
  }

  const init = () => document.querySelectorAll('.lang-trend').forEach(mount)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
