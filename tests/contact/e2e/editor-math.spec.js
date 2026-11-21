// Inline and display math: popover with live KaTeX preview, insert, edit and remove.
const { test, expect } = require('./support/fixtures');

test.describe('editor math', () => {
  test('inline math: live preview then insert as $…$', async ({ contact }) => {
    await contact.doc.click();
    await contact.tool('math').click();
    const pop = contact.page.locator('.ce-pop');
    await expect(pop.locator('.ce-pop-title')).toHaveText('行內數學式');
    await pop.locator('[name=latex]').fill('e^{i\\pi}+1=0');
    await expect(pop.locator('.ce-pop-preview .katex')).toBeVisible();
    await contact.page.keyboard.press('Enter');
    await expect(contact.doc.locator('[data-type="inline-math"] .katex')).toBeVisible();
    expect(await contact.markdown()).toBe('$e^{i\\pi}+1=0$');
  });

  test('display math uses a textarea and Cmd+Enter inserts $$ block', async ({ contact }) => {
    await contact.doc.click();
    await contact.tool('mathBlock').click();
    const field = contact.page.locator('.ce-pop textarea[name=latex]');
    await field.fill('\\int_0^1 x^2\\,dx');
    await contact.page.keyboard.press(process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter');
    await expect(contact.doc.locator('[data-type="block-math"] .katex-display')).toBeVisible();
    expect(await contact.markdown()).toContain('$$\n\\int_0^1 x^2\\,dx\n$$');
  });

  test('empty expression is refused', async ({ contact }) => {
    await contact.doc.click();
    await contact.tool('math').click();
    await contact.page.keyboard.press('Enter');
    await expect(contact.page.locator('.ce-pop-error')).toHaveText('請輸入 LaTeX 數學式');
    await expect(contact.doc.locator('[data-type="inline-math"]')).toHaveCount(0);
  });

  test('broken LaTeX does not throw and is shown as an error render', async ({ contact, page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await contact.doc.click();
    await contact.tool('math').click();
    await contact.page.locator('.ce-pop [name=latex]').fill('\\frac{1}{');
    await contact.page.keyboard.press('Enter');
    await expect(contact.doc.locator('[data-type="inline-math"]')).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test('clicking inline math opens it for editing and updates it', async ({ contact }) => {
    await contact.setMarkdown('值為 $a+b$ 。');
    await contact.doc.locator('[data-type="inline-math"]').click();
    const pop = contact.page.locator('.ce-pop');
    await expect(pop.locator('[name=latex]')).toHaveValue('a+b');
    await expect(pop.locator('.ce-btn.is-primary')).toHaveText('更新');
    await pop.locator('[name=latex]').fill('a-b');
    await contact.page.keyboard.press('Enter');
    expect(await contact.markdown()).toBe('值為 $a-b$ 。');
  });

  test('remove deletes the expression', async ({ contact }) => {
    await contact.setMarkdown('x $a$ y');
    await contact.doc.locator('[data-type="inline-math"]').click();
    await contact.page.locator('.ce-pop .ce-btn.is-danger').click();
    await expect(contact.doc.locator('[data-type="inline-math"]')).toHaveCount(0);
  });

  test('cancel leaves the message unchanged', async ({ contact }) => {
    await contact.setMarkdown('x $a$ y');
    await contact.doc.locator('[data-type="inline-math"]').click();
    await contact.page.locator('.ce-pop [name=latex]').fill('zzz');
    await contact.page.keyboard.press('Escape');
    expect(await contact.markdown()).toBe('x $a$ y');
  });
});
