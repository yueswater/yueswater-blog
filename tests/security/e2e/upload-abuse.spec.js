// Upload abuse on the visitor side: a decompression bomb, a GIF wearing a PNG label, and photo
// metadata (GPS) that the "use original" path may leak. Uploads go to the Supabase mock only.
const { test, expect } = require('./support/fixtures');
const { drawImage, gif } = require('../../contact/e2e/support/files');
const { withGps, hasGps, pngBomb } = require('./support/images');

// records the exact bytes of every upload (registered after the mock, so it takes precedence)
async function captureUploads(page) {
  const bodies = [];
  await page.route(/\/storage\/v1\/object\//, (route) => {
    const req = route.request();
    bodies.push({ type: req.headers()['content-type'], bytes: req.postDataBuffer() || Buffer.alloc(0) });
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  return bodies;
}

async function pick(page, file) {
  await page.locator('[data-image-picker]').setInputFiles(file);
  await page.locator('.ce-crop').waitFor({ state: 'visible', timeout: 15_000 });
}

test.describe('upload abuse', () => {
  test('TC-SEC-UP-009 a decompression-bomb PNG does not take the tab down', async ({ contact, page }) => {
    void contact;
    let crashed = false;
    page.on('crash', () => { crashed = true; });
    await page.locator('[data-image-picker]').setInputFiles(pngBomb());
    // either the crop dialog or an error toast, within a bounded time
    await expect(page.locator('.ce-crop, .cf-toast:not([hidden])').first()).toBeVisible({ timeout: 20_000 });
    expect(crashed).toBe(false);
    expect(await page.evaluate(() => 1 + 1)).toBe(2);
  });

  test('TC-SEC-UP-017 a GIF labelled image/png is re-encoded into a real PNG before upload', async ({ contact, page }) => {
    void contact;
    const bodies = await captureUploads(page);
    await pick(page, { ...gif(), name: 'fake.png', mimeType: 'image/png' });
    await page.locator('.ce-crop [data-act=skip]').click();
    await expect.poll(() => bodies.length).toBe(1);
    // "use original" also goes through the canvas, so what is uploaded really is a PNG
    expect(bodies[0].type).toBe('image/png');
    expect([...bodies[0].bytes.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });

  test('TC-SEC-UP-018 "use original" does not upload GPS metadata', async ({ contact, page }) => {
    void contact;
    const bodies = await captureUploads(page);
    const jpg = await drawImage(page, { type: 'image/jpeg', name: 'photo.jpg' });
    const file = { ...jpg, buffer: withGps(jpg.buffer) };
    expect(hasGps(file.buffer)).toBe(true);
    await pick(page, file);
    await page.locator('.ce-crop [data-act=skip]').click();
    await expect.poll(() => bodies.length).toBe(1);
    expect(hasGps(bodies[0].bytes), 'the original photo, GPS EXIF included, was uploaded as-is').toBe(false);
  });

  test('TC-SEC-UP-019 cropping re-encodes the photo and drops EXIF', async ({ contact, page }) => {
    void contact;
    const bodies = await captureUploads(page);
    const jpg = await drawImage(page, { type: 'image/jpeg', name: 'photo.jpg' });
    await pick(page, { ...jpg, buffer: withGps(jpg.buffer) });
    await page.locator('.ce-crop .ce-chip[data-r="1"]').click();
    await page.locator('.ce-crop [data-act=ok]').click();
    await expect.poll(() => bodies.length).toBe(1);
    expect(hasGps(bodies[0].bytes)).toBe(false);
  });
});
