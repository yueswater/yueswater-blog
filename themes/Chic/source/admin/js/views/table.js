// The post table: square corners, one row per post group (Chinese post + English edition).
import { el, fmtDate, fmtTime } from '../dom.js'
import { LABEL } from '../store.js'

const LANG = { zh: '中', en: 'EN' }

const pill = (p) => el('span', { class: `pill ${p.eff.state}` }, LABEL[p.eff.state], p.eff.due ? el('span', { class: 'muted' }, ' · 排程') : null)

function actions(p, { onToggle, onEdit }) {
  const live = p.eff.state === 'published'
  return el('div', { class: 'actions' },
    el('button', { class: 'btn small', onclick: () => onToggle(p, live ? 'unpublished' : 'published') }, live ? '下架' : '發布'),
    el('button', { class: 'btn small', onclick: () => onEdit(p) }, '排程'))
}

export function renderTable({ posts, state, onSelect, onToggle, onEdit, onSelectAll }) {
  const all = posts.length > 0 && posts.every((p) => state.selected.has(p.key))
  const head = el('tr', {},
    el('th', { class: 'check' }, el('input', { type: 'checkbox', checked: all, 'aria-label': '全選', onchange: (e) => onSelectAll(e.target.checked) })),
    ['編號', '標題', '狀態', '語言', '分類', '日期', '排程時間', '快速操作'].map((t) => el('th', {}, t)))
  const rows = posts.map((p) => el('tr', { class: state.selected.has(p.key) ? 'selected' : '' },
    el('td', { class: 'check' }, el('input', { type: 'checkbox', checked: state.selected.has(p.key), onchange: (e) => onSelect(p.key, e.target.checked) })),
    el('td', { class: 'no' }, `#${String(p.no).padStart(4, '0')}`),
    el('td', { class: 'title' }, el('div', {}, p.title), p.titleEn && p.titleEn !== p.title ? el('div', { class: 'muted small' }, p.titleEn) : null),
    el('td', {}, pill(p)),
    el('td', {}, p.langs.map((l) => el('span', { class: 'lang' }, LANG[l]))),
    el('td', {}, p.category || '—'),
    el('td', { class: 'num' }, fmtDate(p.date)),
    el('td', { class: 'num' }, p.row && p.row.status === 'scheduled' ? fmtTime(p.row.publish_at) : '—'),
    el('td', {}, actions(p, { onToggle, onEdit }))))
  const empty = el('tr', {}, el('td', { colspan: 9, class: 'empty' }, '沒有符合的文章'))
  return el('div', { class: 'table-wrap' }, el('table', { class: 'grid' }, el('thead', {}, head), el('tbody', {}, posts.length ? rows : empty)))
}
