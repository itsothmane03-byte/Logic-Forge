// Validates the authored question bank against CONTENT-SPEC section 4.
//
//   node scripts/validate-content.mjs                  real content, strict
//   node scripts/validate-content.mjs --allow-partial  skip completeness checks
//   node scripts/validate-content.mjs --fixtures       dev fixtures in content/fixtures/
//
// The same functions are used by build-bank.mjs and by tests/content.test.ts.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  FALLACIES,
  FALLACY_BY_ID,
  FAMILIES,
  FORMATS,
  LIMITS,
  TAGS,
  TITLE_FORMATS,
  slugOf,
} from './canonical.mjs';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));

const FALLACY_KEYS = [
  'id', 'name', 'aliases', 'family', 'difficulty', 'shortDef', 'definition',
  'howToSpot', 'classicExample', 'legitimateVersion', 'confusableWith', 'contrast',
];
const ITEM_KEYS = [
  'id', 'fallacyId', 'isSound', 'resembles', 'difficulty', 'format', 'source',
  'title', 'passage', 'cue', 'explanation', 'whyNot', 'tags',
];
const CHAT_LINE = /^[^:\n]{1,40}: \S/;

/** @param {string[]} argv */
export function parseArgs(argv) {
  return {
    fixtures: argv.includes('--fixtures'),
    allowPartial: argv.includes('--allow-partial'),
  };
}

/** @param {{ fixtures: boolean }} opts */
export function contentDir(opts) {
  return opts.fixtures ? join(ROOT, 'content', 'fixtures') : join(ROOT, 'content');
}

/**
 * Reads every JSON file in `<dir>/fallacies` and `<dir>/items`.
 * Parse errors are kept on the file record so they can be reported.
 * @param {string} dir
 */
export function loadContent(dir) {
  const read = (sub) => {
    const folder = join(dir, sub);
    if (!existsSync(folder)) return [];
    return readdirSync(folder)
      .filter((name) => name.endsWith('.json'))
      .sort()
      .map((name) => {
        const path = join(folder, name);
        const label = relative(ROOT, path).split('\\').join('/');
        try {
          const text = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
          return { name, label, data: JSON.parse(text) };
        } catch (error) {
          return { name, label, error: error instanceof Error ? error.message : String(error) };
        }
      });
  };
  return { fallacyFiles: read('fallacies'), itemFiles: read('items') };
}

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim().length > 0;
const wordCount = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const sameList = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

function createReporter() {
  const errors = [];
  const warnings = [];
  return {
    errors,
    warnings,
    error: (where, message) => errors.push(`${where} › ${message}`),
    warn: (where, message) => warnings.push(`${where} › ${message}`),
  };
}

function checkKeys(r, where, obj, allowed) {
  for (const key of allowed) {
    if (!(key in obj)) r.error(where, `missing field "${key}"`);
  }
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) r.error(where, `unknown field "${key}"`);
  }
}

function checkText(r, where, value, field, max) {
  if (!isText(value)) {
    r.error(where, `${field}: must be a non-empty string`);
    return false;
  }
  if (max !== undefined && value.length > max) {
    r.error(where, `${field}: ${value.length} characters (max ${max})`);
  }
  if (value !== value.trim()) r.warn(where, `${field}: has leading or trailing whitespace`);
  return true;
}

