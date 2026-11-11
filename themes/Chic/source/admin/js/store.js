// Joins what the build knows (every post group, data.json) with what Supabase says (post_status rows).

export const LABEL = { published: '已發布', scheduled: '排程中', unpublished: '已下架' }

// what a visitor sees right now: a scheduled post whose time has passed is already live
export function effective(row, now = new Date()) {
  if (!row || row.status === 'published') return { state: 'published' }
  if (row.status === 'unpublished') return { state: 'unpublished' }
  return new Date(row.publish_at) <= now ? { state: 'published', due: true } : { state: 'scheduled' }
}

// oldest = #0001, like the numbering on the site's listings
export function build(data, rows, now = new Date()) {
  const byKey = new Map(rows.map((r) => [r.slug, r]))
  const order = [...data.posts].sort((a, b) => a.date.localeCompare(b.date))
  const no = new Map(order.map((p, i) => [p.key, i + 1]))
  return data.posts.map((p) => {
    const row = byKey.get(p.key) || null
    return { ...p, no: no.get(p.key), row, eff: effective(row, now) }
  })
}

export const counts = (posts) => ({
  all: posts.length,
  published: posts.filter((p) => p.eff.state === 'published').length,
  scheduled: posts.filter((p) => p.eff.state === 'scheduled').length,
  unpublished: posts.filter((p) => p.eff.state === 'unpublished').length,
})

export const matches = (p, q, tab) =>
  (tab === 'all' || p.eff.state === tab) &&
  (!q || [p.title, p.titleEn, p.key, p.category].some((s) => String(s || '').toLowerCase().includes(q.toLowerCase())))
