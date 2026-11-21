// Admin-side privacy and mail safety: the reply link, where the sender IP appears, sign-out and the
// demo backend's isolation, and a very long message.
const { test, expect } = require('./support/fixtures');
const { message, openInbox, expand } = require('./support/admin');
const { MAILTO_INJECTION } = require('./support/payloads');

// fields a mail client would act on, from a mailto: href
function mailtoFields(href) {
  const url = new URL(href);
  return { to: decodeURIComponent(url.pathname), params: [...url.searchParams.keys()].sort() };
}

test.describe('admin privacy', () => {
  test('TC-SEC-ADM-001 the sender IP is shown in the admin only', async ({ page, contact, net }) => {
    void net;
    // visitor side: no IP anywhere on the contact page or in its preview
    await contact.fillValid();
    await contact.requestSend();
    await expect(page.locator('body')).not.toContainText(/IP \d+\.\d+\.\d+\.\d+/);
    // admin side: the detail line names it
    const admin = await page.context().newPage();
    await openInbox(admin, [message({ ip: '198.51.100.23' })]);
    await expand(admin);
    await expect(admin.locator('.msg-body .muted.small')).toContainText('IP 198.51.100.23');
  });

  test('TC-SEC-ADM-003 reply link cannot be given extra recipients or a body', async ({ page, net }) => {
    void net;
    await openInbox(page, [message({ email: MAILTO_INJECTION })]);
    await expand(page);
    // a malformed address gets no reply link at all; a link, if shown, may carry only the subject
    const link = page.getByRole('link', { name: '回信' });
    if (await link.count() === 0) return;
    const href = await link.getAttribute('href');
    const { params } = mailtoFields(href);
    expect(params, `reply href: ${href}`).toEqual(['subject']);
  });

  test('TC-SEC-ADM-005 after signing out the inbox is gone', async ({ page, net }) => {
    void net;
    await openInbox(page, [message({ body: 'secret message body' })]);
    await page.getByRole('button', { name: '登出' }).click();
    await expect(page.locator('.messages')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('secret message body');
  });

  test('TC-SEC-ADM-006 demo mode sends nothing to Supabase', async ({ page, net }) => {
    void net;
    const supabase = await openInbox(page, [message()]);
    await expand(page);
    await page.getByRole('button', { name: '標為未讀' }).click();
    expect(supabase.stray).toEqual([]);
    expect(supabase.submits).toEqual([]);
  });

  test('TC-SEC-ADM-007 a 2000-character message keeps the inbox usable', async ({ page, net }) => {
    void net;
    const rows = [message({ body: 'x '.repeat(1000) }), ...Array.from({ length: 30 }, (_, i) => message({ name: `V${i}` }))];
    await openInbox(page, rows);
    await expect(page.locator('.msg')).toHaveCount(31);
    // bodies render on expand; before that only the 60-character preview exists
    await expect(page.locator('.msg').first().locator('.msg-preview')).toHaveText(/^.{1,60}$/);
    await expand(page, 0);
    await page.mouse.wheel(0, 4000);
    await expect(page.locator('.msg').last()).toBeVisible();
  });
});
