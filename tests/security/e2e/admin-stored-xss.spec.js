// Stored XSS in the admin inbox: hostile messages, as an attacker could store them through the
// public RPC, rendered by the real admin code. Nothing may execute, and nothing may restyle the page.
const { test, expect } = require('./support/fixtures');
const { message, openInbox, expand } = require('./support/admin');
const { BODY, KATEX_BOMBS, FIELDS, IMG } = require('./support/payloads');
const { verdict, SAFE } = require('./support/xss-detector');

test.describe('admin stored XSS', () => {
  for (const { id, field } of FIELDS) {
    test(`TC-SEC-${id} ${field} field with HTML is shown as text`, async ({ page, net }) => {
      void net;
      const supabase = await openInbox(page, [message({ [field]: IMG })]);
      await expand(page);
      expect(await verdict(page, '.messages')).toEqual(SAFE);
      await expect(page.locator('.messages img:not(.ce-img)')).toHaveCount(0);
      await expect(page.locator('.messages')).toContainText('onerror=alert(document.domain)');
      expect(supabase.stray).toEqual([]);
    });
  }

  for (const { id, title, md } of BODY) {
    test(`TC-SEC-${id} body: ${title} stays inert`, async ({ page, net }) => {
      void net;
      await openInbox(page, [message({ body: md })]);
      await expand(page);
      expect(await verdict(page, '.msg-text')).toEqual(SAFE);
      // only http(s) links may survive; an emptied href (the scheme was stripped) only reloads the page
      const hrefs = await page.locator('.msg-text a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
      expect(hrefs.filter((h) => h.trim() !== '' && !/^https?:\/\//i.test(h))).toEqual([]);
    });
  }

  for (const { id, title, md } of KATEX_BOMBS) {
    test(`TC-SEC-${id} body: ${title} fails fast without freezing`, async ({ page, net }) => {
      void net;
      await openInbox(page, [message({ body: md }), message({ name: 'Next', body: 'still usable afterwards' })]);
      const started = Date.now();
      await expand(page, 0);
      expect(Date.now() - started).toBeLessThan(5000);
      // the page still answers: the next message opens normally
      await expand(page, 1);
      await expect(page.locator('.msg').nth(1)).toContainText('still usable afterwards');
    });
  }

  test('TC-SEC-XSS-027 list preview line creates no elements', async ({ page, net }) => {
    void net;
    await openInbox(page, [message({ body: `${IMG} ![a](x.png) [b](https://a.example)` })]);
    const preview = page.locator('.msg-preview').first();
    await expect(preview.locator('*')).toHaveCount(0);
    await expect(preview).toContainText('<img src=x onerror=');
    expect(await verdict(page, '.msg summary')).toEqual(SAFE);
  });
});
