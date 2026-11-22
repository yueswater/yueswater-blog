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
  const inbox = [
    { id: 2, ts: new Date(Date.now() - 3600000).toISOString(), name: '示範訪客', email: 'visitor@example.com', topic: 'post', org: '某大學經濟系', ip: '203.0.113.7', body: '文章裡**第二個式子**的下標好像寫反了：\n\n1. 原文寫 $x_{ij}$\n2. 應該是 $x_{ji}$？\n\n$$\n\\sum_{i=1}^n x_{ji}\n$$\n\n```python\nprint(sum(x))\n```\n\n![截圖](demo.png)', lang: 'zh-TW', read_at: null },
    { id: 1, ts: new Date(Date.now() - 3 * day).toISOString(), name: 'Demo Visitor', email: 'demo@example.com', topic: 'collab', body: 'Would you be interested in giving a short talk about econ-viz?', lang: 'en', read_at: new Date(Date.now() - 2 * day).toISOString() },
  ]
  const thread = [] // replies sent in this demo session
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
    messages: async () => inbox,
    imageUrls: async (names) => Object.fromEntries(names.map((n) => [n, '/assets/favicon-192.png'])),
    markMessage: async (id, read) => { const m = inbox.find((x) => x.id === id); if (m) m.read_at = read ? new Date().toISOString() : null },
    uploadImage: async () => {}, // nothing leaves the browser in demo mode
    sendReply: async (messageId, body) => {
      await new Promise((r) => setTimeout(r, 400))
      const m = inbox.find((x) => x.id === messageId)
      const reply = { id: thread.length + 1, message_id: messageId, ts: new Date().toISOString(), body }
      thread.push(reply)
      if (m) m.replied_at = reply.ts
      return { ok: true, reply }
    },
    replies: async (ids) => thread.filter((t) => ids.includes(t.message_id)),
    traffic: async (days) => ({
      days, total: 42,
      channels: [{ channel: 'facebook', n: 18 }, { channel: 'direct', n: 12 }, { channel: 'google', n: 7 }, { channel: 'threads', n: 5 }],
      campaigns: [{ campaign: 'launch', source: 'ig', medium: 'social', n: 9 }],
      pages: [{ path: '/', n: 20 }, { path: '/posts/articles/go/hello-to-go/', n: 11 }],
    }),
  }
}
