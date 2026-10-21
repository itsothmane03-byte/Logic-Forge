// Dev-only real-browser verification (Chromium via Playwright) against dist/:
//   1. a scroll-reveal transition actually fires on Welcome
//   2. reducedMotion: 'reduce' -> everything visible and static
//   3. IntersectionObserver deleted before the app runs -> content still visible
//   4. a full keyboard-only Daily session (no mouse)
//   5. no console errors on any route
//   6. no horizontal scroll at 320px on any screen
//   7. sticky footers never cover the end of the page; focus handling basics
//   8. axe-core WCAG 2.2 A/AA audit of every screen (when axe-core is installed:
//      npm install --no-save axe-core)
//
//   PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/dev/verify.mjs

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { loadPlaywright, readBank, seedScript, seededProgress, startPreview, truthOf } from './browser.mjs';

const bank = readBank();
const nameOf = (id) => bank.fallacies.find((f) => f.id === id)?.name ?? id;
const results = [];
const consoleErrors = [];

function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` - ${detail}` : ''}`);
}

async function newPage(browser, options = {}, { seed = false, init } = {}) {
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 800 }, ...options });
  if (seed) await context.addInitScript(seedScript(seededProgress(bank)));
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  page.on('console', (msg) => msg.type() === 'error' && consoleErrors.push(`${page.url()}: ${msg.text()}`));
  page.on('pageerror', (err) => consoleErrors.push(`${page.url()}: ${err.message}`));
  return { context, page };
}

async function checkRevealFires(browser, base) {
  const { context, page } = await newPage(browser, { reducedMotion: 'no-preference' });
  await page.goto(`${base}#/welcome`);
  await page.waitForSelector('.hero__title');
  await page.waitForTimeout(300);
  const ready = await page.evaluate(() => document.documentElement.classList.contains('reveal-ready'));
  const heroVisible = await page.evaluate(() => {
    const op = (sel) => Number(getComputedStyle(document.querySelector(sel)).opacity);
    return op('.hero__title') === 1 && op('.hero__ctas') === 1;
  });
  const before = await page.$eval('.step-card', (el) => ({
    revealed: el.classList.contains('is-revealed'),
    opacity: getComputedStyle(el).opacity,
  }));
  await page.$eval('.step-card', (el) => {
    const top = el.getBoundingClientRect().top + window.scrollY - 200;
    window.scrollTo(0, top);
  });
  const samples = [];
  for (let i = 0; i < 14; i++) {
    samples.push(Number(await page.$eval('.step-card', (el) => getComputedStyle(el).opacity)));
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(600);
  const after = await page.$eval('.step-card', (el) => ({
    revealed: el.classList.contains('is-revealed'),
    opacity: getComputedStyle(el).opacity,
    transform: getComputedStyle(el).transform,
  }));
  const midway = samples.some((v) => v > 0.02 && v < 0.98);
  record('Reveal: html.reveal-ready is set when IntersectionObserver exists and motion is allowed', ready);
  record('Reveal: hero and primary call to action are visible immediately', heroVisible);
  record('Reveal: below-the-fold card starts hidden', !before.revealed && before.opacity === '0', JSON.stringify(before));
  record(
    'Reveal: scrolling fires a real opacity/transform transition',
    midway && after.revealed && after.opacity === '1' && after.transform === 'none',
    `samples ${samples.map((v) => v.toFixed(2)).join(' ')} -> ${JSON.stringify(after)}`,
  );
  await context.close();
}

async function checkStaticFallbacks(browser, base) {
  const scenarios = [
    { label: 'reducedMotion: reduce', options: { reducedMotion: 'reduce' } },
    {
      label: 'IntersectionObserver deleted before the app script',
      options: { reducedMotion: 'no-preference' },
      init: 'delete window.IntersectionObserver; delete window.IntersectionObserverEntry;',
    },
  ];
  for (const s of scenarios) {
    const { context, page } = await newPage(browser, s.options, { init: s.init });
    await page.goto(`${base}#/welcome`);
    await page.waitForSelector('.hero__title');
    await page.waitForTimeout(400);
    const state = await page.evaluate(() => {
      const els = [...document.querySelectorAll('[data-reveal]')];
      const hidden = els.filter((el) => {
        const cs = getComputedStyle(el);
        return Number(cs.opacity) < 1 || cs.transform !== 'none' || cs.visibility === 'hidden';
      });
      return {
        ready: document.documentElement.classList.contains('reveal-ready'),
        total: els.length,
        hidden: hidden.length,
        io: 'IntersectionObserver' in window,
      };
    });
    record(`Fallback (${s.label}): every [data-reveal] block visible and static`, !state.ready && state.total > 0 && state.hidden === 0, JSON.stringify(state));
    await context.close();
  }
}

