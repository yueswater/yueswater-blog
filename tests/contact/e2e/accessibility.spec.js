// Labels, descriptions and a keyboard-only path through the form.
const { test, expect } = require('./support/fixtures');

test.describe('accessibility', () => {
  test('inputs have labels and error descriptions', async ({ contact }) => {
    await expect(contact.page.getByLabel('姓名')).toHaveAttribute('aria-describedby', 'cf-name-err');
    await expect(contact.page.getByLabel('Email')).toHaveAttribute('aria-describedby', 'cf-email-err');
    for (const id of ['name', 'email', 'topic', 'body']) await expect(contact.error(id)).toHaveAttribute('aria-live', 'polite');
  });

  test('editor is a labelled multi-line textbox described by hint and count', async ({ contact }) => {
    await expect(contact.doc).toHaveAttribute('role', 'textbox');
    await expect(contact.doc).toHaveAttribute('aria-multiline', 'true');
    await expect(contact.doc).toHaveAttribute('aria-labelledby', 'cf-body-label');
    await expect(contact.doc).toHaveAttribute('aria-describedby', 'cf-body-err cf-body-count cf-body-hint');
  });

  test('toolbar buttons have names', async ({ contact }) => {
    for (const [action, name] of [['bold', '粗體'], ['bullet', '項目清單'], ['ordered', '編號清單'], ['math', '行內數學式'], ['image', '插入圖片']]) {
      await expect(contact.tool(action)).toHaveAttribute('aria-label', name);
    }
  });

  test('toast is a polite status region', async ({ contact }) => {
    await expect(contact.toastEl).toHaveAttribute('role', 'status');
    await expect(contact.toastEl).toHaveAttribute('aria-live', 'polite');
  });

  test('honeypot is out of reach', async ({ contact }) => {
    await expect(contact.page.locator('.cf-trap')).toHaveAttribute('aria-hidden', 'true');
    await expect(contact.page.locator('input[name=website]')).toHaveAttribute('tabindex', '-1');
  });

  test('keyboard only: fill and send', async ({ contact, supabase }) => {
    const kb = contact.page.keyboard;
    await contact.input('name').focus();
    await kb.type('鍵盤');
    await kb.press('Tab'); await kb.type('k@b.co');
    await kb.press('Tab'); await kb.press('Tab');
    await expect(contact.topicTrigger).toBeFocused();
    await kb.press('Enter'); await kb.press('Enter');
    await contact.doc.focus();
    await kb.type('只用鍵盤送出這則留言。');
    await contact.submitButton.focus();
    await kb.press('Enter');
    await expect(contact.page.locator('[data-preview-ok]')).toBeFocused();
    await kb.press('Enter');
    await expect.poll(() => supabase.submits.length).toBe(1);
  });
});
