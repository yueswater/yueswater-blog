// The real backend: Supabase auth + the post_status table + the redeploy function.
// The table's row-level security is what keeps everybody else out; this page only hides what you cannot use.
export function createBackend({ supabaseUrl, anonKey }) {
  const sb = window.supabase.createClient(supabaseUrl, anonKey)
  const fail = ({ error }) => { if (error) throw error }
  return {
    mode: 'live',
    session: async () => (await sb.auth.getSession()).data.session,
    onAuth: (cb) => sb.auth.onAuthStateChange((_event, session) => cb(session)),
    signIn: async (email, password) => fail(await sb.auth.signInWithPassword({ email, password })),
    signOut: () => sb.auth.signOut(),
    setPassword: async (password) => fail(await sb.auth.updateUser({ password })),
    isAdmin: async () => { const r = await sb.rpc('is_admin'); return !r.error && r.data === true },
    list: async () => { const r = await sb.from('post_status').select('*'); fail(r); return r.data },
    save: async (rows) => fail(await sb.from('post_status').upsert(rows)),
    redeploy: async () => fail(await sb.functions.invoke('redeploy')),
    traffic: async (days) => { const r = await sb.rpc('traffic_summary', { p_days: days }); fail(r); return r.data },
    messages: async () => { const r = await sb.rpc('contact_list', { p_limit: 200 }); fail(r); return r.data },
    imageUrls: async (names) => {
      const r = await sb.storage.from('contact-images').createSignedUrls(names, 3600); fail(r)
      return Object.fromEntries(r.data.filter((x) => x.signedUrl).map((x) => [x.path, x.signedUrl]))
    },
    // the function reads the recipient from the stored message; only { message_id, body } is sent
    sendReply: async (messageId, body) => {
      const { data: { session } } = await sb.auth.getSession()
      let res
      try {
        res = await fetch(`${supabaseUrl}/functions/v1/contact-reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${session?.access_token || ''}` },
          body: JSON.stringify({ message_id: messageId, body }),
        })
      } catch { throw new Error('寄出失敗') }
      const out = await res.json().catch(() => ({}))
      if (!res.ok || !out.ok) throw new Error(out.error === 'rate limited' ? '寄出太頻繁，稍後再試' : out.error === 'too fast' ? '請稍等幾秒再寄' : '寄出失敗')
      return out
    },
    replies: async (ids) => { const r = await sb.rpc('contact_replies_list', { p_message_ids: ids }); fail(r); return r.data },
    markMessage: async (id, read) => fail(await sb.rpc('contact_mark', { p_id: id, p_read: read })),
  }
}
