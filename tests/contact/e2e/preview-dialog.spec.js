// Preview before sending: what it shows, and that only "confirm" sends.
const { test, expect } = require('./support/fixtures');

test.describe('preview dialog', () => {
  test('opens after validation with the filled-in values', async ({ contact, supabase }) => {
    await contact.fillValid({ org: '某大學' });
    await contact.requestSend();
    const d = contact.preview;
    await expect(d).toBeVisible();
    await expect(d.locator('#cf-preview-title')).toHaveText('確認留言內容');
    await expect(d.locator('[data-preview="name"]')).toHaveText('測試者');
    await expect(d.locator('[data-preview="email"]')).toHaveText('tester@example.com');
    await expect(d.locator('[data-preview="org"]')).toHaveText('某大學');
    await expect(d.locator('[data-preview="topic"]')).toHaveText('合作邀約');
    await expect(d.locator('[data-preview-ok]')).toBeFocused();
    expect(supabase.submits).toHaveLength(0);
  });

  test('empty organization reads 未填寫', async ({ contact }) => {
    await contact.fillValid();
    await contact.requestSend();
    const org = contact.preview.locator('[data-preview="org"]');
    await expect(org).toHaveText('未填寫');
    await expect(org).toHaveClass(/is-empty/);
  });

  test('message is rendered read-only with formatting', async ({ contact }) => {
    await contact.fillContact();
    await contact.pickTopic('post');
    await contact.setMarkdown('**粗體** 與 $x^2$，超過十個字。');
    await contact.requestSend();
    const body = contact.preview.locator('[data-preview-body]');
    await expect(body.locator('strong')).toHaveText('粗體');
    await expect(body.locator('.katex')).toBeVisible();
    await expect(body.locator('[contenteditable="false"]').first()).toBeVisible();
  });

  test('invalid form never opens the preview', async ({ contact }) => {
    await contact.requestSend();
    await expect(contact.preview).toBeHidden();
  });

  test('返回修改 closes without sending and keeps the form', async ({ contact, supabase }) => {
    await contact.fillValid();
    await contact.requestSend();
    await contact.page.locator('[data-preview-edit]').click();
    await expect(contact.preview).toBeHidden();
    expect(supabase.submits).toHaveLength(0);
    await expect(contact.input('name')).toHaveValue('測試者');
  });

  test('Escape closes without sending', async ({ contact, supabase }) => {
    await contact.fillValid();
    await contact.requestSend();
    await contact.page.keyboard.press('Escape');
    await expect(contact.preview).toBeHidden();
    expect(supabase.submits).toHaveLength(0);
  });

  test('backdrop click closes without sending', async ({ contact, supabase }) => {
    await contact.fillValid();
    await contact.requestSend();
    await contact.page.mouse.click(5, 5);
    await expect(contact.preview).toBeHidden();
    expect(supabase.submits).toHaveLength(0);
  });

  test('確認送出 sends once', async ({ contact, supabase }) => {
    await contact.fillValid();
    await contact.requestSend();
    await contact.page.locator('[data-preview-ok]').click();
    await expect.poll(() => supabase.submits.length).toBe(1);
    await expect(contact.preview).toBeHidden();
  });

  test('can send again after editing', async ({ contact, supabase }) => {
    await contact.fillValid();
    await contact.requestSend();
    await contact.page.locator('[data-preview-edit]').click();
    await contact.input('name').fill('改過');
    await contact.submit();
    await expect.poll(() => supabase.submits.length).toBe(1);
    expect(supabase.submits[0].p_name).toBe('改過');
  });
});
