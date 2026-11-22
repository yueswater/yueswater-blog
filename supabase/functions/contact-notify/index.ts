// Edge Function `contact-notify`: emails the owner when a visitor submits a contact message.
// Called only by the database (AFTER INSERT trigger on contact_messages, through pg_net), never by browsers:
// verify_jwt is off and the caller proves itself with the shared secret in the x-notify-secret header.
//
// Secrets (supabase secrets set ...): NOTIFY_WEBHOOK_SECRET (same value as the Vault secret notify_webhook_secret),
// NOTIFY_EMAIL (the owner's address; unset = do nothing), RESEND_API_KEY. Optional: FROM_NAME.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { sendMail } from '../contact-reply/resend.ts'
import { parsePayload } from './payload.mjs'
import { safeEqual, HEADER } from './secret.mjs'
import { withinBudget } from './burst.mjs'
import { composeNotice } from './mail.mjs'

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply({ error: 'method not allowed' }, 405)
  if (!safeEqual(req.headers.get(HEADER) ?? '', Deno.env.get('NOTIFY_WEBHOOK_SECRET') ?? '')) return reply({ error: 'forbidden' }, 403)

  const to = Deno.env.get('NOTIFY_EMAIL')
  if (!to) return reply({ ok: true, skipped: 'not configured' })

  let input: unknown
  try { input = await req.json() } catch { return reply({ error: 'bad request' }, 400) }
  const parsed = parsePayload(input)
  if ('error' in parsed) return reply({ error: parsed.error }, 400)
  const { msg } = parsed

  // rank of this message among those stored in the last hour; the same for every retry of the same message
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString()
  const { count, error } = await db.from('contact_messages').select('id', { count: 'exact', head: true }).gt('ts', hourAgo).lte('id', msg.id)
  if (!error && !withinBudget(count ?? 1)) {
    console.warn('notification dropped: hourly budget used, rank', count)
    return reply({ ok: true, skipped: 'budget' })
  }

  const mail = composeNotice({ to, msg, fromName: Deno.env.get('FROM_NAME') ?? undefined })
  if (!mail) { console.error('NOTIFY_EMAIL is not a valid address'); return reply({ ok: true, skipped: 'bad recipient' }) }
  const sent = await sendMail(mail, `contact-notify-${msg.id}`)
  // 502 makes pg_net-side tooling see a failure; the message itself is already saved either way
  return sent ? reply({ ok: true }) : reply({ error: 'send failed' }, 502)
})
