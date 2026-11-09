#!/usr/bin/env node
// Push reports/out/**/<zh|en>.pdf to the public Supabase Storage bucket `pdfs`, keeping the folder
// layout (articles/line-sticker/zh.pdf ...). Creates the bucket on first run. Safe to re-run: existing
// files are overwritten.
//
//   node reports/tools/upload.mjs            # everything in reports/out
//   node reports/tools/upload.mjs line-sticker
//
// Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the environment or from the untracked .env.
// The service-role key never leaves this machine and must not go into the repo or the theme config.
import fs from 'node:fs'
import path from 'node:path'

const BUCKET = 'pdfs'
const OUT = 'reports/out'
const only = process.argv[2]

// minimal .env reader (KEY=VALUE per line)
const env = { ...process.env }
if (fs.existsSync('.env')) {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line)
    if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
}
const url = (env.SUPABASE_URL || '').replace(/\/$/, '')
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (put them in .env, which git ignores).')
  process.exit(1)
}
const headers = { apikey: key, Authorization: `Bearer ${key}` }

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) yield* walk(p)
    else if (e.name.endsWith('.pdf')) yield p
  }
}

async function ensureBucket() {
  const res = await fetch(`${url}/storage/v1/bucket/${BUCKET}`, { headers })
  if (res.ok) return
  const created = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, allowed_mime_types: ['application/pdf'], file_size_limit: 52428800 }),
  })
  if (!created.ok) throw new Error(`could not create bucket: ${created.status} ${await created.text()}`)
  console.log(`created public bucket "${BUCKET}"`)
}

await ensureBucket()
const files = [...walk(OUT)].filter((f) => !only || f.includes(only)).sort()
let bad = 0
for (const file of files) {
  const dest = path.relative(OUT, file).split(path.sep).join('/')
  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${dest}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/pdf', 'x-upsert': 'true', 'cache-control': 'max-age=3600' },
    body: fs.readFileSync(file),
  })
  if (res.ok) console.log(`ok    ${dest}`)
  else { bad++; console.log(`FAIL  ${dest}  ${res.status} ${await res.text()}`) }
}
console.log(`\n${files.length - bad}/${files.length} uploaded`)
if (bad) process.exitCode = 1
