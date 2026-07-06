// Generates the PWA icon set (Sprint 1.7) as PNGs with no external deps — pure
// zlib. Re-run with `node scripts/generate-icons.mjs` if the brand mark changes.
// The mark mirrors app/icon.svg: dark rounded square + a centered indigo bar.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const BG = [0x11, 0x11, 0x13, 0xff];
const BAR = [0x6e, 0x7b, 0xff, 0xff];

function canvas(w, h) {
  return { w, h, data: new Uint8Array(w * h * 4) };
}
function px(c, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
  const i = (y * c.w + x) * 4;
  c.data[i] = r;
  c.data[i + 1] = g;
  c.data[i + 2] = b;
  c.data[i + 3] = a;
}
function insideRound(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || y < y0 || x > x1 || y > y1) return false;
  if (r <= 0) return true;
  const cx = x < x0 + r ? x0 + r : x > x1 - r ? x1 - r : x;
  const cy = y < y0 + r ? y0 + r : y > y1 - r ? y1 - r : y;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}
function roundRect(c, x0, y0, x1, y1, r, color) {
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
      if (insideRound(x, y, x0, y0, x1, y1, r)) px(c, x, y, color);
    }
  }
}

/** Draw the brand mark. `bleed` = full-bleed background (maskable). */
function drawIcon(size, { bleed = false } = {}) {
  const c = canvas(size, size);
  const bgRadius = bleed ? 0 : size * 0.22;
  roundRect(c, 0, 0, size - 1, size - 1, bgRadius, BG);
  // Centered vertical bar (13/32 .. 19/32 wide, 8/32 .. 24/32 tall).
  const barR = size * 0.045;
  roundRect(c, size * 0.406, size * 0.25, size * 0.594, size * 0.75, barR, BAR);
  return c;
}

function screenshot(w, h) {
  const c = canvas(w, h);
  roundRect(c, 0, 0, w - 1, h - 1, 0, [0x0a, 0x0a, 0x0c, 0xff]);
  const s = Math.min(w, h) * 0.28;
  const cx = (w - s) / 2;
  const cy = (h - s) / 2;
  roundRect(c, cx, cy, cx + s, cy + s, s * 0.22, BG);
  roundRect(c, cx + s * 0.406, cy + s * 0.25, cx + s * 0.594, cy + s * 0.75, s * 0.045, BAR);
  return c;
}

// --- PNG encoding ---
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePng(c) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(c.w, 0);
  ihdr.writeUInt32BE(c.h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(c.h * (c.w * 4 + 1));
  for (let y = 0; y < c.h; y++) {
    raw[y * (c.w * 4 + 1)] = 0; // filter: none
    c.data.subarray(y * c.w * 4, (y + 1) * c.w * 4).forEach((v, i) => {
      raw[y * (c.w * 4 + 1) + 1 + i] = v;
    });
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const iconsDir = join(root, "icons");
const shotsDir = join(root, "screenshots");
mkdirSync(iconsDir, { recursive: true });
mkdirSync(shotsDir, { recursive: true });

const outputs = [
  ["icons/icon-192.png", drawIcon(192)],
  ["icons/icon-512.png", drawIcon(512)],
  ["icons/maskable-192.png", drawIcon(192, { bleed: true })],
  ["icons/maskable-512.png", drawIcon(512, { bleed: true })],
  ["icons/apple-touch-icon.png", drawIcon(180, { bleed: true })],
  ["screenshots/desktop.png", screenshot(1280, 720)],
  ["screenshots/mobile.png", screenshot(720, 1280)],
];
for (const [name, c] of outputs) {
  writeFileSync(join(root, name), encodePng(c));
  console.log(`wrote public/${name} (${c.w}x${c.h})`);
}
