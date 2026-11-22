// The admin reply toolbar: extra tools, Markdown round trip, tooltips with shortcuts, narrow modal.
const { test: base, expect } = require('@playwright/test');
const { mockSupabase } = require('../../contact/e2e/support/supabase-mock');
const { isolatePage } = require('../../contact/e2e/support/isolation');
const { PATHS } = require('../../contact/e2e/support/server');

const test = base.extend({
  admin: async ({ page }, use) => {
    await isolatePage(page);
    await mockSupabase(page);
    await page.goto(PATHS.admin);
    await page.getByRole('button', { name: '留言' }).click();
    await page.locator('.msg').first().waitFor();
    await page.locator('.msg summary').first().click();
    await page.getByRole('button', { name: '回信' }).first().click();
    await page.locator('.rc-modal').waitFor();
    await use(page);
  },
});
const tool = (page, a) => page.locator(`.rc-modal .cf-tool[data-action="${a}"]`);
const ACTIONS = ['undo', 'redo', 'h2', 'h3', 'bold', 'italic', 'strike', 'code', 'link', 'bullet', 'ordered', 'quote', 'hr', 'block', 'image'];

test('admin toolbar has every tool, tooltips carry shortcuts, no horizontal overflow at 360px', async ({ admin }) => {
  for (const a of ACTIONS) await expect(tool(admin, a)).toHaveCount(1);
  await expect(tool(admin, 'bold')).toHaveAttribute('title', /粗體 \((Ctrl\+B|⌘B)\)/);
  await expect(tool(admin, 'hr')).toHaveAttribute('title', '分隔線');
  await admin.setViewportSize({ width: 360, height: 700 });
  const over = await admin.locator('.rc-modal').evaluate((m) => { const b = m.querySelector('.cf-tools'); return [m.scrollWidth > m.clientWidth, b.scrollWidth > b.clientWidth]; });
  expect(over).toEqual([false, false]);
});

test('new nodes round-trip through the Markdown tab', async ({ admin }) => {
  const doc = admin.locator('.rc-modal .ce-doc');
  await doc.click();
  await tool(admin, 'h2').click(); await admin.keyboard.type('Title'); await admin.keyboard.press('Enter');
  await tool(admin, 'strike').click(); await admin.keyboard.type('gone'); await tool(admin, 'strike').click(); await admin.keyboard.press('Enter');
  await tool(admin, 'quote').click(); await admin.keyboard.type('quoted'); await admin.keyboard.press('Enter'); await admin.keyboard.press('Enter');
  await tool(admin, 'hr').click();
  await tool(admin, 'bullet').click(); await admin.keyboard.type('item');
  await admin.locator('.rc-modal [data-tab="source"]').click();
  const md = await admin.locator('.rc-modal textarea').inputValue();
  expect(md).toMatch(/^## Title$/m);
  expect(md).toMatch(/~~gone~~/);
  expect(md).toMatch(/^> quoted$/m);
  expect(md).toMatch(/^---$/m);
  expect(md).toMatch(/^- item$/m);
  await admin.locator('.rc-modal [data-tab="rich"]').click();
  await expect(doc.locator('h2')).toHaveText('Title');
  await expect(doc.locator('s')).toHaveText('gone');
  await expect(doc.locator('blockquote')).toContainText('quoted');
  await expect(doc.locator('hr')).toHaveCount(1);
  await expect(doc.locator('li')).toHaveText('item');
});
