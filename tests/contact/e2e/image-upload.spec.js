// Images: allowed types and sizes, crop dialog, upload to storage, failures and the busy state.
const { test, expect } = require('./support/fixtures');
const { drawImage, gif, oversizedPng } = require('./support/files');

const picker = (c) => c.page.locator('[data-image-picker]');
const crop = (c) => c.page.locator('.ce-crop');
const pickAndKeep = async (c, file) => {
  await picker(c).setInputFiles(file);
  await crop(c).locator('[data-act=skip]').click();
};

test.describe('image upload', () => {
  test('PNG goes through the crop dialog and uploads as <uuid>.png', async ({ contact, supabase }) => {
    await contact.doc.click();
    await picker(contact).setInputFiles(await drawImage(contact.page));
    await expect(crop(contact).locator('.ce-crop-title')).toHaveText('裁切圖片');
    await crop(contact).locator('[data-act=ok]').click();
    await expect(contact.doc.locator('img.ce-img:not(.is-uploading)')).toHaveCount(1);
    expect(supabase.uploads).toHaveLength(1);
    expect(supabase.uploads[0].name).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/);
    expect(supabase.uploads[0].type).toBe('image/png');
    expect(await contact.markdown()).toMatch(/^!\[shot\]\([0-9a-f-]{36}\.png\)$/);
  });

  test('JPG is accepted and stored as .jpg', async ({ contact, supabase }) => {
    await contact.doc.click();
    await pickAndKeep(contact, await drawImage(contact.page, { type: 'image/jpeg' }));
    await expect.poll(() => supabase.uploads.length).toBe(1);
    expect(supabase.uploads[0].name).toMatch(/\.jpg$/);
  });

  test('GIF is refused with a message', async ({ contact, supabase }) => {
    await contact.doc.click();
    await picker(contact).setInputFiles(gif());
    expect(await contact.toast()).toBe('只能上傳 JPG 或 PNG 圖片。');
    await expect(crop(contact)).toHaveCount(0);
    expect(supabase.uploads).toHaveLength(0);
  });

  test('file over 5 MB is refused', async ({ contact, supabase }) => {
    await contact.doc.click();
    await picker(contact).setInputFiles(oversizedPng());
    expect(await contact.toast()).toBe('圖片不能超過 5MB。');
    expect(supabase.uploads).toHaveLength(0);
  });

  test('a fourth image is refused', async ({ contact, supabase }) => {
    await contact.doc.click();
    for (let i = 0; i < 3; i++) await pickAndKeep(contact, await drawImage(contact.page, { name: `p${i}.png` }));
    await expect.poll(() => supabase.uploads.length).toBe(3);
    await picker(contact).setInputFiles(await drawImage(contact.page, { name: 'p4.png' }));
    expect(await contact.toast()).toBe('最多只能放 3 張圖片。');
    await expect(contact.doc.locator('img.ce-img')).toHaveCount(3);
  });

  test('cancel and Escape insert nothing', async ({ contact, supabase }) => {
    await contact.doc.click();
    await picker(contact).setInputFiles(await drawImage(contact.page));
    await crop(contact).locator('[data-act=cancel]').click();
    await picker(contact).setInputFiles(await drawImage(contact.page));
    await contact.page.keyboard.press('Escape');
    await expect(crop(contact)).toHaveCount(0);
    await expect(contact.doc.locator('img')).toHaveCount(0);
    expect(supabase.uploads).toHaveLength(0);
  });

  test('1:1 preset crops to a square', async ({ contact }) => {
    await contact.doc.click();
    await picker(contact).setInputFiles(await drawImage(contact.page, { width: 400, height: 200 }));
    await expect(crop(contact).locator('.ce-chip')).toHaveText(['自由', '1:1', '4:3', '16:9']);
    await crop(contact).locator('.ce-chip[data-r="1"]').click();
    await expect(crop(contact).locator('.ce-chip[data-r="1"]')).toHaveClass(/is-on/);
    await crop(contact).locator('[data-act=ok]').click();
    const img = contact.doc.locator('img.ce-img');
    await expect(img).toHaveCount(1);
    const [w, h] = await img.evaluate(async (n) => { await n.decode(); return [n.naturalWidth, n.naturalHeight]; });
    expect(w).toBe(h);
  });

  test('upload failure removes the image and explains', async ({ contact, supabase }) => {
    supabase.failUploads(500);
    await contact.doc.click();
    await pickAndKeep(contact, await drawImage(contact.page));
    expect(await contact.toast()).toBe('圖片上傳失敗，請換一張或稍後再試。');
    await expect(contact.doc.locator('img')).toHaveCount(0);
  });

  test('submit waits while an image is still uploading', async ({ contact, supabase }) => {
    supabase.slowUploads(3000);
    await contact.fillValid();
    await pickAndKeep(contact, await drawImage(contact.page));
    await expect(contact.doc.locator('img.is-uploading')).toHaveCount(1);
    await contact.requestSend();
    expect(await contact.toast()).toBe('圖片還在上傳，請稍等一下。');
    expect(supabase.submits).toHaveLength(0);
  });

  test('clicking an inserted image opens the crop dialog again', async ({ contact, supabase }) => {
    await contact.doc.click();
    await pickAndKeep(contact, await drawImage(contact.page));
    await expect.poll(() => supabase.uploads.length).toBe(1);
    await contact.doc.locator('img.ce-img').click();
    await expect(crop(contact)).toBeVisible();
    await crop(contact).locator('.ce-chip[data-r="1"]').click();
    await crop(contact).locator('[data-act=ok]').click();
    await expect.poll(() => supabase.uploads.length).toBe(2);
    await expect(contact.doc.locator('img.ce-img')).toHaveCount(1);
  });

  test('pasted image goes through the same flow', async ({ contact, supabase }) => {
    await contact.doc.click();
    const file = await drawImage(contact.page);
    await contact.doc.evaluate((el, b64) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const dt = new DataTransfer();
      dt.items.add(new File([bytes], 'paste.png', { type: 'image/png' }));
      el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    }, file.buffer.toString('base64'));
    await crop(contact).locator('[data-act=skip]').click();
    await expect.poll(() => supabase.uploads.length).toBe(1);
  });
});
