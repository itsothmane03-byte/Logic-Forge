// Dev-only: renders the PWA maskable icon and the apple-touch icon from the
// brand logomark geometry onto the paper background.
//
//   PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/dev/icons.mjs

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadPlaywright } from './browser.mjs';

const MARK = `
  <rect x="107" y="174" width="298" height="62" rx="28" fill="#FF6B3D"/>
  <polygon points="372,186 418,207 372,224" fill="#FF6B3D"/>
  <rect x="206" y="238" width="100" height="38" rx="14" fill="#FF6B3D"/>
  <polygon points="151,278 361,278 324,328 188,328" fill="#FF6B3D"/>
  <polygon points="182,346 330,346 310,374 202,374" fill="#FF6B3D"/>
  <path d="M 270 282 L 200 352 L 340 190" fill="none" stroke="#121212" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>`;

/** The mark sits inside the central 60% so maskable crops never clip it. */
function page(size, scale) {
  const markSize = size * scale;
  return `<!doctype html><html><body style="margin:0;background:#FAF8F4">
    <div style="width:${size}px;height:${size}px;display:grid;place-items:center;background:#FAF8F4">
      <svg width="${markSize}" height="${markSize * (228 / 340)}" viewBox="92 160 340 228">${MARK}</svg>
    </div></body></html>`;
}

async function main() {
  const out = join(ROOT, 'public', 'icons');
  mkdirSync(out, { recursive: true });
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch();
  try {
    for (const [name, size, scale] of [
      ['maskable-512.png', 512, 0.6],
      ['apple-touch-icon.png', 180, 0.7],
    ]) {
      const ctx = await browser.newContext({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
      const p = await ctx.newPage();
      await p.setContent(page(size, scale));
      await p.screenshot({ path: join(out, name), clip: { x: 0, y: 0, width: size, height: size } });
      console.log('wrote', join('public', 'icons', name));
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