function validateFallacy(r, file, seenIds, seenNames) {
  const where = file.label;
  const f = file.data;
  if (!isObject(f)) {
    r.error(where, 'must contain one JSON object');
    return null;
  }
  checkKeys(r, where, f, FALLACY_KEYS);
  const expectedId = file.name.replace(/\.json$/, '');
  const canon = FALLACY_BY_ID.get(f.id);
  if (f.id !== expectedId) r.error(where, `id "${f.id}" must match the file name "${expectedId}"`);
  if (!canon) {
    r.error(where, `unknown fallacy id "${f.id}"`);
    return null;
  }
  if (seenIds.has(f.id)) r.error(where, `duplicate fallacy id "${f.id}"`);
  seenIds.add(f.id);

  if (checkText(r, where, f.name, 'name', 60)) {
    if (seenNames.has(f.name)) r.error(where, `duplicate fallacy name "${f.name}"`);
    seenNames.add(f.name);
  }
  if (!Array.isArray(f.aliases) || !f.aliases.every(isText)) {
    r.error(where, 'aliases: must be an array of non-empty strings');
  }
  if (f.family !== canon.family) r.error(where, `family: "${f.family}" (expected "${canon.family}")`);
  if (f.difficulty !== canon.difficulty) {
    r.error(where, `difficulty: "${f.difficulty}" (expected "${canon.difficulty}")`);
  }
  checkText(r, where, f.shortDef, 'shortDef', LIMITS.shortDef);
  checkText(r, where, f.definition, 'definition', LIMITS.definition);
  checkText(r, where, f.classicExample, 'classicExample', LIMITS.classicExample);
  checkText(r, where, f.legitimateVersion, 'legitimateVersion', LIMITS.legitimateVersion);

  if (!Array.isArray(f.howToSpot) || f.howToSpot.length !== LIMITS.howToSpotCount) {
    r.error(where, `howToSpot: must have exactly ${LIMITS.howToSpotCount} tips`);
  } else {
    f.howToSpot.forEach((tip, i) => checkText(r, where, tip, `howToSpot[${i}]`, LIMITS.howToSpotTip));
  }

  if (!Array.isArray(f.confusableWith) || !sameList(f.confusableWith, canon.confusableWith)) {
    r.error(where, `confusableWith: must be exactly [${canon.confusableWith.join(', ')}] in this order`);
  }
  if (!isObject(f.contrast)) {
    r.error(where, 'contrast: must be an object keyed by confusable id');
  } else {
    const keys = Object.keys(f.contrast);
    const missing = canon.confusableWith.filter((id) => !keys.includes(id));
    const extra = keys.filter((id) => !canon.confusableWith.includes(id));
    if (missing.length) r.error(where, `contrast: missing entries for ${missing.join(', ')}`);
    if (extra.length) r.error(where, `contrast: unexpected keys ${extra.join(', ')}`);
    for (const key of keys) checkText(r, where, f.contrast[key], `contrast.${key}`, LIMITS.contrast);
  }
  return f;
}

