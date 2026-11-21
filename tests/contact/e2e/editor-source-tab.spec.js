// The Markdown source tab: what is sent, round trips with the rich view, tab semantics.
const { test, expect } = require('./support/fixtures');

test.describe('editor source tab', () => {
  test('rich view first; source textarea hidden', async ({ contact }) => {
    await expect(contact.tab('rich')).toHaveAttribute('aria-selected', 'true');
    await expect(contact.source).toBeHidden();
    await expect(contact.doc).toBeVisible();
  });

  test('switching shows the Markdown and hides the rich view', async ({ contact }) => {
    await contact.typeMessage('你好');
    await contact.tab('source').click();
    await expect(contact.source).toBeVisible();
    await expect(contact.source).toHaveValue('你好');
    await expect(contact.doc).toBeHidden();
    await expect(contact.tab('source')).toHaveAttribute('aria-selected', 'true');
  });

  test('Markdown edited in source comes back formatted', async ({ contact }) => {
    await contact.setMarkdown('**粗** 與 *斜*\n\n- 一\n- 二');
    await expect(contact.doc.locator('strong')).toHaveText('粗');
    await expect(contact.doc.locator('em')).toHaveText('斜');
    await expect(contact.doc.locator('ul > li')).toHaveCount(2);
  });

  test('round trip keeps the Markdown unchanged', async ({ contact }) => {
    const md = '你好 **粗體**\n\n1. 第一\n2. 第二\n\n$e^x$\n\n```python\nprint(1)\n```';
    await contact.setMarkdown(md);
    await contact.tab('source').click();
    await expect(contact.source).toHaveValue(md);
  });

  test('empty paragraphs leave no &nbsp; and no long blank runs', async ({ contact }) => {
    await contact.typeMessage('上');
    for (let i = 0; i < 4; i++) await contact.page.keyboard.press('Enter');
    await contact.page.keyboard.type('下');
    const md = await contact.markdown();
    expect(md).not.toContain('&nbsp;');
    expect(md).not.toMatch(/\n{3,}/);
    expect(md).toBe('上\n\n下');
  });

  test('arrow keys move between tabs', async ({ contact }) => {
    await contact.tab('rich').focus();
    await contact.page.keyboard.press('ArrowRight');
    await expect(contact.tab('source')).toBeFocused();
    await expect(contact.tab('source')).toHaveAttribute('aria-selected', 'true');
    await expect(contact.tab('rich')).toHaveAttribute('tabindex', '-1');
  });

  test('typing in source updates the counter', async ({ contact }) => {
    await contact.tab('source').click();
    await contact.source.fill('1234567890');
    await expect(contact.counter).toHaveText('10');
  });
});
