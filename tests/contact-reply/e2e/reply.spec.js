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

const modal = (page) => page.locator('.rc-modal');
const sendBtn = (page) => modal(page).getByRole('button', { name: '寄出' });
const open = async (page) => { await page.getByRole('button', { name: '回信' }).first().click(); await modal(page).waitFor(); return modal(page).locator('.ce-doc'); };
const write = async (page, text) => { const doc = await open(page); await doc.click(); await page.keyboard.type(text); };
const KEY = 'reply-draft-2';
const stored = (page) => page.evaluate((k) => localStorage.getItem(k), KEY);

test.describe('admin reply modal', () => {
  test('opens as a modal dialog, send is disabled until there is text', async ({ admin }) => {
    await open(admin);
    await expect(admin.getByRole('dialog')).toBeVisible();
    await expect(admin.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    await expect(sendBtn(admin)).toBeDisabled();
    await admin.keyboard.type('   ');
    await expect(sendBtn(admin)).toBeDisabled();
    await admin.keyboard.type('謝謝來信');
    await expect(sendBtn(admin)).toBeEnabled();
    await expect(modal(admin)).toContainText('/ 5000');
  });

  test('toolbar offers bold, italic, link, code, code block and image', async ({ admin }) => {
    await open(admin);
    for (const a of ['bold', 'italic', 'link', 'code', 'block', 'image']) await expect(modal(admin).locator(`.cf-tool[data-action="${a}"]`)).toHaveCount(1);
  });

  test('Escape and cancel close it without sending', async ({ admin }) => {
    await write(admin, 'draft');
    await admin.keyboard.press('Escape');
    await expect(modal(admin)).toHaveCount(0);
    await admin.getByRole('button', { name: '回信' }).first().click();
    await modal(admin).getByRole('button', { name: '取消' }).click();
    await expect(modal(admin)).toHaveCount(0);
    await expect(admin.locator('.msg-thread')).toHaveCount(0);
  });

  test('sending shows the reply under the message, marks it replied, and shows a light toast', async ({ admin }) => {
    await write(admin, '已修正，謝謝指正');
    await sendBtn(admin).click();
    await expect(admin.locator('.msg-reply-text')).toContainText('已修正，謝謝指正');
    await expect(admin.locator('.msg').first().locator('.pill.replied')).toHaveText('已回覆');
    await expect(modal(admin)).toHaveCount(0);
    const toast = admin.locator('.toast.ok');
    await expect(toast).toHaveText('已寄出回覆');
    const [bg, fg] = await toast.evaluate((n) => { const c = getComputedStyle(n); return [c.backgroundColor, c.color]; });
    const lum = (rgb) => { const [r, g, b] = rgb.match(/\d+/g).map(Number); return (r * 299 + g * 587 + b * 114) / 1000; };
    expect(lum(bg)).toBeGreaterThan(200);
    expect(lum(fg)).toBeLessThan(100);
  });

  test('Markdown typed in the source tab is shown formatted', async ({ admin }) => {
    await open(admin);
    await modal(admin).locator('.cf-tab[data-tab="source"]').click();
    await modal(admin).locator('textarea').fill('**粗體**與*斜體*');
    await sendBtn(admin).click();
    await expect(admin.locator('.msg-reply-text strong')).toHaveText('粗體');
    await expect(admin.locator('.msg-reply-text em')).toHaveText('斜體');
  });

  test('Ctrl+Enter sends', async ({ admin }) => {
    await write(admin, 'quick one');
    await admin.keyboard.press('Control+Enter');
    await expect(admin.locator('.msg-reply-text')).toContainText('quick one');
  });

  test('a reply containing HTML is never parsed into elements', async ({ admin }) => {
    const evil = '<img src=x onerror="window.__pwned=1"><script>window.__pwned=1</script>';
    await open(admin);
    await modal(admin).locator('.cf-tab[data-tab="source"]').click();
    await modal(admin).locator('textarea').fill(evil);
    await sendBtn(admin).click();
    await expect(admin.locator('.msg-reply')).toHaveCount(1);
    await expect(admin.locator('.msg-reply-text img, .msg-reply-text script')).toHaveCount(0);
    expect(await admin.evaluate(() => window.__pwned)).toBeUndefined();
  });

  test('double click sends once', async ({ admin }) => {
    await write(admin, 'only once');
    await sendBtn(admin).dblclick();
    await expect(admin.locator('.msg-reply')).toHaveCount(1);
  });

  test('demo mode sends nothing to Supabase', async ({ page }) => {
    await isolatePage(page);
    const supabase = await mockSupabase(page);
    await page.goto(PATHS.admin);
    await page.getByRole('button', { name: '留言' }).click();
    await page.locator('.msg summary').first().click();
    await write(page, 'hi');
    await sendBtn(page).click();
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
    await write(page, 'keep me');
    await sendBtn(page).click();
    await expect(modal(page).locator('.form-error')).toHaveText('寄出失敗');
    await expect(modal(page).locator('textarea')).toHaveValue('keep me');
    await expect(sendBtn(page)).toBeEnabled();
    await expect(page.locator('.msg-reply')).toHaveCount(0);
  });
});

test.describe('admin reply draft autosave', () => {
  async function adminWithClock(page) {
    await page.clock.install();
    await isolatePage(page);
    await mockSupabase(page);
    await page.goto(PATHS.admin);
    await page.getByRole('button', { name: '留言' }).click();
    await page.locator('.msg').first().waitFor();
    await page.locator('.msg summary').first().click();
  }

  test('saves every 10 s with a saved mark, restores on reopen, clears after sending', async ({ page }) => {
    await adminWithClock(page);
    await write(page, '草稿內容');
    await page.clock.runFor(9_000);
    expect(await stored(page)).toBeNull();
    await page.clock.runFor(1_500);
    expect(JSON.parse(await stored(page)).body).toContain('草稿內容');
    await expect(modal(page).locator('.rc-status')).toContainText('已自動儲存');

    await page.keyboard.press('Escape');
    await expect(modal(page)).toHaveCount(0);
    await open(page);
    await expect(modal(page).locator('.ce-doc')).toContainText('草稿內容');
    await expect(modal(page).locator('.rc-status')).toHaveText('已還原草稿');

    await sendBtn(page).click();
    await page.clock.runFor(1_000);
    await expect(page.locator('.msg-reply')).toHaveCount(1);
    expect(await stored(page)).toBeNull();
    await page.clock.runFor(20_000);
    expect(await stored(page)).toBeNull();
  });

  test('drafts are kept per message', async ({ page }) => {
    await adminWithClock(page);
    await write(page, '給第一則');
    await page.clock.runFor(10_500);
    expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('reply-draft-')))).toEqual(['reply-draft-2']);
  });

  test('blocked storage does not break the dialog', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.clock.install();
    await isolatePage(page);
    await mockSupabase(page);
    await page.goto(PATHS.admin);
    await page.getByRole('button', { name: '留言' }).click();
    await page.locator('.msg summary').first().click();
    await write(page, 'x');
    await page.clock.runFor(10_500);
    await expect(sendBtn(page)).toBeEnabled();
    expect(errors).toEqual([]);
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
