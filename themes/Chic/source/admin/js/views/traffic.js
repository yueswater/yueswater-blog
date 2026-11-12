// "流量來源": where visits came from, by channel, campaign and landing page, for the last 7 / 30 / 90 days.
import { el } from '../dom.js'

const RANGES = [7, 30, 90]

const block = (title, rows, label) => {
  const max = Math.max(1, ...rows.map((r) => r.n))
  return el('section', { class: 'tr-block' },
    el('h2', {}, title),
    rows.length
      ? rows.map((r) => el('div', { class: 'tr-row' },
        el('span', { class: 'tr-label', title: label(r) }, label(r)),
        el('span', { class: 'tr-bar' }, el('i', { style: `width:${((r.n / max) * 100).toFixed(1)}%` })),
        el('span', { class: 'num' }, r.n)))
      : el('p', { class: 'muted small' }, '這段期間沒有資料'))
}

const campaignLabel = (r) => {
  const via = [r.source, r.medium].filter(Boolean).join(' / ')
  return via ? `${r.campaign}（${via}）` : r.campaign
}

export async function renderTraffic(root, { backend }) {
  let days = 30
  const out = el('div', { class: 'traffic' })
  const buttons = RANGES.map((d) => el('button', { class: 'tab', onclick: () => { days = d; load() } }, `近 ${d} 天`))

  async function load() {
    buttons.forEach((b, i) => b.setAttribute('aria-selected', String(RANGES[i] === days)))
    out.replaceChildren(el('p', { class: 'muted' }, '載入中…'))
    try {
      const s = await backend.traffic(days)
      out.replaceChildren(
        el('p', { class: 'muted small' }, `共 ${s.total} 次進站（只計同意分析的訪客，每個瀏覽工作階段一次）`),
        block('管道', s.channels, (r) => r.channel),
        block('活動', s.campaigns, campaignLabel),
        block('落地頁', s.pages, (r) => r.path))
    } catch (e) {
      out.replaceChildren(el('p', { class: 'form-error' }, `讀取失敗：${e.message || e}`))
    }
  }

  root.replaceChildren(el('div', { class: 'tabs traffic-range' }, ...buttons), out)
  await load()
}
