// Admin "留言" tab in demo mode: list, read state, reply link and the rendered message.
const { test: base, expect } = require('@playwright/test');
const { mockSupabase } = require('./support/supabase-mock');
const { isolatePage } = require('./support/isolation');
const { PATHS } = require('./support/server');

const test = base.extend({
  admin: async ({ page }, use) => {
    await isolatePage(page);
    await mockSupabase(page);
    await page.goto(PATHS.admin);
    await page.getByRole('button', { name: '留言' }).click();
    await page.locator('.msg').first().waitFor();
    await use(page);
  },
});

test.describe('admin messages', () => {
  test('lists newest first with totals', async ({ admin }) => {
    await expect(admin.locator('.messages > p').first()).toHaveText('共 2 則，未讀 1 則');
    await expect(admin.locator('.msg summary strong')).toHaveText(['示範訪客', 'Demo Visitor']);
    await expect(admin.locator('.msg').first()).toHaveClass(/unread/);
  });

  test('summary shows topic label and a plain-text preview', async ({ admin }) => {
    const first = admin.locator('.msg').first();
    await expect(first.locator('.pill')).toHaveText('文章問題');
    await expect(first.locator('.msg-preview')).not.toContainText('**');
  });

  test('opening an unread message marks it read and keeps it open', async ({ admin }) => {
    await admin.locator('.msg summary').first().click();
    await expect(admin.locator('.messages > p').first()).toHaveText('共 2 則，未讀 0 則');
    await expect(admin.locator('.msg').first()).toHaveAttribute('open', '');
    await expect(admin.locator('.msg').first()).not.toHaveClass(/unread/);
  });

  test('mark unread restores the unread state', async ({ admin }) => {
    await admin.locator('.msg summary').first().click();
    await admin.getByRole('button', { name: '標為未讀' }).first().click();
    await expect(admin.locator('.messages > p').first()).toHaveText('共 2 則，未讀 1 則');
    await expect(admin.locator('.msg').first()).not.toHaveAttribute('open', '');
  });

  test('details show email, organization and language', async ({ admin }) => {
    await admin.locator('.msg summary').first().click();
    await expect(admin.locator('.msg-body .muted.small').first()).toContainText('visitor@example.com · 某大學經濟系');
  });

  test('details show the sender IP', async ({ admin }) => {
    await admin.locator('.msg summary').first().click();
    await expect(admin.locator('.msg-body .muted.small').first()).toContainText('IP 203.0.113.7');
  });

  test('reply opens a mailto with the topic as subject', async ({ admin }) => {
    await admin.locator('.msg summary').first().click();
    await expect(admin.getByRole('link', { name: '回信' }).first()).toHaveAttribute('href', `mailto:visitor@example.com?subject=${encodeURIComponent('Re: 文章問題')}`);
  });

  test('body renders bold, list, math, code and image', async ({ admin }) => {
    await admin.locator('.msg summary').first().click();
    const body = admin.locator('.msg-text').first();
    await expect(body.locator('strong')).toHaveText('第二個式子');
    await expect(body.locator('ol > li')).toHaveCount(2);
    await expect(body.locator('.katex').first()).toBeVisible();
    await expect(body.locator('.ce-lang-tag')).toHaveText('Python');
    await expect(body.locator('.ce-gutter span')).toHaveText(['1']);
    await expect(body.locator('img.ce-img')).toHaveAttribute('src', /favicon-192\.png$/);
  });

  test('rendered message is read-only', async ({ admin }) => {
    await admin.locator('.msg summary').first().click();
    await expect(admin.locator('.msg-text .ce-doc').first()).toHaveAttribute('contenteditable', 'false');
    await expect(admin.locator('.msg-text .ce-lang-btn')).toHaveCount(0);
  });
});
