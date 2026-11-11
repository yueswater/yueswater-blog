// A stand-in backend for looking at the page without Supabase: only on localhost, only with ?demo
// (?demo=in starts signed in). Nothing leaves the browser. It is no way around the real thing: the
// real data is protected by row-level security on the server.
export function createDemo(signedIn) {
  let user = signedIn ? { user: { email: 'demo@localhost' } } : null
  const listeners = []
  const set = (s) => { user = s; listeners.forEach((cb) => cb(s)) }
  const day = 86400000
  let rows = [
    { slug: 'articles/go/hello-to-go', status: 'unpublished', publish_at: null },
    { slug: 'articles/tullock/tullock-n-player-contest', status: 'scheduled', publish_at: new Date(Date.now() + 2 * day).toISOString() },
  ]
  return {
    mode: 'demo',
    session: async () => user,
    onAuth: (cb) => { listeners.push(cb); return { data: { subscription: { unsubscribe() {} } } } },
    signIn: async () => set({ user: { email: 'demo@localhost' } }),
    setPassword: async () => {},
    signOut: async () => set(null),
    isAdmin: async () => true,
    list: async () => rows,
    save: async (changed) => { rows = [...rows.filter((r) => !changed.some((c) => c.slug === r.slug)), ...changed] },
    redeploy: async () => {},
  }
}