function validateItem(r, file, fallacyId, item, index, seenItemIds) {
  const slug = slugOf(fallacyId);
  const where = `${file.label} › ${isObject(item) && isText(item.id) ? item.id : `[${index}]`}`;
  if (!isObject(item)) {
    r.error(where, 'item must be an object');
    return null;
  }
  checkKeys(r, where, item, ITEM_KEYS);

  if (!isText(item.id)) {
    r.error(where, 'id: must be a non-empty string');
  } else {
    if (seenItemIds.has(item.id)) r.error(where, `duplicate item id "${item.id}"`);
    seenItemIds.add(item.id);
  }

  if (item.isSound === true) {
    if (isText(item.id) && !new RegExp(`^itm_snd_${slug}_0[12]$`).test(item.id)) {
      r.error(where, `id: sound items must be itm_snd_${slug}_01 or _02`);
    }
    if (item.fallacyId !== null) r.error(where, 'fallacyId: must be null for sound items');
    if (item.resembles !== fallacyId) r.error(where, `resembles: must be "${fallacyId}"`);
    if (item.difficulty !== 2 && item.difficulty !== 3) r.error(where, 'difficulty: sound items must be 2 or 3');
  } else if (item.isSound === false) {
    if (isText(item.id) && !new RegExp(`^itm_${slug}_\\d{2}$`).test(item.id)) {
      r.error(where, `id: flawed items must look like itm_${slug}_01`);
    }
    if (item.fallacyId !== fallacyId) {
      r.error(where, FALLACY_BY_ID.has(item.fallacyId)
        ? `fallacyId: "${item.fallacyId}" does not belong in ${fallacyId}.json`
        : `unknown fallacyId "${item.fallacyId}"`);
    }
    if (item.resembles !== null) r.error(where, 'resembles: must be null for flawed items');
    if (![1, 2, 3].includes(item.difficulty)) r.error(where, 'difficulty: must be 1, 2 or 3');
  } else {
    r.error(where, 'isSound: must be true or false');
  }
  if (item.resembles !== null && item.resembles !== undefined && !FALLACY_BY_ID.has(item.resembles)) {
    r.error(where, `unknown resembles "${item.resembles}"`);
  }

  if (!FORMATS.includes(item.format)) r.error(where, `format: "${item.format}" is not one of ${FORMATS.join(', ')}`);
  checkText(r, where, item.source, 'source', 100);
  if (TITLE_FORMATS.includes(item.format)) {
    if (!isText(item.title)) r.error(where, `title: required for ${item.format} items`);
    else checkText(r, where, item.title, 'title', LIMITS.title);
  } else if (FORMATS.includes(item.format) && item.title !== null) {
    r.error(where, `title: must be null for ${item.format} items`);
  }
  if (item.format === 'post' && isText(item.source) && !/ · @\S+$/.test(item.source)) {
    r.warn(where, 'source: posts should look like "Display Name · @handle"');
  }

  if (checkText(r, where, item.passage, 'passage')) {
    const length = item.passage.length;
    if (length < LIMITS.passageMin || length > LIMITS.passageMax) {
      r.error(where, `passage: ${length} characters (must be ${LIMITS.passageMin}-${LIMITS.passageMax})`);
    }
    if (item.format === 'chat') {
      const lines = item.passage.split('\n');
      if (lines.length < LIMITS.chatLinesMin || lines.length > LIMITS.chatLinesMax) {
        r.error(where, `passage: chats need ${LIMITS.chatLinesMin}-${LIMITS.chatLinesMax} lines (found ${lines.length})`);
      }
      lines.forEach((line, i) => {
        if (!CHAT_LINE.test(line)) r.error(where, `passage: chat line ${i + 1} must look like "Name: text"`);
      });
    }
  }

  if (checkText(r, where, item.cue, 'cue')) {
    if (typeof item.passage === 'string' && !item.passage.includes(item.cue)) {
      r.error(where, `cue: "${item.cue}" is not an exact substring of the passage`);
    }
    const words = wordCount(item.cue);
    if (words < LIMITS.cueWordsMin || words > LIMITS.cueWordsMax) {
      r.error(where, `cue: ${words} words (must be ${LIMITS.cueWordsMin}-${LIMITS.cueWordsMax})`);
    }
    if (typeof item.passage === 'string' && item.cue.length > item.passage.length * 0.6) {
      r.warn(where, 'cue: covers most of the passage; the flawed move should be a fraction of it');
    }
  }

  checkText(r, where, item.explanation, 'explanation', LIMITS.explanation);

  if (!isObject(item.whyNot) || Object.keys(item.whyNot).length !== 1) {
    r.error(where, 'whyNot: must have exactly one key');
  } else {
    const [key] = Object.keys(item.whyNot);
    if (!FALLACY_BY_ID.has(key)) r.error(where, `unknown whyNot key "${key}"`);
    if (item.isSound === true && key !== item.resembles) r.error(where, `whyNot: sound items must explain "${item.resembles}"`);
    if (item.isSound === false && key === item.fallacyId) r.error(where, 'whyNot: must name a different fallacy than the label');
    checkText(r, where, item.whyNot[key], `whyNot.${key}`, LIMITS.whyNot);
  }

  if (!Array.isArray(item.tags) || item.tags.length < LIMITS.tagsMin || item.tags.length > LIMITS.tagsMax) {
    r.error(where, `tags: must list ${LIMITS.tagsMin}-${LIMITS.tagsMax} tags`);
  } else {
    const unknown = item.tags.filter((t) => !TAGS.includes(t));
    if (unknown.length) r.error(where, `tags: unknown ${unknown.join(', ')}`);
    if (new Set(item.tags).size !== item.tags.length) r.error(where, 'tags: duplicates');
  }
  return item;
}

function checkComposition(r, where, items, allowPartial) {
  const flawed = items.filter((i) => i.isSound === false);
  const sound = items.filter((i) => i.isSound === true);
  const perDifficulty = [1, 2, 3].map((d) => flawed.filter((i) => i.difficulty === d).length);
  const exact = flawed.length === LIMITS.flawedPerFallacy && sound.length === LIMITS.soundPerFallacy
    && perDifficulty.every((n) => n === LIMITS.flawedPerDifficulty);
  const over = flawed.length > LIMITS.flawedPerFallacy || sound.length > LIMITS.soundPerFallacy
    || perDifficulty.some((n) => n > LIMITS.flawedPerDifficulty);
  const summary = `${flawed.length} flawed (difficulty 1/2/3: ${perDifficulty.join('/')}) and ${sound.length} sound`;
  if ((!allowPartial && !exact) || over) {
    r.error(where, `needs exactly ${LIMITS.flawedPerFallacy} flawed (2/2/2) and ${LIMITS.soundPerFallacy} sound items; found ${summary}`);
  }
  if (flawed.length === LIMITS.flawedPerFallacy) {
    const formats = new Set(flawed.map((i) => i.format));
    const topics = new Set(flawed.flatMap((i) => (Array.isArray(i.tags) ? i.tags : [])));
    if (formats.size < 4) r.warn(where, `only ${formats.size} formats across the flawed items (aim for 4+)`);
    if (topics.size < 4) r.warn(where, `only ${topics.size} topics across the flawed items (aim for 4+)`);
  }
}

