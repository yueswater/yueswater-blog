// Email field keeps only half-width ASCII letters, digits and . _ % + - @ (typed or pasted).
const { test, expect } = require('./support/fixtures');

test.describe('email filter', () => {
  test('attributes for mobile keyboards', async ({ contact }) => {
    const email = contact.input('email');
    await expect(email).toHaveAttribute('inputmode', 'email');
    await expect(email).toHaveAttribute('autocapitalize', 'off');
    await expect(email).toHaveAttribute('autocomplete', 'email');
    await expect(email).toHaveAttribute('spellcheck', 'false');
  });

  test('a normal address is untouched', async ({ contact }) => {
    await contact.input('email').pressSequentially('first.last+tag_1%x-y@example.co');
    await expect(contact.input('email')).toHaveValue('first.last+tag_1%x-y@example.co');
  });

  test('full-width letters, Chinese, spaces and emoji vanish while typing', async ({ contact }) => {
    await contact.input('email').pressSequentially('ａbc 你好😀@ｅxample．com d');
    await expect(contact.input('email')).toHaveValue('bc@xamplecomd');
  });

  test('pasted text is cleaned', async ({ contact, page }) => {
    await contact.input('email').focus();
    await page.evaluate(() => {
      const el = document.querySelector('#cf-email');
      const data = new DataTransfer();
      data.setData('text/plain', ' ｔｅｓｔ＠例子.com\n');
      el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
      document.execCommand('insertText', false, ' ｔｅｓｔ＠例子.com\n');
    });
    await expect(contact.input('email')).toHaveValue('.com');
  });

  test('IME composition is not stripped midway, only at its end', async ({ contact, page }) => {
    const email = contact.input('email');
    await email.focus();
    const mid = await page.evaluate(() => {
      const el = document.querySelector('#cf-email');
      el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      el.value = 'ab中文';
      el.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
      return el.value;
    });
    expect(mid).toBe('ab中文');
    await page.evaluate(() => {
      const el = document.querySelector('#cf-email');
      el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    });
    await expect(email).toHaveValue('ab');
  });

  test('a cleaned address still submits', async ({ contact, supabase }) => {
    await contact.fillValid({ email: 'ｔ tester@example.com' });
    await contact.submit();
    await expect.poll(() => supabase.submits.length).toBe(1);
    expect(supabase.submits[0].p_email).toBe('tester@example.com');
  });
});
