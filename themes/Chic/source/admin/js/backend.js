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
  }
}
