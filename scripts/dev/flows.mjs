// Dev-only functional QA of secondary flows in a real browser (Chromium):
// first run + "Try one", Daily done state + share, Focus and Review modes,
// library search and filters, theme persistence, export / import / reset.
//
//   PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/dev/flows.mjs

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadPlaywright, readBank, seedScript, seededProgress, startPreview, truthOf } from './browser.mjs';

const bank = readBank();
const OUT = join(ROOT, 'docs', 'screenshots', 'dev', 'flows');
// Scratch files (export/import fixtures) go to a gitignored cache, not docs/.
const TMP = join(ROOT, 'node_modules', '.cache', 'fallacy-forge-qa');
const results = [];
const errors = [];

function record(name, pass, detail = '') {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` - ${detail}` : ''}`);
}

async function open(browser, { seed = false, viewport = { width: 1280, height: 800 }, permissions = [] } = {}) {
  const context = await browser.newContext({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce', acceptDownloads: true });
  if (permissions.length) await context.grantPermissions(permissions);
  if (seed) await context.addInitScript(seedScript(seededProgress(bank)));
  const page = await context.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return { context, page };
}

async function playDaily(page, base) {
  await page.goto(`${base}#/play/daily`);
  for (let q = 0; q < 10; q++) {
    await page.waitForSelector('.spot');
    const truth = truthOf(bank, await page.getAttribute('.session-body', 'data-item-id'));
    await page.keyboard.press(truth.isSound ? 's' : 'f');
    if (!truth.isSound) {
      await page.waitForSelector('.options');
      await page.keyboard.press('1');
      await page.keyboard.press('Enter');
    }
    await page.waitForSelector('.sheet');
    await page.keyboard.press('Enter');
  }
  await page.waitForSelector('.summary-hero');
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(TMP, { recursive: true });
  const { chromium } = await loadPlaywright();
  const server = await startPreview(4183);
  const base = server.url;
  const browser = await chromium.launch();
  try {
    // 1. First run: Welcome at #/, then Today shows the How it works card; "Try one" runs a 1-question demo.
    {
      const { context, page } = await open(browser, { viewport: { width: 390, height: 844 } });
      await page.goto(`${base}#/`);
      await page.waitForSelector('.hero__title');
      record('First visit: #/ shows the Welcome page', (await page.title()).startsWith('Welcome'));
      await page.click('.tabbar a[href="#/"]');
      await page.waitForSelector('.howto');
      record('First run: Today shows the dismissible How it works card', true);
      await page.screenshot({ path: join(OUT, 'today-first-run-390.png') });
      await page.click('.howto a[href="#/play/demo"]');
      await page.waitForSelector('.spot');
      const total = await page.textContent('.session-top__count');
      await page.keyboard.press('f');
      await page.waitForSelector('.options');
      await page.keyboard.press('1');
      await page.keyboard.press('Enter');
      await page.waitForSelector('.sheet');
      await page.keyboard.press('Enter');
      await page.waitForSelector('.today-head');
      const toast = await page.textContent('.toast-region');
      const cardGone = (await page.$('.howto')) === null;
      record('"Try one": a 1-question demo, then back to Today with a toast and onboarding done', total?.trim() === '1 / 1' && toast.includes('whole loop') && cardGone, `${total?.trim()} | ${toast.trim()}`);
      await context.close();
    }

    // 2. Daily done: Today shows Done n/10, Share copies the grid, countdown appears; Done opens the summary.
    {
      const { context, page } = await open(browser, { seed: true, permissions: ['clipboard-read', 'clipboard-write'] });
      await playDaily(page, base);
      await page.goto(`${base}#/`);
      await page.waitForSelector('.daily-hero--done');
      const label = await page.textContent('.daily-hero__actions .btn--primary');
      const next = await page.textContent('.daily-hero__next');
      await page.screenshot({ path: join(OUT, 'today-done-1280.png') });
      await page.click('.daily-hero__actions button:has-text("Share")');
      await page.waitForTimeout(300);
      const clip = await page.evaluate(() => navigator.clipboard.readText());
      const toast = await page.textContent('.toast-region');
      record('Daily done: Today shows "Done n/10" and the next-forge countdown', /Done \d+\/10/.test(label) && /Next forge in/.test(next), `${label.trim()} | ${next.trim()}`);
      record('Share copies the UI-SPEC share text and toasts "Copied"', /^Fallacy Forge #\d+ · \d+\/10\r?\n[🟩🟨🟥]{10}\r?\nhttps:\/\/itsothmane03-byte\.github\.io\/Logic-Forge\/$/u.test(clip) && toast.includes('Copied'), JSON.stringify(clip));
      await page.click('.daily-hero__actions .btn--primary');
      await page.waitForSelector('.summary-hero');
      record('"Done" reopens today\'s summary', (await page.title()).startsWith('Summary'));
      await page.goto(`${base}#/play/daily`);
      await page.waitForSelector('.summary-hero');
      record('Re-entering a finished Daily goes to its summary', true);
      await context.close();
    }

    // 3. Focus mode from the detail page; Review mode from Today.
    {
      const { context, page } = await open(browser, { seed: true });
      await page.goto(`${base}#/library/fal_sunk_cost`);
      await page.click('.detail-cta a');
      await page.waitForSelector('.spot');
      const ids = [];
      for (let q = 0; q < 10; q++) {
        const id = await page.getAttribute('.session-body', 'data-item-id');
        ids.push(id);
        await page.keyboard.press('s');
        await page.waitForSelector('.sheet');
        await page.keyboard.press('Enter');
        await page.waitForSelector(q < 9 ? '.spot' : '.summary-hero');
      }
      const own = ids.filter((id) => bank.items.find((i) => i.id === id)?.fallacyId === 'fal_sunk_cost').length;
      record('Focus mode: 10 questions, 6 of the chosen fallacy', ids.length === 10 && own === 6, `${own}/10 sunk cost`);
      await page.goto(`${base}#/`);
      await page.click('a[href="#/play/review"]');
      await page.waitForSelector('.spot');
      const eyebrow = await page.textContent('.session-eyebrow__mode');
      await page.click('.session-top__close');
      const asked = await page.$('dialog[open]');
      record('Review mode starts from Today; closing before answering needs no confirmation', eyebrow.includes('Review') && asked === null);
      await page.goto(`${base}#/play/practice`);
      await page.waitForSelector('.spot');
      await page.keyboard.press('s');
      await page.waitForSelector('.sheet');
      await page.click('.session-top__close');
      await page.waitForSelector('dialog[open]');
      const confirmText = await page.textContent('dialog[open]');
      await page.click('dialog[open] button:has-text("Keep going")');
      record('Closing Practice mid-set asks to confirm; "Keep going" stays in the session', confirmText.includes('Leave this set') && (await page.$('.session')) !== null);
      await context.close();
    }

    // 4. Library: "/" focuses search, alias and accent-insensitive search, empty state, filters.
    {
      const { context, page } = await open(browser, { seed: true });
      await page.goto(`${base}#/library`);
      await page.waitForSelector('.lib-card');
      await page.keyboard.press('/');
      const focused = await page.evaluate(() => document.activeElement?.id === 'library-search');
      await page.keyboard.type('whataboutism');
      const names = await page.$$eval('.lib-card__name', (els) => els.map((e) => e.textContent));
      await page.fill('#library-search', 'STRÄW');
      const accent = await page.$$eval('.lib-card__name', (els) => els.map((e) => e.textContent));
      await page.fill('#library-search', 'xyz');
      const empty = await page.textContent('.library-empty');
      await page.fill('#library-search', '');
      await page.click('.filters__group button:has-text("Language & parts")');
      const lang = await page.$$eval('.lib-card', (els) => els.length);
      await page.click('.filters__group button:has-text("Advanced")');
      const langAdvanced = await page.$$eval('.lib-card__name', (els) => els.map((e) => e.textContent));
      record('Library: "/" focuses search', focused);
      record('Library: alias search ("whataboutism" -> Tu Quoque)', names.length === 1 && names[0] === 'Tu Quoque', names.join(', '));
      record('Library: case- and accent-insensitive search ("STRÄW" -> Straw Man)', accent.includes('Straw Man'), accent.join(', '));
      record('Library: empty search message', empty.includes('No fallacy matches “xyz”') && empty.includes('whataboutism'), empty.trim());
      record('Library: family + difficulty filters combine', lang === 4 && langAdvanced.length === 3, `${lang} language, advanced: ${langAdvanced.join(', ')}`);
      await context.close();
    }

    // 5. Theme persistence; export, import (valid + invalid) and reset.
    // Seed once (an init script would re-seed on every reload).
    {
      const { context, page } = await open(browser);
      await page.goto(`${base}#/progress`);
      await page.evaluate(seedScript(seededProgress(bank)));
      await page.reload();
      await page.waitForSelector('.stat-row');
      await page.click('.segmented__option:has-text("Dark")');
      await page.reload();
      await page.waitForSelector('.stat-row');
      const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      record('Theme: Dark persists across reloads (applied before paint)', theme === 'dark');
      const [download] = await Promise.all([page.waitForEvent('download'), page.click('button:has-text("Export")')]);
      const file = join(TMP, 'export.json');
      await download.saveAs(file);
      const exported = JSON.parse(readFileSync(file, 'utf8'));
      record('Export downloads a version-1 JSON backup', exported.version === 1 && Array.isArray(exported.attempts), download.suggestedFilename());
      await page.click('button:has-text("Reset")');
      await page.click('dialog[open] button:has-text("Reset everything")');
      await page.waitForTimeout(200);
      const afterReset = await page.textContent('.stat__value');
      record('Reset clears progress after confirmation', afterReset.trim() === '0', `questions answered: ${afterReset}`);
      const bad = join(TMP, 'bad.json');
      writeFileSync(bad, '{"version": 9}');
      await page.setInputFiles('input[type="file"]', bad);
      await page.waitForSelector('.form-error');
      record('Import rejects an invalid file with a clear error', (await page.textContent('.form-error')).includes('version'));
      await page.setInputFiles('input[type="file"]', file);
      await page.waitForSelector('dialog[open]');
      await page.click('dialog[open] button:has-text("Replace")');
      await page.waitForTimeout(200);
      const restored = await page.textContent('.stat__value');
      record('Import restores a valid export after confirmation', Number(restored) > 0, `questions answered: ${restored}`);
      await context.close();
    }
  } finally {
    await browser.close();
    await server.close();
  }
  record('Console: no errors during the flows', errors.length === 0, errors.slice(0, 3).join(' | '));
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} flow checks passed`);
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
