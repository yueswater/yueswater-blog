// Math in admin replies: toolbar buttons, KaTeX preview, Markdown round trip, the too-wide warning, the limits and the
// request the browser sends (demo backend or a stubbed supabase-js; Resend and every other host must never be called).
const { test: base, expect } = require('@playwright/test');
const { mockSupabase } = require('../../contact/e2e/support/supabase-mock');
const { isolatePage } = require('../../contact/e2e/support/isolation');
const { PATHS, BASE_URL } = require('../../contact/e2e/support/server');

const UUID_PNG = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/;
// serves demo.js with recorders: what sendReply gets, and what each uploaded PNG looks like once decoded
async function recordDemo(page) {
  await page.route(/\/admin\/js\/demo\.js/, async (route) => {
    const res = await route.fetch();
    let src = (await res.text())
      .replace('sendReply: async (messageId, body) => {', 'sendReply: async (messageId, body, math) => { window.__sent = { messageId, body, math };')
      .replace('uploadImage: async () => {},', `uploadImage: async (name, blob) => {
        const bmp = await createImageBitmap(blob); const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
        const g = c.getContext('2d'); g.drawImage(bmp, 0, 0); const px = g.getImageData(0, 0, c.width, c.height).data; let dark = 0;
        for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 200 && px[i] < 90) dark++;
        (window.__png ||= []).push({ name, type: blob.type, w: bmp.width, h: bmp.height, corner: px[3], dark });
      },`);
    // the demo message quotes formulas too; they are covered in quote-math.spec.js, so here the quote is made formula-free
    src = src.replace('$x_{ij}$', 'x_{ij}').replace('$x_{ji}$', 'x_{ji}').replace('\\n\\n$$\\n\\\\sum_{i=1}^n x_{ji}\\n$$', '');
    if (!src.includes('window.__sent') || !src.includes('window.__png')) throw new Error('demo.js changed; update tests/contact-reply/e2e/math.spec.js');
    return route.fulfill({ response: res, body: src, headers: { ...res.headers(), 'content-type': 'text/javascript' } });
  });
}

const test = base.extend({
  admin: async ({ page }, use) => {
    const outside = [];
    page.on('request', (r) => { const u = new URL(r.url()); if (!/^(localhost|127\.0\.0\.1)$/.test(u.hostname) && u.protocol.startsWith('http')) outside.push(r.url()); });
    await isolatePage(page);
    page.supabase = await mockSupabase(page);
    await recordDemo(page);
    await page.goto(PATHS.admin);
    await page.getByRole('button', { name: '留言' }).click();
    await page.locator('.msg summary').first().click();
    await page.getByRole('button', { name: '回信' }).first().click();
    await page.locator('.rc-modal').waitFor();
    outside.length = 0; // what the page loads on start-up is not under test; what happens from here is
    await use(page);
    expect(outside.filter((u) => !u.startsWith(BASE_URL)), 'requests to other hosts').toEqual([]);
    expect(page.supabase.stray, 'unmocked supabase requests').toEqual([]);
  },
});
const modal = (p) => p.locator('.rc-modal');
const tool = (p, a) => modal(p).locator(`.cf-tool[data-action="${a}"]`);
const source = async (p, md) => { await modal(p).locator('[data-tab="source"]').click(); await modal(p).locator('textarea').fill(md); };
const send = (p) => modal(p).getByRole('button', { name: '寄出' });
const wide = `$$\n${Array.from({ length: 40 }, (_, i) => `x_{${i}}`).join('+')}\n$$`;

test('toolbar has inline and display math buttons with labels', async ({ admin }) => {
  await expect(tool(admin, 'math')).toHaveAttribute('aria-label', '行內公式');
  await expect(tool(admin, 'mathBlock')).toHaveAttribute('aria-label', '公式區塊');
});

test('the dialog previews a formula with KaTeX and round-trips $ and $$ through the Markdown tab', async ({ admin }) => {
  await modal(admin).locator('.ce-doc').click();
  await tool(admin, 'math').click();
  await modal(admin).locator('.ce-field').fill('x^2');
  await expect(modal(admin).locator('.ce-pop-preview .katex')).toBeVisible();
  await modal(admin).locator('.ce-btn.is-primary').click();
  await tool(admin, 'mathBlock').click();
  await modal(admin).locator('.ce-field').fill('\\sum_i a_i');
  await expect(modal(admin).locator('.ce-pop-preview .katex-display')).toBeVisible();
  await modal(admin).locator('.ce-btn.is-primary').click();
  await modal(admin).locator('[data-tab="source"]').click();
  const md = await modal(admin).locator('textarea').inputValue();
  expect(md).toContain('$x^2$');
  expect(md).toMatch(/\$\$\n\\sum_i a_i\n\$\$/);
  await modal(admin).locator('[data-tab="rich"]').click();
  await expect(modal(admin).locator('.ce-doc .katex')).toHaveCount(2);
  await source(admin, 'a $b_1$ c\n\n$$\nd\n$$');
  await modal(admin).locator('[data-tab="rich"]').click();
  await expect(modal(admin).locator('.ce-doc .katex')).toHaveCount(2);
});

