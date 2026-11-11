/** Reads the post_status table through Supabase's REST API with the public anon key (the table is readable by everyone). */
async function fetchStatuses(url, anonKey) {
  const res = await fetch(`${url}/rest/v1/post_status?select=slug,status,publish_at`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  })
  if (!res.ok) throw new Error(`post_status: HTTP ${res.status}`)
  return res.json()
}

module.exports = { fetchStatuses }
