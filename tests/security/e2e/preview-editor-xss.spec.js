// Hostile input on the visitor's side: Markdown in the source tab, rich HTML on the clipboard, the
// link dialog and the preview dialog. The visitor can only hurt themselves here, but the same
// rendering code runs in the admin, so anything that survives here is a lead.
const { test, expect } = require('./support/fixtures');
const { EDITOR } = require('./support/payloads');
const { verdict, SAFE, pwned } = require('./support/xss-detector');

// live markup or a Markdown link/image whose target is an executable scheme; KaTeX source such as
// \href{javascript:…} is not matched, because KaTeX renders it as inert error text (trust is off)
const DANGER = /<script|<img|<svg|<iframe|\bon\w+\s*=|\]\(\s*(javascript|vbscript|data):/i;

async function paste(page, html) {
  await page.locator('.ce-doc').click();
  await page.evaluate((h) => {
    const dt = new DataTransfer();
    dt.setData('text/html', h);
    dt.setData('text/plain', h.replace(/<[^>]+>/g, ''));
    document.querySelector('.ce-doc').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }, html);
}

async function openPreview(contact, md) {
  await contact.fillContact();
  await contact.pickTopic();
  await contact.setMarkdown(`${md}\n\npadding so the body is long enough`);
  await contact.requestSend();
  await contact.preview.waitFor({ state: 'visible' });
}

test.describe('editor and preview XSS', () => {
  for (const { id, title, md } of EDITOR) {
    test(`TC-SEC-${id} source tab ${title} is inert in editor and preview`, async ({ contact, page }) => {
      await openPreview(contact, md);
      expect(await verdict(page, '.ce-doc')).toEqual(SAFE);
      expect(await verdict(page, '[data-preview-dialog]')).toEqual(SAFE);
      // once the rich view re-serialises (any edit), the dangerous markup must not come back
      await page.locator('[data-preview-edit]').click();
      await contact.doc.click();
      await page.keyboard.press('End');
      await page.keyboard.type(' ok');
      expect(await contact.markdown(), 'Markdown regenerated from the rich view').not.toMatch(DANGER);
    });
  }

  test('TC-SEC-ED-005 pasted HTML drops script and style', async ({ contact, page }) => {
    void contact;
    await paste(page, '<p>hi <b>bold</b></p><script>alert(1)</script><style>*{color:red}</style><img src=x onerror=alert(2)>');
    await expect(page.locator('.ce-doc')).toContainText('hi');
    await expect(page.locator('.ce-doc strong')).toHaveText('bold');
    expect(await verdict(page, '.ce-doc')).toEqual(SAFE);
  });

  test('TC-SEC-ED-006 pasted link keeps href, loses onclick', async ({ contact, page }) => {
    void contact;
    await paste(page, '<a href="https://a.co" onclick="alert(1)">x</a>');
    const a = page.locator('.ce-doc a');
    await expect(a).toHaveAttribute('href', 'https://a.co');
    await expect(a).not.toHaveAttribute('onclick', /.*/);
    expect((await a.getAttribute('rel')).split(/\s+/)).toEqual(expect.arrayContaining(['noopener', 'nofollow', 'ugc']));
  });

  test('TC-SEC-ED-007 link dialog rejects javascript:', async ({ contact, page }) => {
    await contact.typeMessage('select me');
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Meta+k');
    await page.locator('.ce-pop input').first().fill('javascript:alert(1)');
    await page.keyboard.press('Enter');
    await expect(page.locator('.ce-doc a[href^="javascript"]')).toHaveCount(0);
    await expect(page.locator('.ce-pop-error')).toHaveText('請輸入有效的網址');
  });

  test('TC-SEC-ED-008 a 2000-character unbroken string causes no page overflow', async ({ contact, page }) => {
    await openPreview(contact, 'a'.repeat(1950));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('TC-SEC-ED-009 100-level nested list renders without freezing', async ({ contact, page }) => {
    const md = Array.from({ length: 100 }, (_, i) => `${'  '.repeat(i)}- level ${i}`).join('\n');
    const started = Date.now();
    await contact.setMarkdown(md);
    await expect(page.locator('.ce-doc')).toContainText('level 0');
    expect(Date.now() - started).toBeLessThan(10_000);
    await contact.input('name').fill('still responsive');
    await expect(contact.input('name')).toHaveValue('still responsive');
  });

  test('TC-SEC-ED-010 emoji over the limit gives an error and swallows nothing', async ({ contact, page }) => {
    // the limit counts characters (code points) on both client and server: 2001 emoji is over it,
    // and none of them may be cut off silently on the way in
    const body = '😀'.repeat(2001);
    await contact.fillContact();
    await contact.pickTopic();
    await contact.tab('source').click();
    await contact.source.fill(body);
    expect([...(await contact.markdown())].length, 'pasted text was silently cut to maxlength (UTF-16 units)').toBe(2001);
    await contact.requestSend();
    await expect(contact.error('body')).toHaveText('訊息最多 2000 字');
    expect(await pwned(page)).toEqual([]);
  });

  test('TC-SEC-ED-011 preview shows name and email as text', async ({ contact, page }) => {
    await contact.fillContact({ name: '<b onmouseover=alert(1)>x</b>' });
    await contact.pickTopic();
    await contact.typeMessage('a normal message body');
    await contact.requestSend();
    const dd = page.locator('[data-preview="name"]');
    await expect(dd).toHaveText('<b onmouseover=alert(1)>x</b>');
    await expect(dd.locator('b')).toHaveCount(0);
  });

  test('TC-SEC-ED-012 language filter treats HTML as plain text', async ({ contact, page }) => {
    await contact.tool('block').click();
    await page.locator('.ce-lang-btn').click();
    await page.locator('.ce-lang-filter').fill('<img src=x onerror=alert(1)>');
    await expect(page.locator('.ce-lang-list li')).toHaveCount(0);
    expect(await verdict(page, '.ce-lang-pop')).toEqual(SAFE);
  });
});
