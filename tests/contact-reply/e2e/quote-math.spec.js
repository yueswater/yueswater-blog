// Formulas in the quoted visitor message: the browser draws them to PNG and sends quote_math next to math (demo backend;
// Resend and every other host must never be called, Supabase is fully route-mocked and an unmocked request fails).
const { test: base, expect } = require('@playwright/test');
const { mockSupabase } = require('../../contact/e2e/support/supabase-mock');
const { isolatePage } = require('../../contact/e2e/support/isolation');
const { PATHS, BASE_URL } = require('../../contact/e2e/support/server');

const UUID_PNG = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/;
// the demo inbox's newest message has $x_{ij}$, $x_{ji}$ and a $$ sum $$; "broken" swaps the second one for LaTeX MathJax rejects
async function recordDemo(page, broken) {
  await page.route(/\/admin\/js\/demo\.js/, async (route) => {
    const res = await route.fetch();
    let src = (await res.text())
      .replace('sendReply: async (messageId, body) => {', 'sendReply: async (messageId, body, math, quoteMath) => { window.__sent = { messageId, body, math, quoteMath };')
      .replace('uploadImage: async () => {},', 'uploadImage: async (name, blob) => { (window.__png ||= []).push({ name, type: blob.type, size: blob.size }); },');
    if (broken) src = src.replace('$x_{ji}$？', '$\\\\left( x$？');
    if (!src.includes('window.__sent') || !src.includes('window.__png') || (broken && !src.includes('left( x'))) throw new Error('demo.js changed; update tests/contact-reply/e2e/quote-math.spec.js');
    return route.fulfill({ response: res, body: src, headers: { ...res.headers(), 'content-type': 'text/javascript' } });
  });
}

const make = (broken) => base.extend({
  admin: async ({ page }, use) => {
    const outside = [];
    page.on('request', (r) => { const u = new URL(r.url()); if (!/^(localhost|127\.0\.0\.1)$/.test(u.hostname) && u.protocol.startsWith('http')) outside.push(r.url()); });
    await isolatePage(page);
    page.supabase = await mockSupabase(page);
    await recordDemo(page, broken);
    await page.goto(PATHS.admin);
    await page.getByRole('button', { name: '留言' }).click();
    await page.locator('.msg summary').first().click();
    await page.getByRole('button', { name: '回信' }).first().click();
    await page.locator('.rc-modal').waitFor();
    outside.length = 0;
    await use(page);
    expect(outside.filter((u) => !u.startsWith(BASE_URL)), 'requests to other hosts (Resend included)').toEqual([]);
    expect(page.supabase.stray, 'unmocked supabase requests').toEqual([]);
  },
});
const modal = (p) => p.locator('.rc-modal');
const source = async (p, md) => { await modal(p).locator('[data-tab="source"]').click(); await modal(p).locator('textarea').fill(md); };
const send = (p) => modal(p).getByRole('button', { name: '寄出' });

const test = make(false);
test('quoted visitor formulas are drawn, uploaded and sent as quote_math beside math', async ({ admin }) => {
  await source(admin, 'thanks $z$');
  await send(admin).click();
  await expect(admin.locator('.msg-reply')).toHaveCount(1);
  const sent = await admin.evaluate(() => window.__sent);
  const png = await admin.evaluate(() => window.__png);
  expect(sent.math).toHaveLength(1);
  expect(sent.quoteMath).toHaveLength(3);
  expect(sent.quoteMath.map((m) => [m.display, m.tex])).toEqual([[false, 'x_{ij}'], [false, 'x_{ji}'], [true, '\\sum_{i=1}^n x_{ji}']]);
  for (const m of sent.quoteMath) expect(m.path).toMatch(UUID_PNG);
  expect(sent.quoteMath[2].w).toBe(560);
  expect(sent.quoteMath[0].w).toBeLessThan(60);
  expect(Number.isFinite(sent.quoteMath[0].d)).toBe(true);
  expect(png).toHaveLength(4); // 1 reply formula + 3 quote formulas
  expect([...sent.math, ...sent.quoteMath].map((m) => m.path).sort()).toEqual(png.map((p) => p.name).sort());
  expect(png.every((p) => p.type === 'image/png' && p.size > 100)).toBe(true);
});

test('a reply without formulas still sends the quote formulas, and no math field', async ({ admin }) => {
  await source(admin, 'plain thanks');
  await send(admin).click();
  await expect(admin.locator('.msg-reply')).toHaveCount(1);
  const sent = await admin.evaluate(() => window.__sent);
  expect(sent.math).toBeUndefined();
  expect(sent.quoteMath).toHaveLength(3);
});

test('reply and quote together over 20 formulas: clear error, nothing uploaded or sent', async ({ admin }) => {
  await source(admin, Array.from({ length: 19 }, (_, i) => `$a_${i}$`).join(' '));
  await send(admin).click();
  await expect(modal(admin).locator('.form-error')).toContainText('合計最多 20 個公式');
  expect(await admin.evaluate(() => window.__sent)).toBeUndefined();
  expect(await admin.evaluate(() => window.__png)).toBeUndefined();
});

const broken = make(true);
broken('invalid LaTeX in the quote warns but does not block sending; it stays text', async ({ admin }) => {
  await expect(modal(admin).locator('.form-warn')).toContainText('無法解析');
  await source(admin, 'thanks');
  await send(admin).click();
  await expect(admin.locator('.msg-reply')).toHaveCount(1);
  const sent = await admin.evaluate(() => window.__sent);
  expect(sent.quoteMath.map((m) => m.tex)).toEqual(['x_{ij}', '\\sum_{i=1}^n x_{ji}']);
});

broken('invalid LaTeX in the reply itself still blocks sending', async ({ admin }) => {
  await source(admin, '$\\left( y$');
  await send(admin).click();
  await expect(modal(admin).locator('.form-error')).toContainText('公式無法解析');
  expect(await admin.evaluate(() => window.__sent)).toBeUndefined();
});
