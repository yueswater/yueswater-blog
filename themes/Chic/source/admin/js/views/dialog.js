// "Schedule" dialog for one post: publish now, take down, or publish at a chosen time.
import { el } from '../dom.js'
import { createDateTime } from './datetime.js'

export function openDialog(post, onSave) {
  const row = post.row
  const at = createDateTime(row && row.publish_at ? new Date(row.publish_at).getTime() : Date.now() + 3600000)
  const mode = (value, text, checked) => el('label', { class: 'radio' }, el('input', { type: 'radio', name: 'mode', value, checked }), text)
  const current = row ? row.status : 'published'
  const when = el('div', { class: 'when' }, el('span', {}, '發布時間'), at.node)
  const form = el('form', { method: 'dialog', class: 'dialog-body' },
    el('h2', {}, post.title),
    mode('published', '立即發布', current === 'published'),
    mode('unpublished', '下架', current === 'unpublished'),
    mode('scheduled', '排程發布', current === 'scheduled'),
    when,
    el('div', { class: 'buttons' },
      el('button', { class: 'btn', value: 'cancel', formnovalidate: true }, '取消'),
      el('button', { class: 'btn primary', value: 'ok' }, '儲存')))
  const showWhen = () => { when.hidden = form.elements.mode.value !== 'scheduled' }
  form.addEventListener('change', showWhen)
  showWhen()
  const dialog = el('dialog', {}, form)
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'ok') {
      const status = form.elements.mode.value
      onSave(post, status, status === 'scheduled' ? at.value().toISOString() : null)
    }
    dialog.remove()
  })
  document.body.append(dialog)
  dialog.showModal()
}
