// Builds the markup the contact editor expects (tabs, toolbar, rich area, source textarea) and starts it.
import { el } from '../dom.js'
import { createContactEditor } from '/js/widgets/contact/editor.bundle.js'
import { EDITOR_STRINGS as S, TOOLS, MATH_TOOLS, ICONS, shortcutHint } from './replyStrings.js'

const svg = (inner) => { const n = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); n.setAttribute('viewBox', '0 0 24 24'); n.setAttribute('aria-hidden', 'true'); n.innerHTML = inner; return n }

// math: opt-in formula buttons (the visitor form never gets them)
export function createReplyEditor({ toast, resolveImage, math = false }) {
  const tab = (mode, on) => el('button', { type: 'button', class: 'cf-tab', role: 'tab', 'data-tab': mode, 'aria-selected': String(on), tabindex: on ? 0 : -1 }, S[`tab_${mode}`])
  const tip = (t) => { const k = shortcutHint(t[0]); return k ? `${S[t[1]]} (${k})` : S[t[1]] }
  const tools = (math ? [...TOOLS, ...MATH_TOOLS] : TOOLS).map((t) => t
    ? el('button', { type: 'button', class: 'cf-tool', 'data-action': t[0], title: tip(t), 'aria-label': S[t[1]] }, svg(ICONS[t[0]]))
    : el('span', { class: 'cf-tool-sep', 'aria-hidden': 'true' }))
  const root = el('div', { class: 'cf-editor', 'data-editor': '', 'data-mode': 'rich' },
    el('div', { class: 'cf-editor-bar' },
      el('div', { class: 'cf-tabs', role: 'tablist' }, tab('rich', true), tab('source', false)),
      el('div', { class: 'cf-tools', role: 'toolbar', 'aria-label': S.bar_label }, ...tools,
        el('input', { type: 'file', accept: 'image/png,image/jpeg', multiple: true, hidden: true, 'data-image-picker': '' }))),
    el('div', { class: 'cf-textarea-wrap' },
      el('div', { class: 'cf-input cf-rich', 'data-rich': '', 'data-placeholder': S.placeholder }),
      el('textarea', { class: 'cf-input cf-textarea', rows: 8, 'aria-label': S.source_label })))
  const editor = createContactEditor(root, { strings: S, toast, resolveImage, admin: true })
  return { root, editor, textarea: root.querySelector('textarea') }
}
