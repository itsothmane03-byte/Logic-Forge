// Validates authored content and writes the committed src/data/bank.json.
//
//   npm run content                                   real content, strict (CI gate)
//   node scripts/build-bank.mjs --allow-partial       while content is being written
//   node scripts/build-bank.mjs --fixtures --allow-partial   dev bank from content/fixtures/
//
// Nothing is written when validation fails.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { FAMILIES } from './canonical.mjs';
import { ROOT, parseArgs, runValidation } from './validate-content.mjs';

export const BANK_PATH = join(ROOT, 'src', 'data', 'bank.json');

const FALLACY_FIELDS = [
  'id', 'name', 'aliases', 'family', 'difficulty', 'shortDef', 'definition',
  'howToSpot', 'classicExample', 'legitimateVersion', 'confusableWith', 'contrast',
];
const ITEM_FIELDS = [
  'id', 'fallacyId', 'isSound', 'resembles', 'difficulty', 'format', 'source',
  'title', 'passage', 'cue', 'explanation', 'whyNot', 'tags', 'backgroundKnowledge',
];

const pick = (obj, fields) => Object.fromEntries(fields.map((k) => [k, obj[k]]));

/** Local date as YYYY-MM-DD. */
export function buildDate(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Builds the bank object: fallacies sorted by family order then name,
 * items sorted by id. Items whose fallacy is not in the bank are dropped.
 */
export function buildBank({ fallacies, items }, version) {
  const order = new Map(FAMILIES.map((f) => [f.id, f.order]));
  const sortedFallacies = [...fallacies]
    .sort((a, b) => (order.get(a.family) ?? 99) - (order.get(b.family) ?? 99) || a.name.localeCompare(b.name, 'en'))
    .map((f) => pick(f, FALLACY_FIELDS));
  const present = new Set(sortedFallacies.map((f) => f.id));
  const sortedItems = items
    .filter((i) => present.has(i.isSound ? i.resembles : i.fallacyId))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((i) => pick(i, ITEM_FIELDS));
  return {
    version,
    fallacies: sortedFallacies,
    items: sortedItems,
    families: FAMILIES.map((f) => ({ id: f.id, label: f.label, order: f.order })),
  };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const result = runValidation(opts);
  if (result.errors.length) {
    console.error(`\nNot writing ${'src/data/bank.json'}: fix the errors above and run again.`);
    process.exitCode = 1;
    return;
  }
  const bank = buildBank(result, buildDate());
  mkdirSync(dirname(BANK_PATH), { recursive: true });
  writeFileSync(BANK_PATH, `${JSON.stringify(bank, null, 2)}\n`, 'utf8');
  const source = opts.fixtures ? 'content/fixtures (dev fixtures)' : 'content';
  console.log(`\nWrote src/data/bank.json · ${bank.fallacies.length} fallacies · ${bank.items.length} items · from ${source} · version ${bank.version}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
