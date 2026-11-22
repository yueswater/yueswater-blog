// Sending: the request payload, the busy button, success reset and each server answer.
const { test, expect } = require('./support/fixtures');

test.describe('submit', () => {
  test('valid form posts every field to submit_contact', async ({ contact, supabase }) => {
    await contact.fillValid({ org: '某大學' });
    await contact.submit();
    await expect.poll(() => supabase.submits.length).toBe(1);
    expect(supabase.submits[0]).toEqual({
      p_name: '測試者', p_email: 'tester@example.com', p_org: '某大學', p_topic: 'collab',
      p_body: '這是一則測試留言，內容超過十個字。', p_lang: 'zh-TW', p_path: '/contact/', p_trap: '',
    });
  });

  test('empty organization is sent as an empty string', async ({ contact, supabase }) => {
    await contact.fillValid();
    await contact.submit();
    await expect.poll(() => supabase.submits.length).toBe(1);
    expect(supabase.submits[0].p_org).toBe('');
  });

  test('success: toast, form and editor reset', async ({ contact }) => {
    await contact.fillValid({ org: 'X' });
    await contact.submit();
    expect(await contact.toast()).toBe('已收到，謝謝你的留言。');
    await expect(contact.input('name')).toHaveValue('');
    await expect(contact.input('org')).toHaveValue('');
    await expect(contact.page.locator('.cf-select-value')).toHaveText('選擇主旨');
    await expect(contact.doc.locator('p.is-editor-empty')).toHaveCount(1);
    await expect(contact.counter).toHaveText('0');
    for (const name of ['name', 'email', 'topic', 'body']) await expect(contact.error(name)).toHaveText('');
    await expect(contact.page.locator('.is-invalid')).toHaveCount(0);
  });

  test('button is disabled and busy while sending', async ({ contact, page }) => {
    let release;
    await page.route(/\/rpc\/submit_contact/, async (route) => { await new Promise((r) => { release = r; }); await route.fulfill({ status: 200, contentType: 'application/json', body: '"ok"' }); });
    await contact.fillValid();
    await contact.submit();
    await expect(contact.submitButton).toBeDisabled();
    await expect(contact.submitButton).toHaveAttribute('aria-busy', 'true');
    release();
    await expect(contact.submitButton).toBeEnabled();
  });

  const answers = [
    ['limited', '留言太頻繁了，請稍後再試。'],
    ['invalid', '有欄位格式不符，請檢查後再送出。'],
    ['weird', '送出失敗，請稍後再試，或直接寄 Email 給我。'],
  ];
  for (const [body, text] of answers) {
    test(`server answer "${body}" keeps the form and explains`, async ({ contact, supabase }) => {
      supabase.respond(body);
      await contact.fillValid();
      await contact.submit();
      expect(await contact.toast()).toBe(text);
      await expect(contact.input('name')).toHaveValue('測試者');
    });
  }

  test('HTTP error shows the failure toast', async ({ contact, supabase }) => {
    supabase.respond({ message: 'boom' }, 500);
    await contact.fillValid();
    await contact.submit();
    expect(await contact.toast()).toBe('送出失敗，請稍後再試，或直接寄 Email 給我。');
  });

  test('network failure shows the failure toast and re-enables the button', async ({ contact, supabase }) => {
    supabase.failNetwork();
    await contact.fillValid();
    await contact.submit();
    expect(await contact.toast()).toBe('送出失敗，請稍後再試，或直接寄 Email 給我。');
    await expect(contact.submitButton).toBeEnabled();
  });

  test('honeypot value is passed through as p_trap', async ({ contact, supabase }) => {
    await contact.fillValid();
    await contact.page.locator('input[name=website]').fill('http://spam.example', { force: true });
    await contact.submit();
    await expect.poll(() => supabase.submits.length).toBe(1);
    expect(supabase.submits[0].p_trap).toBe('http://spam.example');
  });

  test('message body is sent as Markdown', async ({ contact, supabase }) => {
    await contact.fillContact();
    await contact.pickTopic('post');
    await contact.setMarkdown('**粗體** 與 `code`，超過十個字。');
    await contact.submit();
    await expect.poll(() => supabase.submits.length).toBe(1);
    expect(supabase.submits[0].p_body).toBe('**粗體** 與 `code`，超過十個字。');
  });
});

test.describe('submit (English)', () => {
  test.use({ lang: 'en' });
  test('English page sends p_lang en and its own path', async ({ contact, supabase }) => {
    await contact.fillValid();
    await contact.submit();
    await expect.poll(() => supabase.submits.length).toBe(1);
    expect(supabase.submits[0].p_lang).toBe('en');
    expect(supabase.submits[0].p_path).toBe('/contact-en/');
    expect(await contact.toast()).toBe('Got it. Thanks for your message.');
  });
});
