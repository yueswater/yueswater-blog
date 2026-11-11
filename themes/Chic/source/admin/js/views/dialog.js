// "Schedule" dialog for one post: publish now, take down, or publish at a chosen time.
import { el, toLocalInput } from '../dom.js'

export function openDialog(post, onSave) {
  const row = post.row
  const at = el('input', { type: 'datetime-local', value: toLocalInput(row && row.publish_at ? row.publish_at : Date.now() + 3600000) })
  const mode = (value, text, checked) => el('label', { class: 'radio' }, el('input', { type: 'radio', name: 'mode', value, checked }), text)
  const current = row ? row.status : 'published'
  const form = el('form', { method: 'dialog', class: 'dialog-body' },
    el('h2', {}, post.title),
    el('p', { class: 'muted small' }, `中文與英文版會一起變更（${post.key}）`),
    mode('published', '立即發布', current === 'published'),
    mode('unpublished', '下架', current === 'unpublished'),
    mode('scheduled', '排程發布', current === 'scheduled'),
    el('label', { class: 'when' }, '發布時間', at),
    el('div', { class: 'buttons' },
      el('button', { class: 'btn', value: 'cancel', formnovalidate: true }, '取消'),
      el('button', { class: 'btn primary', value: 'ok' }, '儲存')))
  const dialog = el('dialog', {}, form)
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'ok') {
      const status = form.elements.mode.value
      onSave(post, status, status === 'scheduled' ? new Date(at.value).toISOString() : null)
    }
    dialog.remove()
  })
  document.body.append(dialog)
  dialog.showModal()
}
