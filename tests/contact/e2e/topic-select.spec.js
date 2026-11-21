// Custom listbox for the topic: mouse, keyboard and ARIA state.
const { test, expect } = require('./support/fixtures');

test.describe('topic select', () => {
  test('starts closed with the placeholder', async ({ contact }) => {
    await expect(contact.topicList).toBeHidden();
    await expect(contact.topicTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(contact.page.locator('.cf-select-value')).toHaveText('選擇主旨');
  });

  test('lists four options with hints', async ({ contact }) => {
    await contact.topicTrigger.click();
    const titles = contact.page.locator('.cf-option-title');
    await expect(titles).toHaveText(['合作邀約', '文章問題', '工作機會', '其他']);
    await expect(contact.page.locator('#cf-topic-collab .cf-option-hint')).toHaveText('專案、演講或寫作合作');
  });

  test('mouse pick sets value, label and aria-selected', async ({ contact }) => {
    await contact.pickTopic('post');
    await expect(contact.page.locator('.cf-select-value')).toHaveText('文章問題');
    await expect(contact.page.locator('input[name=topic]')).toHaveValue('post');
    await expect(contact.page.locator('#cf-topic-post')).toHaveAttribute('aria-selected', 'true');
    await expect(contact.topicList).toBeHidden();
    await expect(contact.topicTrigger).toBeFocused();
  });

  test('clicking the trigger again closes it', async ({ contact }) => {
    await contact.topicTrigger.click();
    await contact.topicTrigger.click();
    await expect(contact.topicList).toBeHidden();
  });

  test('outside click closes without choosing', async ({ contact }) => {
    await contact.topicTrigger.click();
    await contact.page.locator('.pagehead').click({ position: { x: 5, y: 5 } });
    await expect(contact.topicList).toBeHidden();
    await expect(contact.page.locator('input[name=topic]')).toHaveValue('');
  });

  for (const key of ['Enter', ' ', 'ArrowDown', 'ArrowUp']) {
    test(`keyboard ${JSON.stringify(key)} opens`, async ({ contact }) => {
      await contact.topicTrigger.focus();
      await contact.page.keyboard.press(key === ' ' ? 'Space' : key);
      await expect(contact.topicList).toBeVisible();
      await expect(contact.topicTrigger).toHaveAttribute('aria-activedescendant', 'cf-topic-collab');
    });
  }

  test('arrows, Home and End move the highlight; Enter picks', async ({ contact }) => {
    const kb = contact.page.keyboard;
    await contact.topicTrigger.focus();
    await kb.press('Enter');
    await kb.press('ArrowDown');
    await expect(contact.topicTrigger).toHaveAttribute('aria-activedescendant', 'cf-topic-post');
    await kb.press('End');
    await expect(contact.topicTrigger).toHaveAttribute('aria-activedescendant', 'cf-topic-other');
    await kb.press('ArrowDown');
    await expect(contact.topicTrigger).toHaveAttribute('aria-activedescendant', 'cf-topic-other');
    await kb.press('Home');
    await kb.press('ArrowUp');
    await expect(contact.topicTrigger).toHaveAttribute('aria-activedescendant', 'cf-topic-collab');
    await kb.press('Enter');
    await expect(contact.page.locator('input[name=topic]')).toHaveValue('collab');
  });

  test('Space picks the highlighted option', async ({ contact }) => {
    await contact.topicTrigger.focus();
    await contact.page.keyboard.press('Enter');
    await contact.page.keyboard.press('ArrowDown');
    await contact.page.keyboard.press('Space');
    await expect(contact.page.locator('input[name=topic]')).toHaveValue('post');
  });

  test('Escape closes and keeps focus on the trigger', async ({ contact }) => {
    await contact.topicTrigger.focus();
    await contact.page.keyboard.press('Enter');
    await contact.page.keyboard.press('Escape');
    await expect(contact.topicList).toBeHidden();
    await expect(contact.topicTrigger).toBeFocused();
  });

  test('Tab closes the list', async ({ contact }) => {
    await contact.topicTrigger.focus();
    await contact.page.keyboard.press('Enter');
    await contact.page.keyboard.press('Tab');
    await expect(contact.topicList).toBeHidden();
  });

  test('reopening highlights the chosen option', async ({ contact }) => {
    await contact.pickTopic('job');
    await contact.topicTrigger.click();
    await expect(contact.topicTrigger).toHaveAttribute('aria-activedescendant', 'cf-topic-job');
  });
});

test.describe('topic select (English typeahead)', () => {
  test.use({ lang: 'en' });
  test('typing a letter jumps to the matching option', async ({ contact }) => {
    await contact.topicTrigger.focus();
    await contact.page.keyboard.press('Enter');
    await contact.page.keyboard.press('j');
    await expect(contact.topicTrigger).toHaveAttribute('aria-activedescendant', 'cf-topic-job');
  });
});