function checkGiveaways(r, fallacies, items) {
  const byId = new Map(fallacies.map((f) => [f.id, f]));
  for (const item of items) {
    const target = byId.get(item.isSound ? item.resembles : item.fallacyId);
    if (!target || typeof item.passage !== 'string') continue;
    const text = `${item.title ?? ''} ${item.passage}`.toLowerCase();
    const names = [target.name, ...(Array.isArray(target.aliases) ? target.aliases : [])];
    const hit = names.find((n) => typeof n === 'string' && n.length > 3 && text.includes(n.toLowerCase()));
    if (hit) r.warn(item.id, `passage mentions "${hit}"; never name the fallacy`);
  }
  const bandwagon = items.filter((i) => i.fallacyId === 'fal_bandwagon' || i.resembles === 'fal_bandwagon');
  const knows = bandwagon.filter((i) => typeof i.passage === 'string' && /everyone knows/i.test(i.passage));
  if (knows.length > 1) r.warn('fal_bandwagon', `"Everyone knows" appears in ${knows.length} items (max 1)`);
}

/**
 * Validates loaded content. Returns errors, warnings and the clean records.
 * @param {{ fallacyFiles: any[], itemFiles: any[] }} content
 * @param {{ allowPartial?: boolean }} [options]
 */
export function validateContent(content, options = {}) {
  const allowPartial = Boolean(options.allowPartial);
  const r = createReporter();
  const fallacies = [];
  const items = [];
  const seenFallacyIds = new Set();
  const seenNames = new Set();
  const seenItemIds = new Set();

  for (const file of content.fallacyFiles) {
    if (file.error) {
      r.error(file.label, `invalid JSON (${file.error})`);
      continue;
    }
    const fallacy = validateFallacy(r, file, seenFallacyIds, seenNames);
    if (fallacy) fallacies.push(fallacy);
  }

  const itemFileIds = new Set();
  const orphanItemIds = [];
  for (const file of content.itemFiles) {
    const fallacyId = file.name.replace(/\.json$/, '');
    if (file.error) {
      r.error(file.label, `invalid JSON (${file.error})`);
      continue;
    }
    if (!FALLACY_BY_ID.has(fallacyId)) {
      r.error(file.label, `file name must be a canonical fallacy id ("${fallacyId}" is unknown)`);
      continue;
    }
    if (!Array.isArray(file.data)) {
      r.error(file.label, 'must contain a JSON array of items');
      continue;
    }
    itemFileIds.add(fallacyId);
    const clean = file.data
      .map((item, i) => validateItem(r, file, fallacyId, item, i, seenItemIds))
      .filter(Boolean);
    checkComposition(r, file.label, clean, allowPartial);
    if (!seenFallacyIds.has(fallacyId)) {
      const message = `has no matching content/fallacies/${fallacyId}.json`;
      if (allowPartial) {
        r.warn(file.label, `${message}; its items are left out of the bank`);
        orphanItemIds.push(...clean.map((i) => i.id));
      } else {
        r.error(file.label, message);
      }
    }
    items.push(...clean);
  }

  if (!allowPartial) {
    const missingFallacies = FALLACIES.filter((f) => !seenFallacyIds.has(f.id)).map((f) => f.id);
    const missingItems = FALLACIES.filter((f) => !itemFileIds.has(f.id)).map((f) => f.id);
    if (missingFallacies.length) {
      r.error('content/fallacies', `missing ${missingFallacies.length} of ${FALLACIES.length} fallacy files: ${missingFallacies.join(', ')}`);
    }
    if (missingItems.length) {
      r.error('content/items', `missing ${missingItems.length} of ${FALLACIES.length} item files: ${missingItems.join(', ')}`);
    }
  }

  checkGiveaways(r, fallacies, items);
  return { errors: r.errors, warnings: r.warnings, fallacies, items, orphanItemIds };
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank - 1))];
}

