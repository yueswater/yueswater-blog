// Strings and toolbar icons for the editor inside the reply dialog (the admin page is zh-TW; en is picked when the page language is English).
const ZH = {
  tab_rich: '編輯', tab_source: 'Markdown',
  tool_bold: '粗體', tool_italic: '斜體', tool_strike: '刪除線', tool_h2: '大標題 (H2)', tool_h3: '小標題 (H3)', tool_bullet: '項目清單', tool_ordered: '編號清單', tool_quote: '引用', tool_hr: '分隔線', tool_undo: '復原', tool_redo: '重做', bar_label: '格式',
  placeholder: '寫下回覆，寄出後訪客會從 contact@yueswater.com 收到', source_label: '回覆內容（Markdown）',
  tool_link: '連結', tool_code: '行內程式碼', tool_block: '程式碼區塊', tool_image: '圖片',
  link_bad: '請輸入有效的 http 或 https 網址', link_url: '網址', link_text: '連結文字', add: '加入', cancel: '取消', remove: '移除', update: '更新',
  tool_math: '行內公式', tool_math_block: '公式區塊', math_empty: '請輸入 LaTeX',
  lang_filter: '搜尋語言', lang_auto: '自動偵測',
  img_fail: '圖片上傳失敗', img_max: '最多 3 張圖片', img_wait: '圖片上傳中，請稍候', img_type: '只接受 JPG 或 PNG', img_size: '圖片不可超過 5 MB',
  crop_title: '裁切圖片', crop_free: '自由', crop_skip: '不裁切', crop_ok: '套用',
}

const EN = {
  ...ZH,
  tab_rich: 'Write', tab_source: 'Markdown',
  tool_bold: 'Bold', tool_italic: 'Italic', tool_strike: 'Strikethrough', tool_h2: 'Heading 2', tool_h3: 'Heading 3', tool_bullet: 'Bullet list', tool_ordered: 'Numbered list', tool_quote: 'Quote', tool_hr: 'Divider', tool_undo: 'Undo', tool_redo: 'Redo',
  tool_link: 'Link', tool_code: 'Inline code', tool_block: 'Code block', tool_image: 'Image', bar_label: 'Formatting',
  placeholder: 'Write a reply. The visitor receives it from contact@yueswater.com', source_label: 'Reply (Markdown)',
  link_bad: 'Enter a valid http or https URL', link_url: 'URL', link_text: 'Link text', add: 'Add', cancel: 'Cancel', remove: 'Remove', update: 'Update',
  lang_filter: 'Search languages', lang_auto: 'Auto-detect',
  img_fail: 'Image upload failed', img_max: 'At most 3 images', img_wait: 'Uploading image, please wait', img_type: 'JPG or PNG only', img_size: 'Image must be under 5 MB',
  crop_title: 'Crop image', crop_free: 'Free', crop_skip: 'Skip', crop_ok: 'Apply',
}
export const EDITOR_STRINGS = (typeof document !== 'undefined' && /^en/i.test(document.documentElement.lang)) ? EN : ZH
const I = {
  bold: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>',
  italic: '<path d="M14 5h-4M14 19h-4M14 5l-4 14"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  code: '<path d="M9 8l-4 4 4 4M15 8l4 4-4 4"/>',
  block: '<rect x="3.5" y="4.5" width="17" height="15" rx="1"/><path d="M9 10l-2 2 2 2M15 10l2 2-2 2"/>',
  strike: '<path d="M5 12h14M8.5 7.5C9 6 10.4 5 12.2 5c2 0 3.5 1 3.5 2.7M8.3 16.3C8.6 18 10 19 12 19c2.2 0 3.7-1.1 3.7-2.8"/>',
  h2: '<path d="M4 6v12M4 12h8M12 6v12M16 10.5c.4-1 1.2-1.5 2.2-1.5 1.3 0 2.1.8 2.1 1.8 0 1.7-4.3 3.4-4.3 6.2h4.4"/>',
  h3: '<path d="M4 6v12M4 12h8M12 6v12M16 9h4l-2.3 3c1.4 0 2.6.8 2.6 2.3 0 1.4-1.1 2.2-2.4 2.2-1 0-1.7-.4-2.1-1"/>',
  bullet: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  ordered: '<path d="M10 6h10M10 12h10M10 18h10M4 5l1.5-1v5M3.8 13.5c.3-.7 1-1 1.6-1 .9 0 1.4.5 1.4 1.2 0 1.1-2.9 2-2.9 3.3H7"/>',
  quote: '<path d="M10 7H6.5A1.5 1.5 0 0 0 5 8.5V12h4v4.5M19 7h-3.5A1.5 1.5 0 0 0 14 8.5V12h4v4.5"/>',
  hr: '<path d="M4 12h16M7 7h10M7 17h10" stroke-dasharray="0.1 3"/>',
  undo: '<path d="M9 7L4.5 11.5 9 16M5 11.5h9a5 5 0 0 1 0 10h-2" transform="translate(0 -3)"/>',
  redo: '<path d="M15 7l4.5 4.5L15 16M19 11.5h-9a5 5 0 0 0 0 10h2" transform="translate(0 -3)"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="1"/><circle cx="9" cy="10" r="1.6"/><path d="M20.5 16l-5-5-8 8.5"/>',
}

// [action, label key]; null = separator between groups
export const TOOLS = [
  ['undo', 'tool_undo'], ['redo', 'tool_redo'], null,
  ['h2', 'tool_h2'], ['h3', 'tool_h3'], null,
  ['bold', 'tool_bold'], ['italic', 'tool_italic'], ['strike', 'tool_strike'], ['code', 'tool_code'], ['link', 'tool_link'], null,
  ['bullet', 'tool_bullet'], ['ordered', 'tool_ordered'], ['quote', 'tool_quote'], ['hr', 'tool_hr'], null,
  ['block', 'tool_block'], ['image', 'tool_image'],
]
// keyboard shortcuts shown in the tooltips ('Mod' is Cmd on a Mac, Ctrl elsewhere); hr has none
export const SHORTCUTS = {
  undo: 'Mod+Z', redo: 'Mod+Shift+Z', h2: 'Mod+Alt+2', h3: 'Mod+Alt+3', bold: 'Mod+B', italic: 'Mod+I', strike: 'Mod+Shift+S',
  code: 'Mod+E', link: 'Mod+K', bullet: 'Mod+Shift+8', ordered: 'Mod+Shift+7', quote: 'Mod+Shift+B', block: 'Mod+Alt+C',
}
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
export const shortcutHint = (action) => {
  const k = SHORTCUTS[action]
  if (!k) return ''
  return isMac ? k.replace('Mod', '⌘').replace('Shift', '⇧').replace('Alt', '⌥').replace(/\+/g, '') : k.replace('Mod', 'Ctrl')
}
export const ICONS = I
