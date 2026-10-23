// Dev-only brand export; no browser or production dependency needed.
// SHARP_MODULE=/absolute/path/to/sharp/dist/index.mjs node scripts/dev/icons.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = new URL('../../', import.meta.url);
const sharp = (await import(process.env.SHARP_MODULE
  ? pathToFileURL(process.env.SHARP_MODULE).href : 'sharp')).default;
const brand = new URL('public/brand/', root);
const icons = new URL('public/icons/', root);
await mkdir(icons, { recursive: true });
const source = await readFile(new URL('spot-the-flaw.svg', brand), 'utf8');

async function square(svg, size, scale, background = '#00000000') {
  const mark = await sharp(Buffer.from(svg), { density: 300 })
    .resize({ width: Math.round(size * scale) }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: mark, gravity: 'centre' }]).png().toBuffer();
}

for (const theme of ['light', 'dark']) {
  const svg = source.replace('color="#121212"', `color="${theme === 'light' ? '#121212' : '#FAF8F4'}"`);
  await writeFile(new URL(`logomark_${theme}.svg`, brand), svg);
  const ink = theme === 'light' ? '#121212' : '#FAF8F4';
  const geometry = svg.replace(/^[\s\S]*?<title>[\s\S]*?<\/title>/, '').replace(/<\/svg>\s*$/, '');
  for (const stacked of [false, true]) {
    const layout = stacked ? 'stacked' : 'horizontal';
    const lockup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${stacked ? '0 0 480 300' : '0 0 640 128'}" color="${ink}">
<title>Fallacy Forge</title><g transform="${stacked ? 'translate(176 24)' : 'translate(12 12)'}">${geometry}</g>
<text x="${stacked ? '240' : '164'}" y="${stacked ? '214' : '82'}" text-anchor="${stacked ? 'middle' : 'start'}" fill="${ink}" font-family="Bricolage Grotesque,Arial,sans-serif" font-size="${stacked ? '58' : '60'}" font-weight="800" letter-spacing="-2">Fallacy Forge</text></svg>`;
    await writeFile(new URL(`logo_${layout}_${theme}.svg`, brand), lockup);
  }
  for (const size of [32, 64, 128, 256, 512]) {
    await writeFile(new URL(`logomark_${theme}_${size}.png`, brand), await square(svg, size, 0.88));
  }
}
for (const size of [16, 32]) {
  await writeFile(new URL(`favicon_${size}.png`, brand), await square(source, size, 0.94, '#FAF8F4'));
}
await writeFile(new URL('logo-512.png', brand), await square(source, 512, 0.76, '#FAF8F4'));
await writeFile(new URL('maskable-512.png', icons), await square(source, 512, 0.80, '#FAF8F4'));
await writeFile(new URL('apple-touch-icon.png', icons), await square(source, 180, 0.70, '#FAF8F4'));
console.log(`Exported brand and install icons to ${fileURLToPath(brand)}`);
