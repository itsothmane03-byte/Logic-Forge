// Dev-only brand export; no browser or production dependency needed.
// SHARP_MODULE=/absolute/path/to/sharp/dist/index.mjs node scripts/dev/icons.mjs
// Rewrites exactly the icons index.html and the web manifest use.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = new URL('../../', import.meta.url);
const sharp = (await import(process.env.SHARP_MODULE
  ? pathToFileURL(process.env.SHARP_MODULE).href : 'sharp')).default;
const brand = new URL('public/brand/', root);
const icons = new URL('public/icons/', root);
await mkdir(icons, { recursive: true });
const source = await readFile(new URL('spot-the-flaw.svg', brand), 'utf8');
const PAPER = '#FAF8F4';

async function square(svg, size, scale, background = '#00000000') {
  const mark = await sharp(Buffer.from(svg), { density: 300 })
    .resize({ width: Math.round(size * scale) }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: mark, gravity: 'centre' }]).png().toBuffer();
}

// [folder, file, size, share of the canvas the mark fills, background]
const outputs = [
  [brand, 'favicon_16.png', 16, 0.94, PAPER],
  [brand, 'favicon_32.png', 32, 0.94, PAPER],
  [brand, 'logo-512.png', 512, 0.76, PAPER], // social preview
  [brand, 'logomark_light_128.png', 128, 0.88], // install icons, transparent
  [brand, 'logomark_light_256.png', 256, 0.88],
  [brand, 'logomark_light_512.png', 512, 0.88],
  [icons, 'maskable-512.png', 512, 0.80, PAPER], // inside the maskable safe zone
  [icons, 'apple-touch-icon.png', 180, 0.70, PAPER],
];

for (const [folder, file, size, scale, background] of outputs) {
  await writeFile(new URL(file, folder), await square(source, size, scale, background));
}
console.log(`Exported ${outputs.length} icons to ${fileURLToPath(brand)} and ${fileURLToPath(icons)}`);
