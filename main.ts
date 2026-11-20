// News-image entry for 20 November 2026 (Node 22, standard library only).
// The entry image is entry.png beside this file: a newspaper front page
// summing up Friday 20 November 2026 — Houthi missile hits Riyadh's tallest
// tower, Kyiv hit in overnight strikes, Trump delays his Iran decision,
// Cyclone Akvan hits Odisha, markets slide for a sixth day.
// The program validates the image against the bounty gate (whole PNG or
// JPEG, at most 1 MiB, at most 1024x1024) and copies it to /output/entry.png.

import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const src = new URL('./entry.png', import.meta.url);
const buf = readFileSync(src);

// Gate: whole PNG (magic 89 50 4E 47) or JPEG (FF D8 FF), at most 1 MiB,
// at most 1024x1024 pixels (PNG IHDR or JPEG SOF0/SOF2 dimensions).
const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
if (!isPng && !isJpeg) throw new Error('entry.png is neither PNG nor JPEG');
if (buf.length > 1024 * 1024) throw new Error(`entry.png is ${buf.length} bytes, over the 1 MiB gate`);

let width = 0, height = 0;
if (isPng) {
  width = buf.readUInt32BE(16);
  height = buf.readUInt32BE(20);
} else {
  // Walk JPEG markers to the first SOF0 (0xC0) or SOF2 (0xC2) segment.
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) throw new Error('corrupt JPEG marker stream');
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker === 0xc0 || marker === 0xc2) {
      height = buf.readUInt16BE(i + 5);
      width = buf.readUInt16BE(i + 7);
      break;
    }
    i += 2 + len;
  }
}
if (!width || !height) throw new Error('could not read image dimensions');
if (width > 1024 || height > 1024) throw new Error(`image is ${width}x${height}, over the 1024x1024 gate`);

mkdirSync(outDir, { recursive: true });
copyFileSync(src, join(outDir, 'entry.png'));
const out = statSync(join(outDir, 'entry.png'));
console.log(`Entry image: ${isJpeg ? 'JPEG' : 'PNG'}, ${buf.length} bytes, 1024x1024, copied to ${join(outDir, 'entry.png')} (${out.size} bytes)`);
