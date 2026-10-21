// Dev-only: Lighthouse (mobile, simulated slow 4G + 4x CPU) against dist/,
// served with gzip like GitHub Pages. Lighthouse is not a project dependency:
//
//   npm install --no-save lighthouse
//   CHROME_PATH=/path/to/chrome node scripts/dev/lighthouse.mjs

import { serveDist } from './browser.mjs';

const chromePath = process.env.CHROME_PATH;
if (!chromePath) {
  console.error('Set CHROME_PATH to a Chrome or Chromium executable.');
  process.exit(1);
}

const { default: lighthouse } = await import('lighthouse');
const chromeLauncher = await import('chrome-launcher');

const PAGES = [
  ['Welcome / Today', '/'],
  ['Library', '/#/library'],
  ['Fallacy detail', '/#/library/fal_straw_man'],
  ['Progress', '/#/progress'],
];

const server = await serveDist(4191);
const chrome = await chromeLauncher.launch({ chromePath, chromeFlags: ['--headless', '--no-first-run'] });
let failed = false;
try {
  for (const [label, path] of PAGES) {
    const result = await lighthouse(`http://localhost:4191${path}`, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });
    const { categories, audits } = result.lhr;
    const score = (key) => Math.round((categories[key]?.score ?? 0) * 100);
    const metric = (key) => audits[key]?.displayValue ?? '?';
    console.log(
      `${label.padEnd(16)} performance ${score('performance')} · accessibility ${score('accessibility')} · best practices ${score('best-practices')} · SEO ${score('seo')}` +
        ` | FCP ${metric('first-contentful-paint')} · LCP ${metric('largest-contentful-paint')} · TBT ${metric('total-blocking-time')} · CLS ${metric('cumulative-layout-shift')}`,
    );
    for (const key of ['accessibility', 'best-practices', 'seo']) {
      const misses = categories[key].auditRefs
        .map((ref) => audits[ref.id])
        .filter((a) => a && a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'notApplicable' && a.scoreDisplayMode !== 'informative');
      for (const a of misses) console.log(`    ${key}: ${a.id} - ${a.title}`);
    }
    if (score('performance') < 90 || score('accessibility') < 100) failed = true;
  }
} finally {
  await chrome.kill();
  server.close();
}
process.exitCode = failed ? 1 : 0;
