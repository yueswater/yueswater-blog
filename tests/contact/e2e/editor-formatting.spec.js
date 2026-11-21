// The message editor's inline marks, links and lists: shown live, mirrored to Markdown.
const { test, expect } = require('./support/fixtures');

const mod = process.platform === 'darwin' ? 'Meta' : 'Control';

test.describe('editor formatting', () => {
  test('placeholder shows and the caret starts at the left edge', async ({ contact }) => {
    await expect(contact.doc.locator('p.is-editor-empty')).toHaveAttribute('data-placeholder', '想說的話，至少 10 個字');
    await contact.doc.click();
    // an empty paragraph's caret sits on its trailing <br>; the range itself has no rect
    const [caret, left] = await contact.page.evaluate(() => {
      const r = document.querySelector('.ce-doc p br').getBoundingClientRect();
      const box = document.querySelector('.ce-doc').getBoundingClientRect();
      const pad = parseFloat(getComputedStyle(document.querySelector('.ce-doc')).paddingLeft);
      return [r.left, box.left + pad];
    });
    expect(Math.abs(caret - left)).toBeLessThan(4);
  });

  test('placeholder disappears once typing starts', async ({ contact }) => {
    await contact.typeMessage('嗨');
    await expect(contact.doc.locator('p.is-editor-empty')).toHaveCount(0);
  });

  test('bold via toolbar renders strong and writes **', async ({ contact }) => {
    await contact.typeMessage('一般 ');
    await contact.tool('bold').click();
    await contact.page.keyboard.type('粗體');
    await expect(contact.doc.locator('strong')).toHaveText('粗體');
    await expect(contact.tool('bold')).toHaveAttribute('aria-pressed', 'true');
    expect(await contact.markdown()).toBe('一般 **粗體**');
  });

  test('bold is visibly heavier than body text', async ({ contact }) => {
    await contact.setMarkdown('a **b**');
    const weight = await contact.doc.locator('strong').evaluate((n) => getComputedStyle(n).fontWeight);
    expect(Number(weight)).toBeGreaterThanOrEqual(700);
  });

  test('italic shortcut writes *', async ({ contact }) => {
    await contact.doc.click();
    await contact.page.keyboard.press(`${mod}+i`);
    await contact.page.keyboard.type('斜');
    await expect(contact.doc.locator('em')).toHaveText('斜');
    expect(await contact.markdown()).toBe('*斜*');
  });

  test('inline code button writes backticks', async ({ contact }) => {
    await contact.doc.click();
    await contact.tool('code').click();
    await contact.page.keyboard.type('x_ij');
    expect(await contact.markdown()).toBe('`x_ij`');
  });

  test('bulleted list', async ({ contact }) => {
    await contact.doc.click();
    await contact.tool('bullet').click();
    await contact.page.keyboard.type('甲');
    await contact.page.keyboard.press('Enter');
    await contact.page.keyboard.type('乙');
    await expect(contact.doc.locator('ul > li')).toHaveCount(2);
    await expect(contact.tool('bullet')).toHaveAttribute('aria-pressed', 'true');
    expect(await contact.markdown()).toBe('- 甲\n- 乙');
  });

  test('numbered list', async ({ contact }) => {
    await contact.doc.click();
    await contact.tool('ordered').click();
    await contact.page.keyboard.type('一');
    await contact.page.keyboard.press('Enter');
    await contact.page.keyboard.type('二');
    await expect(contact.doc.locator('ol > li')).toHaveCount(2);
    expect(await contact.markdown()).toBe('1. 一\n2. 二');
  });

  test('toggling a list button twice removes the list', async ({ contact }) => {
    await contact.doc.click();
    await contact.tool('bullet').click();
    await contact.tool('bullet').click();
    await expect(contact.doc.locator('ul')).toHaveCount(0);
  });

  test('link popover with Cmd+K inserts a link with text', async ({ contact }) => {
    await contact.doc.click();
    await contact.page.keyboard.press(`${mod}+k`);
    const pop = contact.page.locator('.ce-pop');
    await expect(pop).toBeVisible();
    await pop.locator('[name=url]').fill('example.com');
    await pop.locator('[name=text]').fill('範例');
    await contact.page.keyboard.press('Enter');
    await expect(contact.doc.locator('a[href="https://example.com"]')).toHaveText('範例');
    expect(await contact.markdown()).toBe('[範例](https://example.com)');
  });

  test('link popover rejects an invalid URL', async ({ contact }) => {
    await contact.doc.click();
    await contact.tool('link').click();
    await contact.page.locator('.ce-pop [name=url]').fill('not a url');
    await contact.page.keyboard.press('Enter');
    await expect(contact.page.locator('.ce-pop-error')).toHaveText('請輸入有效的網址');
  });

  test('Escape closes the link popover', async ({ contact }) => {
    await contact.doc.click();
    await contact.tool('link').click();
    await contact.page.keyboard.press('Escape');
    await expect(contact.page.locator('.ce-pop')).toBeHidden();
  });

  test('links get rel noopener nofollow ugc and open in a new tab', async ({ contact }) => {
    await contact.setMarkdown('[x](https://example.com)');
    const a = contact.doc.locator('a');
    await expect(a).toHaveAttribute('rel', 'noopener nofollow ugc');
    await expect(a).toHaveAttribute('target', '_blank');
  });

  test('javascript: links are not kept', async ({ contact }) => {
    await contact.setMarkdown('[x](javascript:alert(1))');
    await expect(contact.doc.locator('a[href^="javascript"]')).toHaveCount(0);
  });

  test('headings are not supported and stay as text', async ({ contact }) => {
    await contact.setMarkdown('# 標題');
    await expect(contact.doc.locator('h1')).toHaveCount(0);
  });
});
