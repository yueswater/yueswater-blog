// Which images may appear in a mail. Only https URLs on our own Supabase storage origin, or bare file names
// the function has itself turned into signed URLs. Everything else becomes a text placeholder.
const FILE = /^[\w-]+\.(?:png|jpe?g)$/i

export function imageResolver({ origin, images = {} } = {}) {
  let allowed = null
  try { allowed = origin ? new URL(origin).origin : null } catch { /* no usable origin: no images */ }
  const ours = (raw) => {
    if (!allowed) return null
    try {
      const u = new URL(raw)
      return u.protocol === 'https:' && u.origin === allowed && u.pathname.startsWith('/storage/v1/object/') ? u.href : null
    } catch { return null }
  }
  return (src) => (FILE.test(src) ? ours(images[src] ?? '') : ours(src))
}

// the stored file names a piece of Markdown refers to (what index.ts has to sign)
export const imageNames = (md) => [...new Set([...String(md ?? '').matchAll(/!\[[^\]\n]*\]\(([\w-]+\.(?:png|jpe?g))\)/gi)].map((m) => m[1]))]
