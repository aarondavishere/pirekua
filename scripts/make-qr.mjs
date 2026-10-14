// Builds the printable QR codes in marketing/qr/: npm run qr
// Each code points at a short link (/q/<code>) that counts the scan and then
// redirects (see netlify/functions/qr.mjs), so the artwork never needs to change.
// Output: a vector SVG (best for print) and a 2000px PNG for each code.

import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { encode } from 'uqr';

const SITE = 'https://mexicanchilicrisp.com';
const CODES = { pack: 'packaging', promo: 'marketing' };
const INK = [0x3a, 0x14, 0x06];   // Mole Ink
const CREAM = [0xff, 0xf8, 0xec]; // Warm Cream
const QUIET = 4;                  // modules of blank border the spec asks for
const PNG_PX = 2000;
const OUT = new URL('../marketing/qr/', import.meta.url);

const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();

function svg(data) {
  const n = data.length + QUIET * 2;
  let d = '';
  data.forEach((row, y) => row.forEach((on, x) => { if (on) d += `M${x + QUIET} ${y + QUIET}h1v1h-1z`; }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges">` +
    `<rect width="${n}" height="${n}" fill="${hex(CREAM)}"/><path fill="${hex(INK)}" d="${d}"/></svg>\n`;
}

const CRC = new Int32Array(256).map((_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n;
});
const crc32 = (buf) => { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, body) {
  const out = Buffer.alloc(body.length + 12);
  out.writeUInt32BE(body.length, 0);
  out.write(type, 4, 'ascii');
  body.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
  return out;
}

function png(data) {
  const n = data.length + QUIET * 2;
  const scale = Math.max(1, Math.floor(PNG_PX / n));
  const px = n * scale;
  const raw = Buffer.alloc((px * 3 + 1) * px);
  for (let y = 0; y < px; y++) {
    const my = Math.floor(y / scale) - QUIET;
    raw[y * (px * 3 + 1)] = 0;
    for (let x = 0; x < px; x++) {
      const mx = Math.floor(x / scale) - QUIET;
      const on = data[my]?.[mx] === true;
      (on ? Buffer.from(INK) : Buffer.from(CREAM)).copy(raw, y * (px * 3 + 1) + 1 + x * 3);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(px, 0);
  ihdr.writeUInt32BE(px, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT, { recursive: true });
for (const [code, name] of Object.entries(CODES)) {
  const url = `${SITE}/q/${code}`;
  // Q = survives ~25% damage: scuffed jars, smudged labels, curved surfaces.
  const { data } = encode(url, { ecc: 'Q' });
  writeFileSync(new URL(`qr-${name}.svg`, OUT), svg(data));
  writeFileSync(new URL(`qr-${name}.png`, OUT), png(data));
  console.log(`${name}: ${url} (${data.length}×${data.length} modules)`);
}
