// Edge Function `contact-reply`: an admin answers a contact message from the admin inbox; the mail goes out
// through Resend from contact@yueswater.com.
//
// The browser sends only { message_id, body }. Recipient, sender and subject are never read from the
// request: the address comes from the stored message, so this cannot be used to mail anybody else.
//
// Secret (supabase secrets set ...): RESEND_API_KEY. Optional: FROM_NAME (sender display name). SUPABASE_* are provided by Supabase.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { cors, json } from './cors.ts'
import { requireAdmin } from './auth.ts'
import { parseRequest, storedEmail } from './validate.mjs'
import { compose } from './compose.mjs'
import { imageNames } from './images.mjs'
import { sendMail } from './resend.ts'

const PER_HOUR = 20
const IMAGE_TTL = 7 * 24 * 3600 // signed image links in the mail stop working after a week
const MIN_GAP_MS = 10_000

async function sha16(s: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(d)].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  const admin = await requireAdmin(req)
  if (!admin) return json({ error: 'forbidden' }, 403)

  let input: unknown
  try { input = await req.json() } catch { return json({ error: 'bad request' }, 400) }
  const parsed = parseRequest(input)
  if ('error' in parsed) return json({ error: parsed.error }, 400)

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: msg } = await db.from('contact_messages').select('id, ts, email, topic, body, lang').eq('id', parsed.id).maybeSingle()
  if (!msg) return json({ error: 'not found' }, 404)
  const to = storedEmail(msg.email)
  if (!to) return json({ error: 'invalid recipient' }, 422)

  const hourAgo = new Date(Date.now() - 3_600_000).toISOString()
  const { count } = await db.from('contact_replies').select('id', { count: 'exact', head: true }).eq('sent_by', admin.id).gt('ts', hourAgo)
  if ((count ?? 0) >= PER_HOUR) return json({ error: 'rate limited' }, 429)
  const { data: last } = await db.from('contact_replies').select('ts, body').eq('message_id', msg.id).order('ts', { ascending: false }).limit(1)
  const prev = last?.[0]
  // a double click or a retry of the same text is answered as done; the mail itself is deduplicated by Resend
  const sameAsLast = prev && prev.body === parsed.body
  if (prev && !sameAsLast && Date.now() - new Date(prev.ts).getTime() < MIN_GAP_MS) return json({ error: 'too fast' }, 429)
  if (sameAsLast && Date.now() - new Date(prev.ts).getTime() < MIN_GAP_MS) return json({ ok: true, duplicate: true })

  // images are stored under bare file names in a private bucket; the mail gets signed links to them
  const names = [...new Set([...imageNames(parsed.body), ...imageNames(msg.body)])]
  const images: Record<string, string> = {}
  if (names.length) {
    const { data: signed } = await db.storage.from('contact-images').createSignedUrls(names, IMAGE_TTL)
    for (const x of signed ?? []) if (x.signedUrl && x.path) images[x.path] = x.signedUrl
  }

  const key = `contact-reply-${msg.id}-${await sha16(parsed.body)}`
  const sent = await sendMail(compose({ to, msg, body: parsed.body, messageId: msg.id, fromName: Deno.env.get('FROM_NAME') ?? undefined, imageOrigin: Deno.env.get('SUPABASE_URL'), images }), key)
  if (!sent) return json({ error: 'send failed' }, 502)

  const { data: row, error } = await db.from('contact_replies')
    .insert({ message_id: msg.id, body: parsed.body, resend_id: sent.id, sent_by: admin.id }).select('id, ts, body').single()
  if (error) { console.error('record failed', error.code); return json({ ok: true, recorded: false }, 200) }
  await db.from('contact_messages').update({ replied_at: row.ts }).eq('id', msg.id)
  return json({ ok: true, reply: row })
})
