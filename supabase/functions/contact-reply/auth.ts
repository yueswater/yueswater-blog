// The caller must be a signed-in admin: their own token, checked against the same is_admin() the tables use.
import { createClient } from 'jsr:@supabase/supabase-js@2'

export async function requireAdmin(req: Request): Promise<{ id: string } | null> {
  const authorization = req.headers.get('Authorization') ?? ''
  if (!authorization) return null
  const user = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
  })
  const { data: ok } = await user.rpc('is_admin')
  if (ok !== true) return null
  const { data } = await user.auth.getUser()
  return data?.user ? { id: data.user.id } : null
}
