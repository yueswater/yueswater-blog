// The signed-in page: header, toolbar, table. Holds the view state and applies status changes.
import { el } from '../dom.js'
import { build, counts, matches } from '../store.js'
import { renderToolbar } from './toolbar.js'
import { renderTable } from './table.js'
import { openDialog } from './dialog.js'
import { renderTraffic } from './traffic.js'

export async function renderDashboard(root, { backend, data, email, onSignOut }) {
  const state = { q: '', tab: 'all', selected: new Set(), view: 'posts' }
  let posts = build(data, await backend.list())
  const toast = el('div', { class: 'toast', role: 'status', hidden: true })
  const body = el('div', { class: 'content' })
  let timer

  const notify = (text, kind = '') => {
    toast.textContent = text
    toast.className = `toast ${kind}`
    toast.hidden = false
    clearTimeout(timer)
    timer = setTimeout(() => { toast.hidden = true }, 6000)
  }

  // keys: group keys; the change is written for each, then a rebuild is requested
  async function apply(keys, status, publishAt = null) {
    if (status === 'scheduled' && !publishAt) return notify('請選擇發布時間', 'warn')
    try {
      await backend.save(keys.map((slug) => ({ slug, status, publish_at: publishAt })))
    } catch (e) {
      return notify(`儲存失敗：${e.message || e}`, 'warn')
    }
    posts = build(data, await backend.list())
    keys.forEach((k) => state.selected.delete(k))
    draw(true)
    try {
      await backend.redeploy()
      notify('已儲存，網站約 1 至 3 分鐘後更新。')
    } catch {
      notify('已儲存，但沒能觸發重新部署，請稍後再試。', 'warn')
    }
  }

  function draw() {
    const shown = posts.filter((p) => matches(p, state.q, state.tab))
    const keep = document.activeElement && document.activeElement.classList.contains('search')
    body.replaceChildren(
      renderToolbar({ state, count: counts(posts), onChange: draw, onBulk: (status) => apply([...state.selected], status) }),
      renderTable({
        posts: shown, state,
        onSelect: (key, on) => { on ? state.selected.add(key) : state.selected.delete(key); draw() },
        onSelectAll: (on) => { shown.forEach((p) => (on ? state.selected.add(p.key) : state.selected.delete(p.key))); draw() },
        onToggle: (p, status) => apply([p.key], status),
        onEdit: (p) => openDialog(p, (post, status, at) => apply([post.key], status, at)),
      }))
    if (keep) { const s = body.querySelector('.search'); s.focus(); s.setSelectionRange(s.value.length, s.value.length) }
  }

  const views = [['posts', '文章'], ['traffic', '流量來源']]
  const viewTabs = views.map(([key, label]) => el('button', { class: 'tab', onclick: () => setView(key) }, label))
  function setView(key) {
    state.view = key
    viewTabs.forEach((b, i) => b.setAttribute('aria-selected', String(views[i][0] === key)))
    if (key === 'traffic') renderTraffic(body, { backend })
    else draw()
  }

  root.replaceChildren(
    el('header', { class: 'bar' },
      el('strong', {}, '文章管理'),
      el('div', { class: 'tabs' }, ...viewTabs),
      backend.mode === 'demo' ? el('span', { class: 'pill unpublished' }, '示範模式') : null,
      el('span', { class: 'spacer' }),
      el('span', { class: 'muted small' }, email),
      el('button', { class: 'btn small', onclick: onSignOut }, '登出')),
    body, toast)
  setView('posts')
}
