// Direct SQL against the LOCAL database through psql, for what the REST API cannot show (triggers, Vault).
// The URL comes from SUPABASE_LOCAL_DB_URL or `supabase status -o env`; anything but localhost is refused.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const LOCAL_DB = /^postgres(ql)?:\/\/[^@]*@(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\//;

export function dbUrl() {
  let url = process.env.SUPABASE_LOCAL_DB_URL || '';
  if (!url) {
    try {
      const out = execFileSync('supabase', ['status', '-o', 'env'], { cwd: ROOT, encoding: 'utf8', timeout: 20_000, stdio: ['ignore', 'pipe', 'ignore'] });
      url = (out.match(/^DB_URL="?([^"\n]*)"?$/m) || [])[1] || '';
    } catch { /* stack down */ }
  }
  if (url && !LOCAL_DB.test(url)) throw new Error('Refusing to run SQL against a non-local database.');
  return url;
}

// runs a script and returns stdout; ON_ERROR_STOP makes any SQL error throw
export function psql(url, sql) {
  return execFileSync('psql', [url, '-X', '-q', '-t', '-A', '-v', 'ON_ERROR_STOP=1', '-c', sql], { encoding: 'utf8', timeout: 30_000 }).trim();
}
