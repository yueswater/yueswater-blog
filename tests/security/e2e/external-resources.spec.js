// Outside resources in a message: tracking pixels, CSS url(), lookalike file names and links. The
// admin and the preview must never contact a host the message names; links open safely.
const { test, expect } = require('./support/fixtures');
const { message, openInbox, expand } = require('./support/admin');
const { EXTERNAL } = require('./support/payloads');
const { ATTACKER } = require('./support/network-guard');

async function renderInAdmin(page, body) {
  await openInbox(page, [message({ body })]);
  await expand(page);
  await page.waitForTimeout(300); // let any image or style request fire
}

test.describe('external resources', () => {
  test('TC-SEC-EXT-001 tracking pixel is not loaded in the admin', async ({ page, net }) => {
    await renderInAdmin(page, EXTERNAL.pixel);
    expect(net.to(ATTACKER)).toEqual([]);
  });

  test('TC-SEC-EXT-002 tracking pixel is not loaded in the preview', async ({ contact, page, net }) => {
    await contact.fillContact();
    await contact.pickTopic();
    await contact.setMarkdown(`${EXTERNAL.pixel}\n\nlong enough body text`);
    await contact.requestSend();
    await contact.preview.waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
    expect(net.to(ATTACKER)).toEqual([]);
  });

  test('TC-SEC-EXT-003 protocol-relative image is not loaded', async ({ page, net }) => {
    await renderInAdmin(page, EXTERNAL.protocolRelative);
    expect(net.to(ATTACKER)).toEqual([]);
  });

  test('TC-SEC-EXT-004 uuid-looking external URL is neither signed nor loaded', async ({ page, net }) => {
    await renderInAdmin(page, EXTERNAL.uuidLookalike);
    expect(net.to(ATTACKER)).toEqual([]);
    // the demo signs bucket names into /assets/favicon-192.png; a signed lookalike would show it
    await expect(page.locator('.msg-text img[src*="favicon"]')).toHaveCount(0);
  });

  test('TC-SEC-EXT-005 unknown bucket file name does not break the inbox', async ({ page, net }) => {
    void net;
    await openInbox(page, [message({ body: EXTERNAL.missingUuid }), message({ name: 'Other', body: 'second message here' })]);
    await expand(page, 0);
    await expand(page, 1);
    await expect(page.locator('.msg').nth(1)).toContainText('second message here');
  });

  test('TC-SEC-EXT-006 links carry rel noopener nofollow ugc and open in a new tab', async ({ page, net }) => {
    await renderInAdmin(page, EXTERNAL.link);
    const a = page.locator('.msg-text a[href="https://attacker.example"]');
    expect((await a.getAttribute('rel')).split(/\s+/)).toEqual(expect.arrayContaining(['noopener', 'nofollow', 'ugc']));
    await expect(a).toHaveAttribute('target', '_blank');
    expect(net.to(ATTACKER)).toEqual([]);
  });

  test('TC-SEC-EXT-007 inline style url() is dropped and not fetched', async ({ page, net }) => {
    await renderInAdmin(page, EXTERNAL.cssUrl);
    await expect(page.locator('.msg-text [style*="url("]')).toHaveCount(0);
    expect(net.to(ATTACKER)).toEqual([]);
  });

  test('TC-SEC-EXT-008 link text that looks like a URL keeps the real target in href', async ({ page, net }) => {
    void net;
    await renderInAdmin(page, EXTERNAL.phishing);
    // known social-engineering risk: the text says yueswater.com, the href goes elsewhere
    await expect(page.locator('.msg-text a')).toHaveAttribute('href', 'https://attacker.example');
  });

  test('TC-SEC-EXT-009 KaTeX fonts come from this site only', async ({ page, net }) => {
    await renderInAdmin(page, '$\\int_0^1 x^2\\,dx$ and $$\\sum_{i=1}^n i$$');
    await expect(page.locator('.msg-text .katex').first()).toBeVisible();
    expect(net.to(/katex|\.woff2?/i)).toEqual([]);
  });
});
