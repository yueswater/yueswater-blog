// Search box, status tabs with counts, and the bulk-action bar that appears when rows are ticked.
import { el } from '../dom.js'

const TABS = [['all', '全部'], ['published', '已發布'], ['scheduled', '排程中'], ['unpublished', '已下架']]

export function renderToolbar({ state, count, onChange, onBulk }) {
  const search = el('input', { class: 'search', type: 'search', placeholder: '搜尋標題、分類或網址', value: state.q,
    oninput: (e) => { state.q = e.target.value; onChange(false) } })
  const tabs = el('div', { class: 'tabs', role: 'tablist' }, TABS.map(([id, text]) =>
    el('button', { class: 'tab', role: 'tab', 'aria-selected': String(state.tab === id), onclick: () => { state.tab = id; onChange(true) } },
      text, el('span', { class: 'count' }, count[id]))))
  const n = state.selected.size
  const bulk = el('div', { class: 'bulk', hidden: n === 0 },
    el('span', {}, `已選 ${n} 篇`),
    el('button', { class: 'btn', onclick: () => onBulk('published') }, '發布'),
    el('button', { class: 'btn', onclick: () => onBulk('unpublished') }, '下架'),
    el('button', { class: 'btn link', onclick: () => { state.selected.clear(); onChange(true) } }, '取消選取'))
  return el('div', { class: 'toolbar' }, el('div', { class: 'row' }, tabs, search), bulk)
}
