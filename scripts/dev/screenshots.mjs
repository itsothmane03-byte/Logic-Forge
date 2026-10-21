// Dev-only: captures every main screen at 390x844 and 1280x800, light and dark,
// into docs/screenshots/dev/. Requires a fresh `vite build` and Playwright:
//
//   PLAYWRIGHT_MODULE=/path/to/node_modules/playwright/index.mjs node scripts/dev/screenshots.mjs [filter] [--full]
//
// --full captures whole pages (reduced motion, so reveals never hide content)
// into docs/screenshots/dev/full/ for review.

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadPlaywright, readBank, seedScript, seededProgress, startPreview, truthOf } from './browser.mjs';

const FULL = process.argv.includes('--full');
const OUT = join(ROOT, 'docs', 'screenshots', 'dev', ...(FULL ? ['full'] : []));
const SIZES = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 800 },
];
const THEMES = ['light', 'dark'];
const filter = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? '';

const bank = readBank();
const nameOf = (id) => bank.fallacies.find((f) => f.id === id)?.name ?? id;

async function settle(page, ms = 700) {
  await page.waitForTimeout(ms);
}

async function currentItem(page) {
  const id = await page.getAttribute('.session-body', 'data-item-id');
  return { id, truth: truthOf(bank, id) };
}

/** Answers the current question. kind: 'correct' | 'partial' | 'wrong'. */
async function answer(page, kind) {
  const { truth } = await currentItem(page);
  if (!truth) throw new Error('No current item');
  if (truth.isSound) {
    await page.keyboard.press(kind === 'correct' ? 's' : 'f');
  } else if (kind === 'wrong') {
    await page.keyboard.press('s');
  } else {
    await page.keyboard.press('f');
    await page.waitForSelector('.options');
    const names = await page.$$eval('.option__name', (els) => els.map((e) => e.textContent));
    const right = names.indexOf(nameOf(truth.fallacyId));
    const index = kind === 'correct' ? right : (right + 1) % names.length;
    await page.keyboard.press(String(index + 1));
    await page.keyboard.press('Enter');
  }
  await page.waitForSelector('.sheet');
}

async function shoot(page, name, size, theme) {
  const file = join(OUT, `${name}-${size.width}x${size.height}-${theme}.png`);
  await page.screenshot({ path: file, fullPage: FULL });
  console.log('  saved', file.replace(ROOT, ''));
}

const SCENARIOS = {
  async welcome(page, base) {
    await page.goto(`${base}#/`);
    await page.waitForSelector('.hero__title');
    await settle(page);
    return [['welcome']];
  },
  async today(page, base) {
    await page.goto(`${base}#/`);
    await page.waitForSelector('.daily-hero');
    await settle(page);
    return [['today']];
  },
  async session(page, base, ctx) {
    await page.goto(`${base}#/play/daily`);
    await page.waitForSelector('.spot');
    // Advance to the first flawed item so the Name step can follow.
    for (let i = 0; i < 9; i++) {
      const { truth } = await currentItem(page);
      if (truth && !truth.isSound) break;
      await answer(page, 'correct');
      await page.keyboard.press('Enter');
      await page.waitForSelector('.spot');
    }
    await settle(page, 500);
    await ctx.shoot('session-spot');
    await page.keyboard.press('f');
    await page.waitForSelector('.options');
    await page.keyboard.press('2');
    await settle(page, 400);
    await ctx.shoot('session-name');
    const { truth } = await currentItem(page);
    const names = await page.$$eval('.option__name', (els) => els.map((e) => e.textContent));
    await page.keyboard.press(String(names.indexOf(nameOf(truth.fallacyId)) + 1));
    await page.keyboard.press('Enter');
    await page.waitForSelector('.sheet');
    await settle(page, 900);
    await ctx.shoot('session-feedback');
    // Finish the set with a realistic mix for the summary.
    const plan = ['correct', 'partial', 'correct', 'wrong', 'correct', 'correct', 'partial', 'correct', 'correct', 'wrong'];
    let guard = 0;
    while (guard++ < 12) {
      await page.keyboard.press('Enter');
      const done = await page.waitForSelector('.spot, .summary-hero', { timeout: 5000 });
      if ((await done.getAttribute('class'))?.includes('summary-hero')) break;
      await answer(page, plan[guard % plan.length]);
    }
    await page.waitForSelector('.summary-hero');
    await settle(page, 1200);
    await ctx.shoot('summary');
    return [];
  },
  async library(page, base) {
    await page.goto(`${base}#/library`);
    await page.waitForSelector('.lib-card');
    await settle(page);
    return [['library']];
  },
  async detail(page, base) {
    await page.goto(`${base}#/library/${bank.fallacies.find((f) => f.id === 'fal_straw_man')?.id ?? bank.fallacies[0].id}`);
    await page.waitForSelector('.detail-hero__title');
    await settle(page);
    return [['detail']];
  },
  async progress(page, base) {
    await page.goto(`${base}#/progress`);
    await page.waitForSelector('.stat-row');
    await settle(page);
    return [['progress']];
  },
  async dialogs(page, base, ctx) {
    await page.goto(`${base}#/play/practice`);
    await page.waitForSelector('.spot');
    await answer(page, 'correct');
    await page.click('.answer-link');
    await page.waitForSelector('dialog[open]');
    await settle(page, 500);
    await ctx.shoot('dialog-fallacy-sheet');
    await page.keyboard.press('Escape');
    await page.goto(`${base}#/about`);
    await page.waitForSelector('.about-head');
    await page.keyboard.press('?');
    await page.waitForSelector('dialog[open]');
    await settle(page, 400);
    await ctx.shoot('dialog-shortcuts');
    return [];
  },
};

async function main() {
  mkdirSync(OUT, { recursive: true });
  const { chromium } = await loadPlaywright();
  const server = await startPreview(4180);
  const browser = await chromium.launch();
  const errors = [];
  try {
    for (const size of SIZES) {
      for (const theme of THEMES) {
        for (const [name, run] of Object.entries(SCENARIOS)) {
          if (filter && !name.includes(filter)) continue;
          const context = await browser.newContext({
            viewport: { width: size.width, height: size.height },
            colorScheme: theme,
            deviceScaleFactor: 1,
            serviceWorkers: 'block',
            reducedMotion: FULL ? 'reduce' : 'no-preference',
          });
          if (name !== 'welcome') await context.addInitScript(seedScript(seededProgress(bank)));
          const page = await context.newPage();
          page.on('console', (msg) => msg.type() === 'error' && errors.push(`${name}/${size.name}/${theme}: ${msg.text()}`));
          page.on('pageerror', (err) => errors.push(`${name}/${size.name}/${theme}: ${err.message}`));
          const ctx = { shoot: (shotName) => shoot(page, shotName, size, theme) };
          console.log(`${name} · ${size.name} · ${theme}`);
          const shots = await run(page, server.url, ctx);
          for (const [shotName] of shots) await shoot(page, shotName, size, theme);
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
  if (errors.length) {
    console.error(`\nConsole errors (${errors.length}):\n${errors.join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log('\nNo console errors.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
