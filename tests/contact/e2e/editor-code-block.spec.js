// Code blocks: language picker over the corner, line numbers, language colour, ```lang Markdown.
const { test, expect } = require('./support/fixtures');

const PY = '```python\ndef f(x):\n    return x * 2\nprint(f(21))\n```';

test.describe('editor code block', () => {
  test('toolbar button on an empty line makes an auto-detected block', async ({ contact }) => {
    await contact.doc.click();
    await contact.tool('block').click();
    await contact.page.keyboard.type('hello');
    await expect(contact.page.locator('.ce-lang-btn')).toHaveText('自動');
    // no language picked: the fence stays plain so the source round-trips
    expect(await contact.markdown()).toBe('```\nhello\n```');
  });

  test('an auto block highlights without picking a language', async ({ contact }) => {
    await contact.doc.click();
    await contact.tool('block').click();
    await contact.page.keyboard.type('import numpy as np');
    await expect(contact.page.locator('.ce-lang-btn')).toHaveText('自動');
    await expect(contact.page.locator('.ce-code [class^="hljs-"]').first()).toBeVisible();
  });

  test('the code button keeps the line you already typed and adds the block below', async ({ contact }) => {
    await contact.doc.click();
    await contact.page.keyboard.type('some text I just wrote');
    await contact.tool('block').click(); // no Enter first
    await contact.page.keyboard.type('x = 1');
    // the text stays its own paragraph; the code block is a separate node
    await expect(contact.page.locator('.ce-doc > p').first()).toHaveText('some text I just wrote');
    await expect(contact.page.locator('.ce-code')).toHaveCount(1);
    expect(await contact.markdown()).toBe('some text I just wrote\n\n```\nx = 1\n```');
  });

  test('line numbers follow the line count', async ({ contact }) => {
    await contact.setMarkdown(PY);
    await expect(contact.page.locator('.ce-gutter span')).toHaveText(['1', '2', '3']);
    await contact.page.locator('.ce-code code').click();
    await contact.page.keyboard.press('End');
    await contact.page.keyboard.press('Enter');
    await expect(contact.page.locator('.ce-gutter span')).toHaveCount(4);
  });

  test('line numbers are not part of the message', async ({ contact }) => {
    await contact.setMarkdown(PY);
    expect(await contact.markdown()).toBe(PY);
  });

  test('picker sits over the block without taking a row', async ({ contact }) => {
    await contact.setMarkdown(PY);
    const [btn, pre] = await Promise.all([contact.page.locator('.ce-lang-btn').boundingBox(), contact.page.locator('.ce-code pre').boundingBox()]);
    expect(btn.y).toBeLessThan(pre.y + 24);
    const padTop = await contact.page.locator('.ce-code pre').evaluate((n) => parseFloat(getComputedStyle(n).paddingTop));
    expect(padTop).toBeLessThan(16);
  });

  test('filter and Enter choose a language and rewrite the fence', async ({ contact }) => {
    await contact.setMarkdown('```plaintext\nfn main() {}\n```');
    await contact.page.locator('.ce-lang-btn').click();
    await contact.page.locator('.ce-lang-filter').fill('rus');
    await contact.page.keyboard.press('Enter');
    await expect(contact.page.locator('.ce-lang-btn')).toHaveText('Rust');
    expect(await contact.markdown()).toBe('```rust\nfn main() {}\n```');
  });

  test('mouse pick works and the list stays open until then', async ({ contact }) => {
    await contact.setMarkdown('```plaintext\nx\n```');
    await contact.page.locator('.ce-lang-btn').click();
    await contact.page.waitForTimeout(300);
    await expect(contact.page.locator('.ce-lang-pop')).toBeVisible();
    await contact.page.locator('.ce-lang-list li', { hasText: /^Go$/ }).click();
    await expect(contact.page.locator('.ce-lang-btn')).toHaveText('Go');
    await expect(contact.page.locator('.ce-lang-pop')).toHaveCount(0);
  });

  test('arrow keys move through the list; Escape closes', async ({ contact }) => {
    await contact.setMarkdown('```plaintext\nx\n```');
    await contact.page.locator('.ce-lang-btn').click();
    // the list opens on Auto; one step down lands on the first real language
    await contact.page.keyboard.press('ArrowDown');
    await expect(contact.page.locator('.ce-lang-list li.is-active')).toHaveText('Plain text');
    await contact.page.keyboard.press('Escape');
    await expect(contact.page.locator('.ce-lang-pop')).toHaveCount(0);
  });

  test('picking in the list does not scroll the page', async ({ contact }) => {
    await contact.setMarkdown('```plaintext\nx\n```');
    await contact.page.evaluate(() => window.scrollTo(0, 400));
    const before = await contact.page.evaluate(() => scrollY);
    await contact.page.locator('.ce-lang-btn').click();
    await contact.page.locator('.ce-lang-pop').waitFor();
    for (let i = 0; i < 10; i++) await contact.page.locator('.ce-lang-filter').press('ArrowDown');
    expect(await contact.page.evaluate(() => scrollY)).toBe(before);
  });

  test('list is attached to body and stacks above the page', async ({ contact }) => {
    await contact.setMarkdown('```plaintext\nx\n```');
    await contact.page.locator('.ce-lang-btn').click();
    const info = await contact.page.locator('.ce-lang-pop').evaluate((n) => [n.parentElement.tagName, getComputedStyle(n).position, Number(getComputedStyle(n).zIndex)]);
    expect(info[0]).toBe('BODY');
    expect(info[1]).toBe('fixed');
    expect(info[2]).toBeGreaterThanOrEqual(50);
  });

  test('outside click closes the list without changing the language', async ({ contact }) => {
    await contact.setMarkdown('```python\nx\n```');
    await contact.page.locator('.ce-lang-btn').click();
    await contact.page.locator('.pagehead').click({ position: { x: 5, y: 5 } });
    await expect(contact.page.locator('.ce-lang-pop')).toHaveCount(0);
    await expect(contact.page.locator('.ce-lang-btn')).toHaveText('Python');
  });

  test('each language has its own colour; plain text has none', async ({ contact }) => {
    await contact.setMarkdown('```python\na\n```\n\n```rust\nb\n```\n\n```plaintext\nc\n```');
    const colours = await contact.page.locator('.ce-code').evaluateAll((ns) => ns.map((n) => getComputedStyle(n).borderLeftColor));
    expect(colours[0]).toBe('rgb(53, 114, 165)');
    expect(colours[1]).toBe('rgb(222, 165, 132)');
    expect(colours[2]).toBe('rgba(0, 0, 0, 0)');
  });

  test('syntax highlighting adds token classes', async ({ contact }) => {
    await contact.setMarkdown(PY);
    await expect(contact.page.locator('.ce-code .hljs-keyword').first()).toBeVisible();
    await expect(contact.page.locator('.ce-code .hljs-number').first()).toHaveText('2');
  });

  test('unknown fence language still renders as a block', async ({ contact }) => {
    await contact.setMarkdown('```brainfuck\n+++\n```');
    await expect(contact.page.locator('.ce-code')).toHaveCount(1);
  });
});
