// Admin inbox: the inline reply composer, in demo mode (the demo backend keeps replies in memory).
const { test: base, expect } = require('@playwright/test');
const { mockSupabase } = require('../../contact/e2e/support/supabase-mock');
const { isolatePage } = require('../../contact/e2e/support/isolation');
const { PATHS } = require('../../contact/e2e/support/server');

// serves demo.js with a different sendReply, to exercise failure paths
async function patchDemo(page, from, to) {
  await page.route(/\/admin\/js\/demo\.js/, async (route) => {
    const res = await route.fetch();
    const src = await res.text();
    if (!src.includes(from)) throw new Error('demo.js changed; update tests/contact-reply/e2e/reply.spec.js');
    return route.fulfill({ response: res, body: src.replace(from, to), headers: { ...res.headers(), 'content-type': 'text/javascript' } });
  });
}

const test = base.extend({
  admin: async ({ page }, use) => {
    await isolatePage(page);
    await mockSupabase(page);
    await page.goto(PATHS.admin);
    await page.getByRole('button', { name: '留言' }).click();
    await page.locator('.msg').first().waitFor();
    await page.locator('.msg summary').first().click();
    await use(page);
  },
});

const open = async (page) => { await page.getByRole('button', { name: '回信' }).first().click(); return page.locator('.msg-compose textarea'); };

test.describe('admin reply', () => {
  test('composer opens inline, send is disabled until there is text', async ({ admin }) => {
    const area = await open(admin);
    const send = admin.getByRole('button', { name: '寄出' });
    await expect(send).toBeDisabled();
    await area.fill('   \n ');
    await expect(send).toBeDisabled();
    await area.fill('謝謝來信');
    await expect(send).toBeEnabled();
    await expect(admin.locator('.msg-compose')).toContainText('4 / 5000');
  });

  test('cancel closes the composer without sending', async ({ admin }) => {
    const area = await open(admin);
    await area.fill('draft');
    await admin.getByRole('button', { name: '取消' }).click();
    await expect(admin.locator('.msg-compose')).toHaveCount(0);
    await expect(admin.locator('.msg-thread')).toHaveCount(0);
  });

  test('sending shows the reply under the message and marks it replied', async ({ admin }) => {
    const area = await open(admin);
    await area.fill('已修正，謝謝指正');
    await admin.getByRole('button', { name: '寄出' }).click();
    await expect(admin.locator('.msg-reply-text')).toHaveText('已修正，謝謝指正');
    await expect(admin.locator('.msg').first().locator('.pill.replied')).toHaveText('已回覆');
    await expect(admin.locator('.msg-compose')).toHaveCount(0);
    await expect(admin.getByRole('button', { name: '回信' }).first()).toBeVisible();
  });

  test('Ctrl+Enter sends', async ({ admin }) => {
    const area = await open(admin);
    await area.fill('quick one');
    await area.press('Control+Enter');
    await expect(admin.locator('.msg-reply-text')).toHaveText('quick one');
  });

  test('a reply containing HTML is shown as text, never parsed', async ({ admin }) => {
    const evil = '<img src=x onerror="window.__pwned=1"><script>window.__pwned=1</script>';
    const area = await open(admin);
    await area.fill(evil);
    await admin.getByRole('button', { name: '寄出' }).click();
    await expect(admin.locator('.msg-reply-text')).toHaveText(evil);
    await expect(admin.locator('.msg-reply-text img, .msg-reply-text script')).toHaveCount(0);
    expect(await admin.evaluate(() => window.__pwned)).toBeUndefined();
  });

  test('double click sends once', async ({ admin }) => {
    const area = await open(admin);
    await area.fill('only once');
    await admin.getByRole('button', { name: '寄出' }).dblclick();
    await expect(admin.locator('.msg-reply')).toHaveCount(1);
  });

  test('demo mode sends nothing to Supabase', async ({ page }) => {
    await isolatePage(page);
    const supabase = await mockSupabase(page);
    await page.goto(PATHS.admin);
    await page.getByRole('button', { name: '留言' }).click();
    await page.locator('.msg summary').first().click();
    await (await open(page)).fill('hi');
    await page.getByRole('button', { name: '寄出' }).click();
    await expect(page.locator('.msg-reply')).toHaveCount(1);
    expect(supabase.stray).toEqual([]);
  });

  test('a failed send keeps the text and shows the error', async ({ page }) => {
    await isolatePage(page);
    await mockSupabase(page);
    await patchDemo(page, 'sendReply: async (messageId, body) => {', "sendReply: async (messageId, body) => { throw new Error('寄出失敗');");
    await page.goto(PATHS.admin);
    await page.getByRole('button', { name: '留言' }).click();
    await page.locator('.msg summary').first().click();
    const area = await open(page);
    await area.fill('keep me');
    await page.getByRole('button', { name: '寄出' }).click();
    await expect(page.locator('.msg-compose .form-error')).toHaveText('寄出失敗');
    await expect(area).toHaveValue('keep me');
    await expect(page.getByRole('button', { name: '寄出' })).toBeEnabled();
    await expect(page.locator('.msg-reply')).toHaveCount(0);
  });
});

test.describe('live backend request', () => {
  // runs backend.js against a stubbed supabase-js and a mocked function URL
  async function callLive(page, fn, handler) {
    await isolatePage(page);
    await mockSupabase(page);
    await page.route(/\/functions\/v1\/contact-reply/, handler); // after the mock: the last route wins
    await page.goto(PATHS.admin);
    return page.evaluate(async (body) => {
      window.supabase = { createClient: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: 'TOKEN123' } } }) } }) };
      const { createBackend } = await import('/admin/js/backend.js');
      const b = createBackend({ supabaseUrl: 'https://example-project.supabase.co', anonKey: 'ANON' });
      try { return { ok: true, value: await b.sendReply(5, body) }; } catch (e) { return { ok: false, message: e.message }; }
    }, fn);
  }

  test('posts only message_id and body, with the admin token', async ({ page }) => {
    const calls = [];
    const handler = async (route) => {
      const req = route.request();
      calls.push({ url: req.url(), auth: req.headers().authorization, apikey: req.headers().apikey, body: JSON.parse(req.postData()) });
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true,"reply":{"id":1}}' });
    };
    const res = await callLive(page, 'hello', handler);
    expect(res.ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://example-project.supabase.co/functions/v1/contact-reply');
    expect(calls[0].auth).toBe('Bearer TOKEN123');
    expect(calls[0].body).toEqual({ message_id: 5, body: 'hello' });
  });

  test('server errors become a generic message', async ({ page }) => {
    const handler = (route) => route.fulfill({ status: 502, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"error":"re_SECRETKEY leaked"}' });
    const res = await callLive(page, 'hello', handler);
    expect(res.ok).toBe(false);
    expect(res.message).toBe('寄出失敗');
  });
});
