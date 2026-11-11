/**
 * Hides unpublished and not-yet-due scheduled posts from the generated site.
 *
 * Before generation every Post document gets `published` set from its group's row in the Supabase post_status
 * table. Hexo's own listings (archives, categories, tags, feeds, sitemap) already skip `published: false`.
 * It runs only on real builds (Vercel, or POST_STATUS_FILTER=1) so a local `hexo server` still shows every post.
 * If Supabase cannot be reached the build goes on with everything visible and says so in the log.
 */
const { groupKey, isLive } = require('./lib/postGroup')
const { fetchStatuses } = require('./lib/statusApi')

const enabled = () => process.env.VERCEL || process.env.POST_STATUS_FILTER === '1'

hexo.extend.filter.register('before_generate', async function () {
  const Post = hexo.model('Post')
  const setAll = (visible) => Promise.all(Post.toArray().filter((p) => p.published !== visible(p)).map((p) => p.update({ published: visible(p) })))
  if (!enabled()) return setAll(() => true)

  const { supabase_url, supabase_anon_key: key } = hexo.theme.config
  const url = process.env.POST_STATUS_URL || supabase_url // the override lets a test point at a stub server
  let rows
  try {
    rows = await fetchStatuses(url, key)
  } catch (err) {
    hexo.log.warn(`[post-status] ${err.message}; building with every post visible`)
    return setAll(() => true)
  }
  const byKey = new Map(rows.map((r) => [r.slug, r]))
  const now = new Date()
  await setAll((p) => isLive(byKey.get(groupKey(p.path)), now))
  const hidden = Post.toArray().filter((p) => !p.published).length
  hexo.log.info(`[post-status] ${hidden} post(s) hidden`)
})
