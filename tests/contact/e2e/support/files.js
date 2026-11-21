// Test images. Real JPG/PNG bytes are drawn by the browser's canvas, so the crop dialog can decode
// them; the GIF and the oversized file only need the right type and size.
async function drawImage(page, { type = 'image/png', width = 320, height = 180, name } = {}) {
  const base64 = await page.evaluate(({ type, width, height }) => {
    const c = Object.assign(document.createElement('canvas'), { width, height });
    const g = c.getContext('2d');
    g.fillStyle = '#1747e6'; g.fillRect(0, 0, width, height);
    g.fillStyle = '#fff'; g.fillRect(width / 4, height / 4, width / 2, height / 2);
    return c.toDataURL(type).split(',')[1];
  }, { type, width, height });
  const ext = type === 'image/jpeg' ? 'jpg' : 'png';
  return { name: name || `shot.${ext}`, mimeType: type, buffer: Buffer.from(base64, 'base64') };
}

const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');
const gif = () => ({ name: 'anim.gif', mimeType: 'image/gif', buffer: GIF });

// 5 MB + 1 byte, PNG signature in front; rejected on size before anything decodes it
function oversizedPng() {
  const buffer = Buffer.alloc(5 * 1024 * 1024 + 1);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer);
  return { name: 'huge.png', mimeType: 'image/png', buffer };
}

module.exports = { drawImage, gif, oversizedPng };
