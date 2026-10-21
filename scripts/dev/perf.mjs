// Dev-only: rough mobile load metrics under Lighthouse-like throttling
// (slow 4G: 150 ms RTT, 1.6 Mbps; 4x CPU). Serves dist/ with gzip so sizes
// match GitHub Pages.
//
//   PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/dev/perf.mjs

import { loadPlaywright, readBank, seedScript, seededProgress, serveDist } from './browser.mjs';

async function measure(browser, url, seed) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block' });
  if (seed) await context.addInitScript(seedScript(seededProgress(readBank())));
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const metrics = await page.evaluate(() => new Promise((resolve) => {
    const out = { fcp: 0, lcp: 0, cls: 0 };
    new PerformanceObserver((list) => { for (const e of list.getEntries()) if (e.name === 'first-contentful-paint') out.fcp = e.startTime; }).observe({ type: 'paint', buffered: true });
    new PerformanceObserver((list) => { const entries = list.getEntries(); out.lcp = entries[entries.length - 1].startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) out.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => resolve(out), 300);
  }));
  await context.close();
  return metrics;
}

const { chromium } = await loadPlaywright();
const server = await serveDist(4190);
const browser = await chromium.launch();
try {
  for (const [label, hash, seed] of [['Welcome (first visit)', '#/', false], ['Today (returning)', '#/', true], ['Library', '#/library', true]]) {
    const runs = [];
    for (let i = 0; i < 3; i++) runs.push(await measure(browser, `http://localhost:4190/${hash}`, seed));
    const med = (k) => runs.map((r) => r[k]).sort((a, b) => a - b)[1];
    console.log(`${label.padEnd(24)} FCP ${Math.round(med('fcp'))} ms · LCP ${Math.round(med('lcp'))} ms · CLS ${med('cls').toFixed(3)}`);
  }
} finally {
  await browser.close();
  server.close();
}