async function tabTo(page, predicate, limit = 40) {
  for (let i = 0; i < limit; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(predicate)) return true;
  }
  return false;
}

async function checkKeyboardSession(browser, base) {
  const { context, page } = await newPage(browser, { reducedMotion: 'no-preference' });
  await page.goto(`${base}#/`);
  await page.waitForSelector('.hero__title');
  const reached = await tabTo(page, () => document.activeElement?.textContent?.trim() === "Start today's forge");
  record('Keyboard: Tab reaches "Start today\'s forge" on Welcome', reached);
  await page.keyboard.press('Enter');
  await page.waitForSelector('.spot');
  const plan = ['correct', 'correct', 'partial', 'correct', 'wrong', 'correct', 'correct', 'correct', 'wrong', 'correct'];
  let continueFocused = 0;
  let answered = 0;
  let arrowsTried = false;
  for (let q = 0; q < 10; q++) {
    const id = await page.getAttribute('.session-body', 'data-item-id');
    const truth = truthOf(bank, id);
    // The first flawed question after the second is answered with Tab + arrow keys.
    const useArrows = !arrowsTried && !truth.isSound && q >= 2;
    if (useArrows) arrowsTried = true;
    const kind = useArrows ? 'arrows' : plan[q];
    if (truth.isSound) {
      await page.keyboard.press(kind === 'wrong' ? 'f' : 's');
    } else if (kind === 'wrong') {
      await page.keyboard.press('s');
    } else {
      await page.keyboard.press('f');
      await page.waitForSelector('.options');
      const names = await page.$$eval('.option__name', (els) => els.map((e) => e.textContent));
      const right = names.indexOf(nameOf(truth.fallacyId));
      if (kind === 'arrows') {
        // Tab into the radio group, then use arrow keys to land on the answer.
        await tabTo(page, () => document.activeElement?.getAttribute('name') === 'answer', 10);
        await page.keyboard.press('Space');
        for (let i = 0; i < right; i++) await page.keyboard.press('ArrowRight');
        const checked = await page.$eval('input[name="answer"]:checked', (el) => el.closest('label').textContent);
        record('Keyboard: Tab into the options, arrow keys move the radio selection', checked.includes(nameOf(truth.fallacyId)), checked.slice(0, 40));
      } else {
        await page.keyboard.press(String(kind === 'correct' ? right + 1 : ((right + 1) % 4) + 1));
      }
      await page.keyboard.press('Enter');
    }
    await page.waitForSelector('.sheet');
    await page.waitForTimeout(80);
    const focused = await page.evaluate(() => document.activeElement?.textContent?.includes('Continue') || document.activeElement?.textContent?.includes('See results'));
    if (focused) continueFocused++;
    answered++;
    await page.keyboard.press('Enter');
    await page.waitForSelector(q < 9 ? '.spot' : '.summary-hero');
  }
  const summary = await page.evaluate(() => ({
    title: document.title,
    focus: document.activeElement?.tagName,
    score: document.querySelector('.ring')?.getAttribute('aria-label'),
  }));
  record('Keyboard: full 10-question Daily completed with keys only (S/F, 1-4, arrows, Enter)', answered === 10 && summary.title.startsWith('Summary'), JSON.stringify(summary));
  record('Keyboard: focus moves to Continue after every answer', continueFocused === 10, `${continueFocused}/10`);
  record('Keyboard: route change moves focus to the page heading', summary.focus === 'H1');
  // Shortcuts dialog: "?" opens, Esc closes and returns focus.
  await page.keyboard.press('?');
  const open = await page.evaluate(() => Boolean(document.querySelector('dialog[open]')));
  await page.keyboard.press('Escape');
  const closed = await page.evaluate(() => !document.querySelector('dialog[open]'));
  record('Keyboard: "?" opens the shortcuts dialog and Esc closes it', open && closed);
  await context.close();
}

const ROUTES = ['#/welcome', '#/', '#/library', '#/library/fal_straw_man', '#/progress', '#/about', '#/summary', '#/play/practice'];

async function checkNarrowAndErrors(browser, base) {
  const overflow = [];
  for (const theme of ['light', 'dark']) {
    const { context, page } = await newPage(browser, { viewport: { width: 320, height: 640 }, colorScheme: theme }, { seed: true });
    for (const hash of ROUTES) {
      await page.goto(`${base}${hash}`);
      await page.waitForTimeout(450);
      const w = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
      if (w > 320) overflow.push(`${hash} (${theme}): ${w}px`);
      if (hash === '#/play/practice') {
        // Name step and feedback sheet at 320px too.
        await page.keyboard.press('f');
        await page.waitForTimeout(300);
        const w2 = await page.evaluate(() => document.documentElement.scrollWidth);
        if (w2 > 320) overflow.push(`${hash} after F (${theme}): ${w2}px`);
      }
    }
    await context.close();
  }
  record('Layout: no horizontal scroll at 320px on any screen (light and dark)', overflow.length === 0, overflow.join('; '));
}

