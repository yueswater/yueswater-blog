// Field rules and when errors appear: on leaving a field, then live while typing; on submit,
// every field is checked and focus moves to the first problem.
const { test, expect } = require('./support/fixtures');

test.describe('form validation', () => {
  test('untouched empty field shows no error on blur', async ({ contact }) => {
    await contact.input('name').focus();
    await contact.input('email').focus();
    await expect(contact.error('name')).toHaveText('');
  });

  test('name required after it was typed and cleared', async ({ contact }) => {
    await contact.input('name').fill('a');
    await contact.input('email').focus();
    await contact.input('name').fill('');
    await expect(contact.error('name')).toHaveText('這個欄位必填');
    await expect(contact.input('name')).toHaveAttribute('aria-invalid', 'true');
  });

  test('whitespace-only name counts as empty on submit', async ({ contact, supabase }) => {
    await contact.fillValid({ name: '   ' });
    await contact.requestSend();
    await expect(contact.error('name')).toHaveText('這個欄位必填');
    expect(supabase.submits).toHaveLength(0);
  });

  test('name maxlength is 80', async ({ contact }) => {
    await contact.input('name').fill('x'.repeat(90));
    await expect(contact.input('name')).toHaveValue('x'.repeat(80));
  });

  for (const bad of ['plain', 'a@b', 'a@@c.d', '@c.d']) {
    test(`email rejected: ${bad}`, async ({ contact }) => {
      await contact.input('email').fill(bad);
      await contact.input('name').focus();
      await expect(contact.error('email')).toHaveText('Email 格式不太對');
    });
  }

  test('email accepted and error clears live', async ({ contact }) => {
    await contact.input('email').fill('a@b');
    await contact.input('name').focus();
    await expect(contact.error('email')).not.toHaveText('');
    await contact.input('email').fill('a@b.co');
    await expect(contact.error('email')).toHaveText('');
    await expect(contact.input('email')).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('email maxlength is 200', async ({ contact }) => {
    await expect(contact.input('email')).toHaveAttribute('maxlength', '200');
  });

  test('organization is optional with maxlength 120', async ({ contact }) => {
    await expect(contact.input('org')).toHaveAttribute('maxlength', '120');
    await expect(contact.field('org').locator('.cf-optional')).toHaveText('選填');
    await expect(contact.page.locator('#cf-org-err')).toHaveCount(0);
  });

  test('message shorter than 10 characters', async ({ contact }) => {
    await contact.typeMessage('太短了');
    await contact.input('name').focus();
    await expect(contact.error('body')).toHaveText('訊息至少 10 個字');
  });

  test('message error clears once it reaches 10 characters', async ({ contact }) => {
    await contact.typeMessage('123456789');
    await contact.input('name').focus();
    await expect(contact.error('body')).not.toHaveText('');
    await contact.doc.click();
    await contact.page.keyboard.press('End');
    await contact.page.keyboard.type('0');
    await expect(contact.error('body')).toHaveText('');
  });

  test('clicking the toolbar does not count as leaving the message', async ({ contact }) => {
    await contact.typeMessage('短');
    await contact.tool('bold').click();
    await expect(contact.error('body')).toHaveText('');
  });

  test('empty submit flags all required fields and focuses name', async ({ contact, supabase }) => {
    await contact.requestSend();
    for (const f of ['name', 'email', 'topic', 'body']) await expect(contact.error(f)).toHaveText('這個欄位必填');
    await expect(contact.input('name')).toBeFocused();
    expect(supabase.submits).toHaveLength(0);
  });

  test('focus goes to email when only email is wrong', async ({ contact }) => {
    await contact.fillValid({ email: 'nope' });
    await contact.requestSend();
    await expect(contact.input('email')).toBeFocused();
  });

  test('focus goes to topic trigger when topic is missing', async ({ contact }) => {
    await contact.fillContact();
    await contact.typeMessage('這是一則測試留言，內容超過十個字。');
    await contact.requestSend();
    await expect(contact.topicTrigger).toBeFocused();
    await expect(contact.topicTrigger).toHaveAttribute('aria-invalid', 'true');
  });

  test('focus goes to editor when only the message is missing', async ({ contact }) => {
    await contact.fillContact();
    await contact.pickTopic();
    await contact.requestSend();
    await expect(contact.doc).toBeFocused();
  });

  test('picking a topic clears its error', async ({ contact }) => {
    await contact.requestSend();
    await expect(contact.error('topic')).not.toHaveText('');
    await contact.pickTopic('job');
    await expect(contact.error('topic')).toHaveText('');
  });
});
