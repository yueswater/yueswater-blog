// Tiny DOM helpers shared by the admin views.
export function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag)
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue
    if (k === 'class') n.className = v
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v)
    else if (k in n) n[k] = v
    else n.setAttribute(k, v === true ? '' : v)
  }
  n.append(...kids.flat().filter((c) => c !== null && c !== undefined && c !== false))
  return n
}

export const fmtTime = (iso) => iso
  ? new Date(iso).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' }).replace(/-/g, '/')
  : '—'

export const fmtDate = (iso) => fmtTime(iso).slice(0, 10)

// <input type="datetime-local"> wants local time without a zone: 2026-11-12T09:30
export const toLocalInput = (iso) => {
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
