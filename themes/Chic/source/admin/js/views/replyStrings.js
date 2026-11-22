// Strings and toolbar icons for the editor inside the reply dialog (the admin page is zh-TW only).
export const EDITOR_STRINGS = {
  tab_rich: '編輯', tab_source: 'Markdown',
  tool_bold: '粗體', tool_italic: '斜體', tool_link: '連結', tool_code: '行內程式碼', tool_block: '程式碼區塊', tool_image: '圖片',
  link_bad: '請輸入有效的 http 或 https 網址', link_url: '網址', link_text: '連結文字', add: '加入', cancel: '取消', remove: '移除', update: '更新',
  tool_math: '行內公式', tool_math_block: '公式區塊', math_empty: '請輸入 LaTeX',
  lang_filter: '搜尋語言', lang_auto: '自動偵測',
  img_fail: '圖片上傳失敗', img_max: '最多 3 張圖片', img_wait: '圖片上傳中，請稍候', img_type: '只接受 JPG 或 PNG', img_size: '圖片不可超過 5 MB',
  crop_title: '裁切圖片', crop_free: '自由', crop_skip: '不裁切', crop_ok: '套用',
}

const I = {
  bold: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>',
  italic: '<path d="M14 5h-4M14 19h-4M14 5l-4 14"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  code: '<path d="M9 8l-4 4 4 4M15 8l4 4-4 4"/>',
  block: '<rect x="3.5" y="4.5" width="17" height="15" rx="1"/><path d="M9 10l-2 2 2 2M15 10l2 2-2 2"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="1"/><circle cx="9" cy="10" r="1.6"/><path d="M20.5 16l-5-5-8 8.5"/>',
}

// [action, label key, icon]; separators between groups
export const TOOLS = [['bold', 'tool_bold'], ['italic', 'tool_italic'], ['link', 'tool_link'], ['code', 'tool_code'], null, ['block', 'tool_block'], ['image', 'tool_image']]
export const ICONS = I
