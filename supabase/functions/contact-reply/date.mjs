// Sent time for the quote header: Taipei time, readable, never the raw ISO string.
const ZONE = 'Asia/Taipei'

export function formatTime(iso, lang) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const get = (parts, t) => parts.find((p) => p.type === t)?.value ?? ''
  if (lang === 'en') {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: ZONE, year: 'numeric', month: 'short', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d)
    return `${get(p, 'weekday')}, ${get(p, 'month')} ${get(p, 'day')}, ${get(p, 'year')} ${get(p, 'hour')}:${get(p, 'minute')} (Taipei, UTC+8)`
  }
  const p = new Intl.DateTimeFormat('zh-TW', { timeZone: ZONE, year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d)
  return `${get(p, 'year')} 年 ${get(p, 'month')} 月 ${get(p, 'day')} 日（${get(p, 'weekday').replace(/^週|^星期/, '週')}）${get(p, 'hour')}:${get(p, 'minute')}（台北時間）`
}
