// Hostile image fixtures: a JPEG carrying GPS coordinates in EXIF, and a PNG "decompression bomb"
// (huge declared size, tiny file). Both are built byte by byte so no binary files live in the repo.
const zlib = require('node:zlib');

// minimal little-endian TIFF: IFD0 -> GPS IFD with GPSVersionID and GPSLatitudeRef = N
function exifWithGps() {
  const t = Buffer.alloc(56);
  t.write('II', 0); t.writeUInt16LE(42, 2); t.writeUInt32LE(8, 4);
  t.writeUInt16LE(1, 8); // IFD0: one entry
  t.writeUInt16LE(0x8825, 10); t.writeUInt16LE(4, 12); t.writeUInt32LE(1, 14); t.writeUInt32LE(26, 18);
  t.writeUInt32LE(0, 22); // no next IFD
  t.writeUInt16LE(2, 26); // GPS IFD: two entries
  t.writeUInt16LE(0x0000, 28); t.writeUInt16LE(1, 30); t.writeUInt32LE(4, 32); Buffer.from([2, 2, 0, 0]).copy(t, 36);
  t.writeUInt16LE(0x0001, 40); t.writeUInt16LE(2, 42); t.writeUInt32LE(2, 44); t.write('N\0', 48);
  t.writeUInt32LE(0, 52);
  const body = Buffer.concat([Buffer.from('Exif\0\0'), t]);
  const head = Buffer.from([0xff, 0xe1, 0, 0]);
  head.writeUInt16BE(body.length + 2, 2);
  return Buffer.concat([head, body]);
}

// inserts the GPS APP1 segment right after the JPEG's SOI marker
function withGps(jpeg) {
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) throw new Error('not a JPEG');
  return Buffer.concat([jpeg.subarray(0, 2), exifWithGps(), jpeg.subarray(2)]);
}

// true when the bytes hold an EXIF block that points to a GPS IFD
function hasGps(buf) {
  const at = buf.indexOf(Buffer.from('Exif\0\0'));
  if (at < 0) return false;
  return buf.subarray(at, at + 4096).includes(Buffer.from([0x25, 0x88]));
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0);
  return Buffer.concat([len, td, crc]);
}

// 1-bit greyscale, side x side pixels of zeros: tens of MB raw, a few KB compressed
function pngBomb(side = 20000) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(side, 0); ihdr.writeUInt32BE(side, 4); ihdr[8] = 1; ihdr[9] = 0;
  const raw = Buffer.alloc((Math.ceil(side / 8) + 1) * side);
  const idat = zlib.deflateSync(raw, { level: 9 });
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
  return { name: 'bomb.png', mimeType: 'image/png', buffer: png };
}

module.exports = { withGps, hasGps, pngBomb };
