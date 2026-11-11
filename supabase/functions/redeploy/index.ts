// Edge Function `redeploy`: asks Vercel for a new build so a status change (or a scheduled post coming due) goes live.
//
// Two callers:
//   - the admin page, with the signed-in admin's JWT: always deploys;
//   - the scheduler (pg_cron), with the header `x-cron-secret`: deploys only if a scheduled post has come due
//     since the last deploy.
//
// Secrets (supabase secrets set ...): VERCEL_DEPLOY_HOOK_URL, CRON_SECRET.
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  const url = Deno.env.get('SUPABASE_URL')!
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const cron = req.headers.get('x-cron-secret')
  if (cron) {
    if (cron !== Deno.env.get('CRON_SECRET')) return json({ error: 'forbidden' }, 403)
    const { data: last } = await admin.from('deploy_log').select('deployed_at').order('deployed_at', { ascending: false }).limit(1)
    const since = last?.[0]?.deployed_at ?? '1970-01-01T00:00:00Z'
    const { count } = await admin.from('post_status').select('slug', { count: 'exact', head: true })
      .eq('status', 'scheduled').lte('publish_at', new Date().toISOString()).gt('publish_at', since)
    if (!count) return json({ deployed: false, reason: 'nothing due' })
  } else {
    // the caller's own token, checked against the same is_admin() the table policies use
    const user = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: ok } = await user.rpc('is_admin')
    if (!ok) return json({ error: 'forbidden' }, 403)
  }

  const hook = await fetch(Deno.env.get('VERCEL_DEPLOY_HOOK_URL')!, { method: 'POST' })
  if (!hook.ok) return json({ error: `vercel hook: HTTP ${hook.status}` }, 502)
  await admin.from('deploy_log').insert({})
  return json({ deployed: true })
})