async function checkStickyFooter(browser, base) {
  const { context, page } = await newPage(browser, { viewport: { width: 390, height: 844 } }, { seed: true });
  await page.goto(`${base}#/library/fal_straw_man`);
  await page.waitForSelector('.detail-sticky');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(500);
  const geo = await page.evaluate(() => {
    const last = [...document.querySelectorAll('.detail__main .wild__toggle')].pop();
    const sticky = document.querySelector('.detail-sticky').getBoundingClientRect();
    const tabbar = document.querySelector('.tabbar').getBoundingClientRect();
    return { lastBottom: last.getBoundingClientRect().bottom, stickyTop: sticky.top, stickyBottom: sticky.bottom, tabTop: tabbar.top };
  });
  record(
    'Layout: at the end of the detail page, content clears the sticky CTA and the tab bar',
    geo.lastBottom <= geo.stickyTop && geo.stickyBottom <= geo.tabTop,
    JSON.stringify(geo),
  );
  await context.close();
}

function axeSource() {
  try {
    return readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
  } catch {
    return null;
  }
}

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function audit(page, label, source, found) {
  await page.addScriptTag({ content: source });
  const violations = await page.evaluate(async (tags) => {
    const result = await window.axe.run(document, { runOnly: { type: 'tag', values: tags } });
    return result.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, target: v.nodes[0]?.target?.join(' ') }));
  }, AXE_TAGS);
  for (const v of violations) found.push(`${label}: ${v.id} (${v.impact}, ${v.nodes} nodes, e.g. ${v.target})`);
}

async function checkAxe(browser, base) {
  const source = axeSource();
  if (!source) {
    console.log('SKIP  Accessibility audit (axe-core not installed)');
    return;
  }
  const found = [];
  let audited = 0;
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    for (const theme of ['light', 'dark']) {
      const tag = `${viewport.width}/${theme}`;
      const { context, page } = await newPage(browser, { viewport, colorScheme: theme, reducedMotion: 'reduce' }, { seed: true });
      for (const hash of ['#/welcome', '#/', '#/library', '#/library/fal_straw_man', '#/progress', '#/about']) {
        await page.goto(`${base}${hash}`);
        await page.waitForTimeout(350);
        await audit(page, `${hash} ${tag}`, source, found);
        audited++;
      }
      // Session states: Spot, Name, feedback sheet, side sheet, then Summary.
      await page.goto(`${base}#/play/daily`);
      await page.waitForSelector('.spot');
      await audit(page, `spot ${tag}`, source, found);
      for (let q = 0; q < 10; q++) {
        const truth = truthOf(bank, await page.getAttribute('.session-body', 'data-item-id'));
        if (truth.isSound) {
          await page.keyboard.press('s');
        } else {
          await page.keyboard.press('f');
          await page.waitForSelector('.options');
          if (q < 3) await audit(page, `name ${tag}`, source, found);
          await page.keyboard.press('2');
          await page.keyboard.press('Enter');
        }
        await page.waitForSelector('.sheet');
        if (q < 3) await audit(page, `feedback ${tag}`, source, found);
        if (q === 0) {
          await page.click('.answer-link');
          await page.waitForSelector('dialog[open]');
          await audit(page, `fallacy side sheet ${tag}`, source, found);
          await page.keyboard.press('Escape');
          // Focus is back on the button that opened the sheet; continue explicitly.
          await page.click('.sheet__actions .btn');
        } else {
          await page.keyboard.press('Enter');
        }
        await page.waitForSelector(q < 9 ? '.spot' : '.summary-hero');
      }
      await audit(page, `summary ${tag}`, source, found);
      await page.keyboard.press('?');
      await audit(page, `shortcuts dialog ${tag}`, source, found);
      audited += 9;
      await context.close();
    }
  }
  record(`Accessibility: axe-core WCAG 2.2 A/AA audit of ${audited} screen states (light, dark, 390 and 1280)`, found.length === 0, found.slice(0, 12).join('; '));
}

async function main() {
  const { chromium } = await loadPlaywright();
  const server = await startPreview(4182);
  const browser = await chromium.launch();
  try {
    await checkRevealFires(browser, server.url);
    await checkStaticFallbacks(browser, server.url);
    await checkKeyboardSession(browser, server.url);
    await checkNarrowAndErrors(browser, server.url);
    await checkStickyFooter(browser, server.url);
    await checkAxe(browser, server.url);
  } finally {
    await browser.close();
    await server.close();
  }
  record('Console: no errors or uncaught exceptions on any route', consoleErrors.length === 0, consoleErrors.slice(0, 5).join(' | '));
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
