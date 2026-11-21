// What the site records from the contact form (incl. IP) is disclosed in the consent banner's
// Necessary section, so these tests start without a stored consent choice.
const { test: base, expect } = require('@playwright/test');
const { mockSupabase } = require('./support/supabase-mock');
const { isolatePage } = require('./support/isolation');
const { PATHS } = require('./support/server');

const test = base.extend({
  fresh: async ({ page }, use) => {
    await isolatePage(page);
    await mockSupabase(page);
    await use(page);
  },
});

test.describe('privacy disclosure', () => {
  test('contact page shows no inline privacy notice', async ({ fresh }) => {
    await fresh.goto(PATHS.zh);
    await expect(fresh.locator('.cf-privacy')).toHaveCount(0);
  });

  test('Manage settings → Necessary mentions contact data, IP and 180 days', async ({ fresh }) => {
    await fresh.goto(PATHS.zh);
    await fresh.getByRole('button', { name: '管理設定' }).click();
    const text = fresh.getByText(/聯絡我頁面送出留言/);
    await expect(text).toBeVisible();
    await expect(text).toContainText('網際網路協定位址（IP 位址）');
    await expect(text).toContainText('180 天後刪除');
  });

  test('English banner discloses the IP address too', async ({ fresh }) => {
    await fresh.goto(PATHS.en);
    await fresh.getByRole('button', { name: 'Manage settings' }).click();
    const text = fresh.getByText(/through the contact page/);
    await expect(text).toContainText('Internet Protocol address (IP address)');
    await expect(text).toContainText('deleted after 180 days');
  });
});