function countBy(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
}

/** Distribution stats: formats, tags, difficulty and passage length percentiles. */
export function computeStats(items, fallacies = []) {
  const flawed = items.filter((i) => i.isSound === false);
  const sound = items.filter((i) => i.isSound === true);
  const lengths = items.map((i) => (typeof i.passage === 'string' ? i.passage.length : 0)).sort((a, b) => a - b);
  const familyOf = (id) => FALLACY_BY_ID.get(id)?.family ?? 'unknown';
  return {
    fallacies: fallacies.length,
    items: items.length,
    flawed: flawed.length,
    sound: sound.length,
    formats: countBy(items.map((i) => i.format)),
    tags: countBy(items.flatMap((i) => (Array.isArray(i.tags) ? i.tags : []))),
    difficulty: {
      flawed: [1, 2, 3].map((d) => [d, flawed.filter((i) => i.difficulty === d).length]),
      sound: [2, 3].map((d) => [d, sound.filter((i) => i.difficulty === d).length]),
    },
    families: FAMILIES.map((f) => [f.id, items.filter((i) => familyOf(i.fallacyId ?? i.resembles) === f.id).length]),
    passageLength: {
      min: lengths[0] ?? 0,
      p10: percentile(lengths, 10),
      p25: percentile(lengths, 25),
      p50: percentile(lengths, 50),
      p75: percentile(lengths, 75),
      p90: percentile(lengths, 90),
      max: lengths[lengths.length - 1] ?? 0,
    },
  };
}

const paint = (code, text) => (process.stdout.isTTY ? `\u001b[${code}m${text}\u001b[0m` : text);

/** Prints errors, warnings and distribution stats in a readable block. */
export function printReport({ title, errors, warnings, stats }) {
  const lines = [paint('1', title), ''];
  if (errors.length) {
    lines.push(paint('31;1', `✗ ${errors.length} error${errors.length === 1 ? '' : 's'}`));
    errors.forEach((e, i) => lines.push(`  ${String(i + 1).padStart(3)}. ${e}`));
    lines.push('');
  } else {
    lines.push(paint('32;1', '✓ No errors'), '');
  }
  if (warnings.length) {
    lines.push(paint('33;1', `! ${warnings.length} warning${warnings.length === 1 ? '' : 's'}`));
    warnings.forEach((w, i) => lines.push(`  ${String(i + 1).padStart(3)}. ${w}`));
    lines.push('');
  }
  if (stats) {
    const join = (pairs, prefix = '') => pairs.map(([k, v]) => `${prefix}${k} ${v}`).join(' · ') || '—';
    const pl = stats.passageLength;
    lines.push(paint('1', 'Distribution'));
    lines.push(`  Totals      ${stats.fallacies} fallacies · ${stats.items} items (${stats.flawed} flawed, ${stats.sound} sound)`);
    lines.push(`  Formats     ${join(stats.formats)}`);
    lines.push(`  Tags        ${join(stats.tags)}`);
    lines.push(`  Difficulty  flawed ${join(stats.difficulty.flawed, 'd')} | sound ${join(stats.difficulty.sound, 'd')}`);
    lines.push(`  Families    ${join(stats.families)}`);
    lines.push(`  Passage     min ${pl.min} · p10 ${pl.p10} · p25 ${pl.p25} · p50 ${pl.p50} · p75 ${pl.p75} · p90 ${pl.p90} · max ${pl.max} characters`);
  }
  console.log(lines.join('\n'));
}

/** Loads, validates and reports. Returns the validation result plus stats. */
export function runValidation(opts) {
  const dir = contentDir(opts);
  const content = loadContent(dir);
  const result = validateContent(content, { allowPartial: opts.allowPartial });
  const stats = computeStats(result.items, result.fallacies);
  const where = relative(ROOT, dir).split('\\').join('/') || '.';
  const mode = opts.allowPartial ? 'partial' : 'strict';
  const title = `Fallacy Forge content check · ${where}/ · ${mode} · ${content.fallacyFiles.length} fallacy files, ${content.itemFiles.length} item files`;
  printReport({ title, errors: result.errors, warnings: result.warnings, stats });
  return { ...result, stats, dir };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { errors } = runValidation(parseArgs(process.argv.slice(2)));
  process.exitCode = errors.length ? 1 : 0;
}
