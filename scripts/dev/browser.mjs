// Dev-only helpers for browser checks: serve dist/ with `vite preview` and
// launch Chromium through Playwright.
//
// Playwright is not a project dependency. Point PLAYWRIGHT_MODULE at an
// installed copy (e.g. .../node_modules/playwright/index.mjs) or install it.

import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { createGzip } from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { preview } from 'vite';

export const ROOT = fileURLToPath(new URL('../..', import.meta.url));

export async function loadPlaywright() {
  const custom = process.env.PLAYWRIGHT_MODULE;
  const specifier = custom ? pathToFileURL(custom).href : 'playwright';
  try {
    return await import(specifier);
  } catch (error) {
    throw new Error(`Could not load Playwright from "${specifier}". Set PLAYWRIGHT_MODULE. (${error.message})`);
  }
}

/** Starts `vite preview` on dist/. Returns { url, close }. */
export async function startPreview(port = 4173) {
  const server = await preview({ root: ROOT, logLevel: 'silent', preview: { port, strictPort: false, open: false } });
  const address = server.resolvedUrls?.local?.[0] ?? `http://localhost:${port}/`;
  return { url: address, close: () => new Promise((resolve) => server.httpServer.close(resolve)) };
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

/** Serves dist/ with gzip (like GitHub Pages) for performance measurements. */
export function serveDist(port) {
  const dist = join(ROOT, 'dist');
  const server = createServer((req, res) => {
    const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
    let file = join(dist, path === '/' ? 'index.html' : path);
    if (!existsSync(file) || statSync(file).isDirectory()) {
      // Like GitHub Pages: missing files are 404s (the app uses hash routes).
      if (path !== '/' && extname(path)) {
        res.writeHead(404, { 'content-type': 'text/plain' });
        res.end('Not found');
        return;
      }
      file = join(dist, 'index.html');
    }
    const type = TYPES[extname(file)] ?? 'application/octet-stream';
    const compress = /text|javascript|json|svg|manifest/.test(type);
    res.writeHead(200, { 'content-type': type, ...(compress ? { 'content-encoding': 'gzip' } : {}) });
    const stream = createReadStream(file);
    (compress ? stream.pipe(createGzip()) : stream).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

export function readBank() {
  return JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'bank.json'), 'utf8'));
}

const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Realistic seeded progress for screenshots: ~6 weeks of practice history,
 * mixed mastery, a few recent misses, a running streak.
 */
export function seededProgress(bank, now = new Date()) {
  const days = {};
  const sessions = [];
  const attempts = [];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let back = 70; back >= 1; back--) {
    const day = new Date(today);
    day.setDate(day.getDate() - back);
    const active = back <= 6 || (back * 7) % 10 < 6;
    if (!active) continue;
    const count = [4, 10, 10, 12, 20, 10, 6, 22][back % 8];
    days[keyOf(day)] = count;
    const correct = Math.min(count, Math.round(count * (0.5 + ((70 - back) / 70) * 0.35)));
    sessions.push({ mode: back % 3 ? 'daily' : 'practice', at: day.getTime() + 18 * 3600e3, total: 10, correct: Math.round((correct / count) * 10) });
  }
  const items = bank.items;
  const outcomes = ['correct', 'correct', 'partial', 'correct', 'wrong', 'correct'];
  items.slice(0, 18).forEach((item, i) => {
    attempts.push({ itemId: item.id, outcome: outcomes[i % outcomes.length], at: today.getTime() - (18 - i) * 3600e3, mode: 'practice' });
  });
  const boxes = {};
  const stats = {};
  bank.fallacies.forEach((f, i) => {
    boxes[f.id] = [3, 2, 5, 4, 1, 3][i % 6];
    stats[f.id] = { seen: 8 + i * 3, correct: 5 + i * 2 };
  });
  return {
    version: 1,
    settings: { theme: 'system', showDefinitions: true },
    onboarded: true,
    boxes,
    stats,
    soundStats: { seen: 14, correct: 11 },
    attempts,
    days,
    daily: {},
    sessions: sessions.slice(-60),
    bestStreak: 9,
  };
}

/** Context init script that writes progress into localStorage before load. */
export function seedScript(progress) {
  return `try { localStorage.setItem('fallacyforge:v1', ${JSON.stringify(JSON.stringify(progress))}); } catch (e) {}`;
}

/** The correct Name-step answer for an item id (null for sound items). */
export function truthOf(bank, itemId) {
  const item = bank.items.find((i) => i.id === itemId);
  return item ? { isSound: item.isSound, fallacyId: item.fallacyId } : null;
}
