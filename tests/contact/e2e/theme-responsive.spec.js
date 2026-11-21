// Page structure across language, dark theme and narrow screens.
const { test, expect } = require('./support/fixtures');

test.describe('page structure', () => {
  test('page head: kicker, title, lead, no side panel', async ({ contact }) => {
    await expect(contact.page.locator('.pagehead')).toHaveClass(/pagehead--solo/);
    await expect(contact.page.locator('.pagehead h1')).toHaveText('聯絡我');
    await expect(contact.page.locator('.contact-sea canvas.ascii-ocean')).toHaveCount(1);
  });

  test('footer general column links to contact', async ({ contact }) => {
    await expect(contact.page.locator('.footer a[href="/contact"]')).toHaveText('聯絡我');
  });

  test('language switch points to the English page', async ({ contact }) => {
    await expect(contact.page.locator('a.lang-switch').first()).toHaveAttribute('href', '/contact-en/');
  });

  test('dark theme keeps text readable', async ({ contact }) => {
    await contact.page.evaluate(() => document.body.classList.add('dark-theme'));
    const bg = await contact.page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).not.toBe('rgb(255, 255, 255)');
    await expect(contact.page.locator('.contact-bubble p')).toHaveCSS('color', 'rgb(17, 17, 17)');
  });
});

test.describe('narrow screen', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('no horizontal scroll and side column under the form', async ({ contact }) => {
    const [sw, iw] = await contact.page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    expect(sw).toBeLessThanOrEqual(iw);
    const form = await contact.form.boundingBox();
    const side = await contact.page.locator('.contact-side').boundingBox();
    expect(side.y).toBeGreaterThan(form.y + form.height - 1);
  });
});

test.describe('English page', () => {
  test.use({ lang: 'en' });
  test('English copy and switch back', async ({ contact }) => {
    await expect(contact.page.locator('.pagehead h1')).toHaveText('Contact');
    await expect(contact.page.locator('a.lang-switch').first()).toHaveAttribute('href', '/contact/');
    await expect(contact.page.locator('label[for=cf-org]')).toContainText('Optional');
  });
});
