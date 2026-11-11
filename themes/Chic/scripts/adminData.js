/**
 * /admin/data.json: what the admin page needs from the build. The Supabase address and public anon key (the same
 * ones the view counter uses) and one entry per post group (a Chinese post with its English edition).
 * Built from the Post model, not site.posts, so posts that are currently hidden still appear on the page.
 */
const { groupKey } = require('./lib/postGroup')

hexo.extend.generator.register('admin-data', function () {
  const groups = new Map()
  for (const post of hexo.model('Post').toArray()) {
    const key = groupKey(post.path)
    const title = String(post.title).replace(/\$/g, '') // titles may hold $math$: shown as plain text here
    const g = groups.get(key) || { key, title: '', titleEn: '', langs: [], category: '', date: null }
    const en = post.lang === 'en'
    if (en) g.titleEn = title
    else g.title = title
    if (!g.langs.includes(en ? 'en' : 'zh')) g.langs.push(en ? 'en' : 'zh')
    const cats = post.categories.toArray()
    if (!g.category && cats.length) g.category = cats[0].name
    if (!g.date || (!en && post.date.valueOf() < g.date)) g.date = post.date.valueOf()
    groups.set(key, g)
  }
  const posts = [...groups.values()]
    .map((g) => ({ ...g, langs: g.langs.sort().reverse(), title: g.title || g.titleEn, date: new Date(g.date).toISOString() }))
    .sort((a, b) => b.date.localeCompare(a.date))
  const { supabase_url: supabaseUrl, supabase_anon_key: anonKey } = hexo.theme.config
  return { path: 'admin/data.json', data: JSON.stringify({ supabaseUrl, anonKey, posts }) }
})
