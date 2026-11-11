/**
 * A Chinese post and its English edition are one unit for the admin page: they share a group key, the
 * post path without the trailing "-en/" (articles/tullock/foo and articles/tullock/foo-en -> articles/tullock/foo).
 * isLive(row, now) says whether the group is visible, given its post_status row (no row = published).
 */
const groupKey = (path) => String(path).replace(/^\//, '').replace(/index\.html$/, '').replace(/-en\/?$/, '').replace(/\/$/, '')

function isLive(row, now = new Date()) {
  if (!row || row.status === 'published') return true
  if (row.status === 'scheduled') return Boolean(row.publish_at) && new Date(row.publish_at) <= now
  return false
}

module.exports = { groupKey, isLive }
