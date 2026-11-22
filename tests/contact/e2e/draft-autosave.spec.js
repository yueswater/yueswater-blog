// Visitor-side draft autosave. Supabase is fully route-mocked (the fixture fails on any stray request).
const { test, expect } = require('./support/fixtures');

const KEY = 'contact-draft-v1';
const stored = (page) => page.evaluate((k) => localStorage.getItem(k), KEY);

test.describe('draft autosave', () => {
  test.beforeEach(async ({ page }) => { await page.clock.install(); });

  test('saves every 10 s, restores on reload, never stores the honeypot', async ({ contact, page }) => {
    await contact.fillValid({ name: '小明', org: '某校' });
    await page.evaluate(() => { document.querySelector('[name="website"]').value = 'spam'; });
    await page.clock.runFor(9_000);
    expect(await stored(page)).toBeNull();
    await page.clock.runFor(1_500);
    const draft = JSON.parse(await stored(page));
    expect(draft).toEqual({ name: '小明', email: 'tester@example.com', org: '某校', topic: 'collab', body: '這是一則測試留言，內容超過十個字。' });
    expect(JSON.stringify(draft)).not.toContain('spam');

    await page.reload();
    await contact.doc.waitFor();
    await expect(contact.input('name')).toHaveValue('小明');
    await expect(contact.input('email')).toHaveValue('tester@example.com');
    await expect(contact.input('org')).toHaveValue('某校');
    await expect(page.locator('.cf-select-value')).toHaveText('合作邀約');
    await expect(contact.source).toHaveValue('這是一則測試留言，內容超過十個字。');
    await expect(contact.doc).toContainText('這是一則測試留言');
    await expect(page.locator('[name="website"]')).toHaveValue('');
  });

  test('a successful send clears the draft', async ({ contact, page, supabase }) => {
    await contact.fillValid();
    await page.clock.runFor(10_500);
    expect(await stored(page)).not.toBeNull();
    await contact.submit();
    await expect.poll(() => supabase.submits.length).toBe(1);
    await expect(contact.input('name')).toHaveValue('');
    expect(await stored(page)).toBeNull();
    await page.clock.runFor(20_000);
    expect(await stored(page)).toBeNull();
  });

  test('a failed send keeps the draft', async ({ contact, page, supabase }) => {
    supabase.respond('limited');
    await contact.fillValid();
    await contact.submit();
    await expect.poll(() => supabase.submits.length).toBe(1);
    await page.clock.runFor(10_500);
    expect(await stored(page)).not.toBeNull();
  });

  test('blocked storage does not break the form', async ({ page, supabase }) => {
    void supabase;
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/contact/');
    await page.locator('.ce-doc').waitFor();
    await page.locator('#cf-name').fill('A');
    await page.clock.runFor(10_500);
    await expect(page.locator('#cf-name')).toHaveValue('A');
    expect(errors).toEqual([]);
  });
});
