// Deployment and dependency configuration. Production headers come from vercel.json (the local hexo
// server sets none), so the header checks read that file; key and dependency checks read what the
// site actually serves and what npm installed.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..', '..', '..');
const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));

// headers Vercel would send for a path (simple prefix match of the "source" patterns)
function headersFor(p) {
  const out = {};
  for (const rule of vercel.headers || []) {
    const re = new RegExp(`^${rule.source.replace(/\(\.\*\)/g, '.*').replace(/:[\w]+\*/g, '.*').replace(/:[\w]+/g, '[^/]+')}$`);
    if (re.test(p)) for (const h of rule.headers) out[h.key.toLowerCase()] = h.value;
  }
  return out;
}

const decodeJwt = (t) => JSON.parse(Buffer.from(t.split('.')[1], 'base64url').toString());

test.describe('headers and configuration', () => {
  test('TC-SEC-ADM-004 /admin/ refuses to be framed (clickjacking)', () => {
    const h = headersFor('/admin/');
    const framed = /deny|sameorigin/i.test(h['x-frame-options'] || '') || /frame-ancestors/i.test(h['content-security-policy'] || '');
    expect(framed, 'vercel.json sets neither X-Frame-Options nor CSP frame-ancestors for /admin/').toBe(true);
  });

  test('TC-SEC-CFG-003 /contact/ is served with a Content-Security-Policy', () => {
    expect(headersFor('/contact/')['content-security-policy'], 'no CSP header configured in vercel.json').toBeTruthy();
  });

  test('TC-SEC-CFG-004 the key in the page is the public anon / publishable key', async ({ page }) => {
    await page.route(/\.supabase\.co\//, (r) => r.abort());
    await page.goto('/contact/');
    const key = await page.evaluate(() => window.SUPABASE_ANON_KEY);
    expect(key).toBeTruthy();
    if (key.startsWith('eyJ')) expect(decodeJwt(key).role).toBe('anon');
    else expect(key).toMatch(/^sb_publishable_/);
  });

  test('TC-SEC-CFG-005 no service-role key is served or committed', async ({ request }) => {
    const served = ['/contact/', '/admin/', '/js/widgets/contact/main.js', '/js/widgets/contact/editor.bundle.js', '/admin/js/backend.js'];
    for (const p of served) {
      const text = await (await request.get(p)).text();
      expect(text, p).not.toMatch(/service_role|sb_secret_/);
      for (const jwt of text.match(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g) || []) expect(decodeJwt(jwt).role, p).not.toBe('service_role');
    }
    // git grep exits 1 when nothing matches, which is the passing case
    let tracked = '';
    try {
      tracked = execFileSync('git', ['grep', '-l', '-E', 'sb_secret_|"role":"service_role"', '--', 'themes', 'source', 'tools'], { cwd: ROOT, encoding: 'utf8' }).trim();
    } catch (e) {
      if (e.status !== 1) throw e;
    }
    expect(tracked).toBe('');
  });

  test('TC-SEC-CFG-002 bundled KaTeX includes the trust / maxExpand fixes', () => {
    const v = require(path.join(ROOT, 'node_modules', 'katex', 'package.json')).version.split('.').map(Number);
    // CVE-2024-28243..28246 were fixed in 0.16.10 and 0.16.21
    expect(v[0] > 0 || v[1] > 16 || (v[1] === 16 && v[2] >= 21)).toBe(true);
  });

  test('TC-SEC-CFG-001 npm audit reports no high or critical advisories', () => {
    test.setTimeout(90_000);
    let report;
    try {
      report = execFileSync('npm', ['audit', '--json'], { cwd: ROOT, encoding: 'utf8', timeout: 80_000, stdio: ['ignore', 'pipe', 'ignore'] });
    } catch (e) {
      report = e.stdout; // npm audit exits non-zero when it finds anything
    }
    test.skip(!report || !report.trim().startsWith('{'), 'npm audit unavailable (offline or registry error)');
    const { metadata = {}, vulnerabilities = {} } = JSON.parse(report);
    const v = metadata.vulnerabilities || {};
    const names = Object.entries(vulnerabilities).filter(([, x]) => ['high', 'critical'].includes(x.severity)).map(([k]) => k);
    // the editor bundle ships tiptap / prosemirror / katex / lowlight; anything else is build tooling
    const shipped = names.filter((n) => /^(@tiptap\/|prosemirror|katex|lowlight|highlight\.js)/.test(n));
    expect({ high: v.high || 0, critical: v.critical || 0 }, `high/critical: ${names.join(', ')}; in the browser bundle: ${shipped.join(', ') || 'none'}`).toEqual({ high: 0, critical: 0 });
  });
});
