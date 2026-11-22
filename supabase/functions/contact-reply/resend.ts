// One call to Resend. The key comes from the function's secrets and never leaves this file.
export async function sendMail(mail: Record<string, unknown>, idempotencyKey: string): Promise<{ id: string } | null> {
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) { console.error('RESEND_API_KEY is not set'); return null }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(mail),
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) { console.error('resend HTTP', res.status, (await res.text()).slice(0, 300)); return null }
    const data = await res.json()
    return typeof data?.id === 'string' ? { id: data.id } : null
  } catch (e) {
    console.error('resend failed', e instanceof Error ? e.name : 'error')
    return null
  }
}
