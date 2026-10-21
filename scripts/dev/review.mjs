// Dev-only: slices a long page into viewport-height crops for close review.
//
//   PLAYWRIGHT_MODULE=... node scripts/dev/review.mjs <hash> <width>x<height> <light|dark> [--seed] [--motion]
//
// Without --motion the page renders with reduced motion, so scroll reveals
// never hide content in the crops. Output: docs/screenshots/dev/review/.

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadPlaywright, readBank, seedScript, seededProgress, startPreview } from './browser.mjs';

const [hash = '#/welcome', sizeArg = '390x844', theme = 'light'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const seed = process.argv.includes('--seed');
const motion = process.argv.includes('--motion');
const [width, height] = sizeArg.split('x').map(Number);
const OUT = join(ROOT, 'docs', 'screenshots', 'dev', 'review');

async function main() {
  mkdirSync(OUT, { recursive: true });
  const { chromium } = await loadPlaywright();
  const server = await startPreview(4181);
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width, height },
      colorScheme: theme,
      reducedMotion: motion ? 'no-preference' : 'reduce',
      serviceWorkers: 'block',
    });
    if (seed) await context.addInitScript(seedScript(seededProgress(readBank())));
    const page = await context.newPage();
    await page.goto(`${server.url}${hash}`);
    await page.waitForTimeout(800);
    // Fixed chrome would repeat in every slice; hide it for review only.
    await page.addStyleTag({ content: '.tabbar,.mobile-header,.topbar,.welcome-progress{position:static!important}' });
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const slug = hash.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
    let index = 0;
    for (let y = 0; y < total; y += height) {
      const file = join(OUT, `${slug}-${sizeArg}-${theme}-${String(index++).padStart(2, '0')}.png`);
      await page.screenshot({ path: file, fullPage: true, clip: { x: 0, y, width, height: Math.min(height, total - y) } });
      console.log('saved', file.replace(ROOT, ''));
    }
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
