// Side column: peeking avatar, speech bubble, and the four social links on the board.
const { test, expect } = require('./support/fixtures');

const LINKS = [
  ['facebook', 'Facebook', 'https://www.facebook.com/yueswater/', 'rgb(24, 119, 242)'],
  ['instagram', 'Instagram', 'https://instagram.com/yueswater', 'rgb(214, 41, 118)'],
  ['threads', 'Threads', 'https://www.threads.com/@yueswater', 'rgb(0, 0, 0)'],
  ['github', 'GitHub', 'https://github.com/yueswater', 'rgb(24, 23, 23)'],
];

test.describe('side links', () => {
  test('peek image and bubble text', async ({ contact }) => {
    await expect(contact.page.locator('.contact-peek img')).toHaveAttribute('src', /contact-peek\.png$/);
    await expect(contact.page.locator('.contact-bubble p')).toHaveText('可以透過其他方式找到我唷！');
    await expect(contact.page.locator('.contact-side h2')).toHaveText('其他聯絡方式');
  });

  test('four links in order, no email', async ({ contact }) => {
    const items = contact.page.locator('.contact-board .link-item');
    await expect(items).toHaveCount(4);
    await expect(items.locator('.link-label')).toHaveText(LINKS.map((l) => l[1]));
    await expect(contact.page.locator('.contact-board a[href^="mailto:"]')).toHaveCount(0);
  });

  for (const [icon, , href, hover] of LINKS) {
    test(`${icon}: target and brand colour on hover`, async ({ contact }) => {
      const a = contact.page.locator(`.contact-board .link-item[data-icon="${icon}"]`);
      await expect(a).toHaveAttribute('href', href);
      await a.hover();
      await expect(a.locator('.link-label')).toHaveCSS('color', hover);
    });
  }

  test('labels are light grey at rest', async ({ contact }) => {
    await expect(contact.page.locator('.contact-board .link-label').first()).toHaveCSS('color', 'rgb(154, 160, 168)');
  });

  test('links sit inside the middle plank of the board', async ({ contact }) => {
    const img = await contact.page.locator('.contact-peek img').boundingBox();
    const board = await contact.page.locator('.contact-board .links').boundingBox();
    const top = (board.y - img.y) / img.height;
    const bottom = (board.y + board.height - img.y) / img.height;
    expect(top).toBeGreaterThan(0.575);
    expect(bottom).toBeLessThan(0.775);
  });
});

test.describe('side links (English)', () => {
  test.use({ lang: 'en' });
  test('English bubble', async ({ contact }) => {
    await expect(contact.page.locator('.contact-bubble p')).toHaveText('You can find me elsewhere too!');
  });
});