test('an over-wide formula shows a warning suggesting a split; a narrow one does not', async ({ admin }) => {
  const warn = modal(admin).locator('.form-warn');
  await source(admin, '$$\nx^2\n$$');
  await admin.waitForTimeout(900);
  await expect(warn).toBeHidden();
  await modal(admin).locator('textarea').fill(wide);
  await expect(warn).toBeVisible();
  await expect(warn).toContainText('560 px');
  await expect(warn).toContainText('拆成多行');
  await modal(admin).locator('textarea').fill('$$\nx^2\n$$');
  await expect(warn).toBeHidden();
});

test('too many formulas: warning, and sending is refused client side', async ({ admin }) => {
  await source(admin, Array.from({ length: 21 }, (_, i) => `$a_${i}$`).join(' '));
  await expect(modal(admin).locator('.form-warn')).toContainText('最多 20 個');
  await send(admin).click();
  await expect(modal(admin).locator('.form-error')).toHaveText('一封回信最多 20 個公式');
  expect(await admin.evaluate(() => window.__sent)).toBeUndefined();
  await modal(admin).locator('textarea').fill(`$${'x'.repeat(1001)}$`);
  await send(admin).click();
  await expect(modal(admin).locator('.form-error')).toHaveText('單一公式最長 1000 個字元');
});

test('sending draws every formula to a transparent PNG at 4x, uploads it, and sends the list', async ({ admin }) => {
  await source(admin, `so $x^2$ and $x^2$ again\n\n$$\n\\sum_{i=1}^n a_i\n$$\n\n${wide}`);
  await send(admin).click();
  await expect(admin.locator('.msg-reply')).toHaveCount(1);
  const sent = await admin.evaluate(() => window.__sent);
  const png = await admin.evaluate(() => window.__png);
  expect(sent.math).toHaveLength(3); // the repeated formula is drawn once
  const [inline, display, big] = sent.math;
  expect([inline.display, display.display, big.display]).toEqual([false, true, true]);
  expect(sent.math.map((m) => m.path)).toEqual(png.map((p) => p.name));
  for (const m of sent.math) expect(m.path).toMatch(UUID_PNG);
  expect(inline.w).toBeGreaterThan(5);
  expect(inline.w).toBeLessThan(60);
  expect(Number.isFinite(inline.d)).toBe(true);
  expect(display.w).toBe(560);
  expect(big.w).toBe(560);
  expect(png.every((p) => p.type === 'image/png' && p.corner === 0 && p.dark > 20)).toBe(true); // transparent corner, dark text
  expect(Math.abs(png[0].w - inline.w * 4)).toBeLessThan(6);
  expect(png[1].w).toBe(2240);
  expect(Math.abs(png[1].h - display.h * 4)).toBeLessThan(6);
  expect(big.h).toBeLessThan(40); // scaled down proportionally, not cropped: still one short line
});

test('plain replies are sent exactly as before, with no math field and no PNG', async ({ admin }) => {
  await source(admin, 'price is $5 and $6');
  await send(admin).click();
  await expect(admin.locator('.msg-reply')).toHaveCount(1);
  expect(await admin.evaluate(() => window.__sent.math)).toBeUndefined();
  expect(await admin.evaluate(() => window.__png)).toBeUndefined();
});

test('live backend: PNG goes to the private bucket, the function gets { message_id, body, math }', async ({ page }) => {
  await isolatePage(page);
  const supabase = await mockSupabase(page);
  const calls = [];
  await page.route(/\/functions\/v1\/contact-reply/, (route) => {
    calls.push(JSON.parse(route.request().postData()));
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true,"reply":{"id":1}}' });
  });
  await page.goto(PATHS.admin);
  const uploads = await page.evaluate(async () => {
    const rec = [];
    window.supabase = { createClient: () => ({
      auth: { getSession: async () => ({ data: { session: { access_token: 'T' } } }) },
      storage: { from: (bucket) => ({ upload: async (name, blob, o) => { rec.push([bucket, name, blob.type, o.contentType, o.upsert]); return { error: null }; } }) },
    }) };
    const { createBackend } = await import('/admin/js/backend.js');
    const b = createBackend({ supabaseUrl: 'https://example-project.supabase.co', anonKey: 'ANON' });
    await b.uploadImage('11111111-2222-3333-4444-555555555555.png', new Blob(['x'], { type: 'image/png' }));
    await b.sendReply(5, 'a $x$', [{ display: false, tex: 'x', path: '11111111-2222-3333-4444-555555555555.png', w: 9, h: 14, d: 0 }]);
    return rec;
  });
  expect(uploads).toEqual([['contact-images', '11111111-2222-3333-4444-555555555555.png', 'image/png', 'image/png', false]]);
  expect(calls).toEqual([{ message_id: 5, body: 'a $x$', math: [{ display: false, tex: 'x', path: '11111111-2222-3333-4444-555555555555.png', w: 9, h: 14, d: 0 }] }]);
  expect(supabase.stray).toEqual([]);
});
