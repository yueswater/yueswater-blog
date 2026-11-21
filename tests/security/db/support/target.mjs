// The local Supabase under test. URL and keys come from env vars or `supabase status -o env`.
// Hard guard: anything that is not localhost is refused outright, so these tests can never write to
// the production project. When the local stack is down, `skip` carries the reason and suites skip.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\/?$/;

function fromCli() {
  try {
    const out = execFileSync('supabase', ['status', '-o', 'env'], { cwd: ROOT, encoding: 'utf8', timeout: 20_000, stdio: ['ignore', 'pipe', 'ignore'] });
    return Object.fromEntries(out.split('\n').map((l) => l.match(/^([A-Z_]+)="?(.*?)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
  } catch {
    return {};
  }
}

export function assertLocal(url) {
  if (!LOCAL.test(url)) throw new Error(`Refusing to run security db tests against ${url}: only a local Supabase (localhost / 127.0.0.1) is allowed.`);
}

async function reachable(url, key) {
  try {
    const res = await fetch(`${url}/rest/v1/`, { headers: { apikey: key }, signal: AbortSignal.timeout(3000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

let cached;

export function target() {
  cached ||= (async () => {
    const env = process.env.SUPABASE_LOCAL_URL ? {} : fromCli();
    const url = (process.env.SUPABASE_LOCAL_URL || env.API_URL || '').replace(/\/$/, '');
    const anon = process.env.SUPABASE_LOCAL_ANON_KEY || env.ANON_KEY || env.PUBLISHABLE_KEY || '';
    const service = process.env.SUPABASE_LOCAL_SERVICE_KEY || env.SERVICE_ROLE_KEY || env.SECRET_KEY || '';
    const down = '本機 Supabase 沒有在跑：先執行 colima start，再執行 make supabase-up';
    if (!url || !anon || !service) return { skip: down };
    assertLocal(url);
    if (!(await reachable(url, anon))) return { skip: down };
    return { url, anon, service, skip: false };
  })();
  return cached;
}
