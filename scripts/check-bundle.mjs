// Bundle budget check: the app's JavaScript must be
// 150 KB gzip or less, excluding the generated question bank chunk.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ASSETS = join(ROOT, 'dist', 'assets');
const BUDGET_KB = 150;

const kb = (bytes) => bytes / 1024;
const gz = (path) => gzipSync(readFileSync(path), { level: 9 }).length;

let files;
try {
  files = readdirSync(ASSETS);
} catch {
  console.error('dist/assets not found. Run `vite build` first.');
  process.exit(1);
}

const rows = files
  .filter((name) => /\.(js|css)$/.test(name))
  .map((name) => {
    const path = join(ASSETS, name);
    return { name, raw: statSync(path).size, gzip: gz(path), bank: /^bank-/.test(name), css: name.endsWith('.css') };
  })
  .sort((a, b) => b.gzip - a.gzip);

const appJs = rows.filter((r) => !r.css && !r.bank);
const bankJs = rows.filter((r) => r.bank);
const css = rows.filter((r) => r.css);
const sum = (list) => list.reduce((n, r) => n + r.gzip, 0);

console.log('\nBundle sizes (gzip, level 9)');
for (const r of rows) {
  const label = r.bank ? 'bank' : r.css ? 'css' : 'app';
  console.log(`  ${label.padEnd(5)} ${r.name.padEnd(36)} ${kb(r.raw).toFixed(1).padStart(8)} KB raw ${kb(r.gzip).toFixed(1).padStart(7)} KB gzip`);
}
const appTotal = kb(sum(appJs));
console.log(`\n  App JS (excluding bank): ${appTotal.toFixed(1)} KB gzip · budget ${BUDGET_KB} KB`);
console.log(`  Bank JS: ${kb(sum(bankJs)).toFixed(1)} KB gzip · CSS: ${kb(sum(css)).toFixed(1)} KB gzip`);

if (bankJs.length === 0) {
  console.error('\n✗ No bank chunk found; the bank must stay in its own chunk so the budget excludes it.');
  process.exit(1);
}
if (appTotal > BUDGET_KB) {
  console.error(`\n✗ App JS is over budget by ${(appTotal - BUDGET_KB).toFixed(1)} KB.`);
  process.exit(1);
}
console.log('\n✓ Within budget');
