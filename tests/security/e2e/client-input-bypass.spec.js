// Tricky text on the visitor side: what the browser lets through, and how the admin shows it.
// The server repeats every check (see tests/security/db); these cover the client's half.
const { test, expect } = require('./support/fixtures');
const { message, openInbox, expand } = require('./support/admin');
const { MAILTO_INJECTION } = require('./support/payloads');

const BIDI = /[‪-‮⁦-⁩‎‏]/;

test.describe('client input bypass', () => {
  test('TC-SEC-API-017 (client) a name of only zero-width spaces counts as empty', async ({ contact }) => {
    await contact.fillValid({ name: '​​' });
    await contact.requestSend();
    await expect(contact.error('name'), 'zero-width-only name passed the required check').toHaveText('這個欄位必填');
  });

  test('TC-SEC-API-014 (client) an email carrying mailto parameters is rejected', async ({ contact }) => {
    await contact.fillValid({ email: MAILTO_INJECTION });
    await contact.requestSend();
    await expect(contact.error('email'), 'email with ?cc=&bcc=&body= passed the format check').toHaveText('Email 格式不太對');
  });

  test('TC-SEC-API-016 (admin) right-to-left override characters are neutralised in the inbox', async ({ page, net }) => {
    void net;
    await openInbox(page, [message({ name: 'admin‮gnp.exe' })]);
    const shown = await page.locator('.msg summary strong').first().textContent();
    expect(shown, 'bidi control character shown as-is (filename spoofing)').not.toMatch(BIDI);
  });

  test('TC-SEC-CFG-007 (client) a server error shows only the generic failure toast', async ({ contact, supabase }) => {
    supabase.respond({ code: '22021', message: 'invalid byte sequence for encoding "UTF8": 0x00', details: 'at public.submit_contact line 42' }, 400);
    await contact.fillValid({ body: 'abc\u0000defghij and more' });
    await contact.submit();
    const text = await contact.toast();
    expect(text).toBe('送出失敗，請稍後再試，或直接寄 Email 給我。');
    expect(text).not.toMatch(/UTF8|submit_contact|line \d+/);
  });

  test('TC-SEC-API-006 (client) name, organisation and body inputs cap their length', async ({ contact }) => {
    await contact.input('name').fill('A'.repeat(81));
    await contact.input('org').fill('B'.repeat(121));
    await expect(contact.input('name')).toHaveValue('A'.repeat(80));
    await expect(contact.input('org')).toHaveValue('B'.repeat(120));
    // the message has no maxlength (it would cut pasted emoji by UTF-16 units); the 2000-character
    // limit is enforced by validation, so an over-long paste is kept whole and counted
    await contact.tab('source').click();
    await contact.source.fill('C'.repeat(2001));
    await expect(contact.source).toHaveValue('C'.repeat(2001));
    await expect(contact.page.locator('[data-count]')).toHaveText('2001');
  });

  test('TC-SEC-API-018 (admin) a homoglyph email is shown exactly as stored', async ({ page, net }) => {
    void net;
    const email = 'раypal@example.com'; // Cyrillic r and a
    await openInbox(page, [message({ email })]);
    await expand(page);
    // no normalisation hides the lookalike: the admin sees the real code points
    await expect(page.locator('.msg-body .muted.small')).toContainText(email);
  });
});
