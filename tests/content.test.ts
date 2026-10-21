// Content quality gate: validator rules (CONTENT-SPEC section 4), the dev
// fixtures, the shipped bank (src/data/bank.json) and, once all 38 fallacies
// exist, the real authored content.

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildBank } from '../scripts/build-bank.mjs';
import { FALLACIES, FAMILIES } from '../scripts/canonical.mjs';
import { ROOT, computeStats, loadContent, validateContent } from '../scripts/validate-content.mjs';
import shippedBank from '../src/data/bank.json';
import type { Bank, Fallacy, Item } from '../src/engine/types';
import { makeFallacy, makeItems } from './helpers';

type FileRecord = { name: string; label: string; data?: unknown; error?: string };

const fallacyFile = (data: unknown, name = `${(data as Fallacy).id}.json`): FileRecord => ({
  name,
  label: `content/fallacies/${name}`,
  data,
});
const itemFile = (fallacyId: string, data: unknown): FileRecord => ({
  name: `${fallacyId}.json`,
  label: `content/items/${fallacyId}.json`,
  data,
});

function canonicalFallacy(id: string): Fallacy {
  const c = FALLACIES.find((f) => f.id === id)!;
  return makeFallacy(c.id, c.family as Fallacy['family'], c.difficulty as Fallacy['difficulty'], [...c.confusableWith]);
}

function validPair(id = 'fal_straw_man') {
  const c = FALLACIES.find((f) => f.id === id)!;
  return { fallacy: canonicalFallacy(id), items: makeItems(id, c.confusableWith[0]) };
}

function check(fallacies: FileRecord[], items: FileRecord[], allowPartial = true) {
  return validateContent({ fallacyFiles: fallacies, itemFiles: items }, { allowPartial });
}

function errorsFor(mutate: (pair: { fallacy: Fallacy; items: Item[] }) => void, allowPartial = true): string[] {
  const pair = validPair();
  mutate(pair);
  return check([fallacyFile(pair.fallacy)], [itemFile(pair.fallacy.id, pair.items)], allowPartial).errors;
}

describe('validator: schema and limits', () => {
  it('accepts a valid fallacy with its 8 items', () => {
    const { errors, warnings } = check([fallacyFile(validPair().fallacy)], [itemFile('fal_straw_man', validPair().items)]);
    expect(errors).toEqual([]);
    expect(warnings.filter((w) => !w.includes('formats') && !w.includes('topics'))).toEqual([]);
  });

  it.each<[string, (p: { fallacy: Fallacy; items: Item[] }) => void, RegExp]>([
    ['unknown fallacy id', (p) => { p.fallacy.id = 'fal_made_up'; }, /must match the file name|unknown fallacy id/],
    ['wrong family', (p) => { p.fallacy.family = 'emotion'; }, /family: "emotion"/],
    ['wrong difficulty label', (p) => { p.fallacy.difficulty = 'advanced'; }, /difficulty: "advanced"/],
    ['shortDef over 80', (p) => { p.fallacy.shortDef = 'x'.repeat(81); }, /shortDef: 81 characters/],
    ['definition over 260', (p) => { p.fallacy.definition = 'x'.repeat(261); }, /definition: 261/],
    ['two tips instead of three', (p) => { p.fallacy.howToSpot = ['a', 'b']; }, /exactly 3 tips/],
    ['tip over 90', (p) => { p.fallacy.howToSpot[0] = 'x'.repeat(91); }, /howToSpot\[0\]: 91/],
    ['classicExample over 160', (p) => { p.fallacy.classicExample = 'x'.repeat(161); }, /classicExample: 161/],
    ['legitimateVersion over 220', (p) => { p.fallacy.legitimateVersion = 'x'.repeat(221); }, /legitimateVersion: 221/],
    ['confusables in the wrong order', (p) => { p.fallacy.confusableWith.reverse(); }, /confusableWith: must be exactly/],
    ['missing contrast entry', (p) => { delete p.fallacy.contrast['fal_red_herring']; }, /contrast: missing entries/],
    ['contrast over 160', (p) => { p.fallacy.contrast['fal_red_herring'] = 'x'.repeat(161); }, /contrast.fal_red_herring: 161/],
    ['unknown field', (p) => { (p.fallacy as unknown as Record<string, unknown>).extra = 1; }, /unknown field "extra"/],
  ])('rejects a fallacy with %s', (_label, mutate, pattern) => {
    expect(errorsFor(mutate).join('\n')).toMatch(pattern);
  });

  it.each<[string, (p: { fallacy: Fallacy; items: Item[] }) => void, RegExp]>([
    ['a cue that is not in the passage', (p) => { p.items[0]!.cue = 'words that are not there'; }, /not an exact substring/],
    ['a cue with different case', (p) => { p.items[0]!.cue = 'A flawed move in the middle'; }, /not an exact substring/],
    ['a cue under 3 words', (p) => { p.items[0]!.cue = 'flawed move'; }, /cue: 2 words/],
    ['a passage under 140 characters', (p) => { p.items[0]!.passage = 'Too short, with a flawed move in the middle.'; }, /passage: \d+ characters/],
    ['a passage over 420 characters', (p) => { p.items[0]!.passage = `${'Long. '.repeat(70)}a flawed move in the middle`; }, /passage: \d+ characters/],
    ['an email without a title', (p) => { p.items[6]!.title = null; }, /title: required for email/],
    ['a post with a title', (p) => { p.items[0]!.title = 'Nope'; }, /title: must be null for post/],
    ['a title over 70', (p) => { p.items[6]!.title = 'x'.repeat(71); }, /title: 71/],
    ['an unknown format', (p) => { (p.items[0] as unknown as Record<string, unknown>).format = 'tweet'; }, /format: "tweet"/],
    ['two whyNot keys', (p) => { p.items[0]!.whyNot = { fal_red_herring: 'a', fal_tu_quoque: 'b' }; }, /exactly one key/],
    ['an unknown whyNot key', (p) => { p.items[0]!.whyNot = { fal_imaginary: 'x' }; }, /unknown whyNot key/],
    ['a sound whyNot that is not the resembled fallacy', (p) => { p.items[6]!.whyNot = { fal_red_herring: 'x' }; }, /sound items must explain/],
    ['an unknown resembles', (p) => { p.items[6]!.resembles = 'fal_imaginary'; }, /unknown resembles|resembles: must be/],
    ['an explanation over 240', (p) => { p.items[0]!.explanation = 'x'.repeat(241); }, /explanation: 241/],
    ['an unknown tag', (p) => { p.items[0]!.tags = ['politics']; }, /tags: unknown politics/],
    ['four tags', (p) => { p.items[0]!.tags = ['food', 'money', 'tech', 'school']; }, /tags: must list 1-3/],
    ['a sound item at difficulty 1', (p) => { p.items[6]!.difficulty = 1; }, /sound items must be 2 or 3/],
    ['a flawed item with the wrong fallacy id', (p) => { p.items[0]!.fallacyId = 'fal_ad_hominem'; }, /does not belong in fal_straw_man.json/],
    ['an item id that does not match the file', (p) => { p.items[0]!.id = 'itm_ad_hominem_01'; }, /flawed items must look like itm_straw_man_01/],
  ])('rejects an item with %s', (_label, mutate, pattern) => {
    expect(errorsFor(mutate).join('\n')).toMatch(pattern);
  });

  it('checks chat line format and count', () => {
    const errors = errorsFor((p) => {
      p.items[0]!.format = 'chat';
      p.items[0]!.source = 'Team chat';
      p.items[0]!.passage = 'This chat line has no speaker name at all, and it keeps going with a flawed move in the middle so the passage is long enough to pass the length limit.';
    });
    expect(errors.join('\n')).toMatch(/chats need 2-4 lines/);
    expect(errors.join('\n')).toMatch(/chat line 1 must look like "Name: text"/);
  });

  it('rejects duplicate item ids across files', () => {
    const a = validPair('fal_straw_man');
    const b = validPair('fal_red_herring');
    b.items[0]!.id = 'itm_straw_man_01';
    const { errors } = check(
      [fallacyFile(a.fallacy), fallacyFile(b.fallacy)],
      [itemFile('fal_straw_man', a.items), itemFile('fal_red_herring', b.items)],
    );
    expect(errors.join('\n')).toMatch(/duplicate item id "itm_straw_man_01"/);
  });

  it('reports invalid JSON files', () => {
    const { errors } = check([{ name: 'fal_straw_man.json', label: 'content/fallacies/fal_straw_man.json', error: 'Unexpected token' }], []);
    expect(errors.join('\n')).toMatch(/invalid JSON/);
  });
});

describe('validator: completeness (skipped by --allow-partial)', () => {
  it('requires exactly 6 flawed (2/2/2) and 2 sound items per fallacy in strict mode', () => {
    expect(errorsFor((p) => p.items.pop(), false).join('\n')).toMatch(/needs exactly 6 flawed/);
    expect(errorsFor((p) => p.items.pop(), true).join('\n')).not.toMatch(/needs exactly 6 flawed/);
    expect(errorsFor((p) => { p.items[0]!.difficulty = 2; }, false).join('\n')).toMatch(/difficulty 1\/2\/3: 1\/3\/2/);
  });

  it('flags over-full fallacies even in partial mode', () => {
    const errors = errorsFor((p) => {
      p.items.push({ ...p.items[6]!, id: 'itm_snd_straw_man_03' });
    });
    expect(errors.join('\n')).toMatch(/needs exactly 6 flawed/);
  });

  it('lists missing fallacies in strict mode only', () => {
    const pair = validPair();
    const strict = check([fallacyFile(pair.fallacy)], [itemFile('fal_straw_man', pair.items)], false);
    expect(strict.errors.join('\n')).toMatch(/missing 37 of 38 fallacy files/);
    const partial = check([fallacyFile(pair.fallacy)], [itemFile('fal_straw_man', pair.items)], true);
    expect(partial.errors).toEqual([]);
  });

  it('requires a fallacy file for every items file (warning + skipped when partial)', () => {
    const pair = validPair();
    const strict = check([], [itemFile('fal_straw_man', pair.items)], false);
    expect(strict.errors.join('\n')).toMatch(/has no matching content\/fallacies\/fal_straw_man.json/);
    const partial = check([], [itemFile('fal_straw_man', pair.items)], true);
    expect(partial.errors).toEqual([]);
    expect(partial.orphanItemIds).toHaveLength(8);
  });
});

describe('dev fixtures', () => {
  it('pass the validator with no errors', () => {
    const result = validateContent(loadContent(join(ROOT, 'content', 'fixtures')), { allowPartial: true });
    expect(result.errors).toEqual([]);
    const stats = computeStats(result.items, result.fallacies);
    expect(stats).toMatchObject({ fallacies: 4, items: 32, flawed: 24, sound: 8 });
  });
});

/** Re-validates the shipped bank by splitting it back into per-fallacy files. */
function bankAsFiles(bank: Bank) {
  const fallacyFiles = bank.fallacies.map((f) => fallacyFile(f));
  const itemFiles = bank.fallacies.map((f) =>
    itemFile(f.id, bank.items.filter((i) => (i.isSound ? i.resembles : i.fallacyId) === f.id)),
  );
  return { fallacyFiles, itemFiles };
}

describe('shipped bank (src/data/bank.json)', () => {
  const bank = shippedBank as unknown as Bank;
  const complete = bank.fallacies.length === FALLACIES.length;

  it('passes the validator (strict when all 38 fallacies are present)', () => {
    const result = validateContent(bankAsFiles(bank), { allowPartial: !complete });
    expect(result.errors).toEqual([]);
  });

  it('has the canonical families and the documented sort orders', () => {
    expect(bank.families).toEqual(FAMILIES.map((f) => ({ id: f.id, label: f.label, order: f.order })));
    const order = new Map(FAMILIES.map((f) => [f.id, f.order]));
    const sortedFallacies = [...bank.fallacies].sort(
      (a, b) => (order.get(a.family) ?? 0) - (order.get(b.family) ?? 0) || a.name.localeCompare(b.name, 'en'),
    );
    expect(bank.fallacies.map((f) => f.id)).toEqual(sortedFallacies.map((f) => f.id));
    expect(bank.items.map((i) => i.id)).toEqual([...bank.items.map((i) => i.id)].sort());
    expect(typeof bank.version).toBe('string');
  });

  it('only contains items whose fallacy is in the bank', () => {
    const ids = new Set(bank.fallacies.map((f) => f.id));
    for (const item of bank.items) expect(ids.has((item.isSound ? item.resembles : item.fallacyId) ?? '')).toBe(true);
  });

  it.runIf(complete)('is the full release bank: 38 fallacies x 8 items', () => {
    expect(bank.items).toHaveLength(304);
  });
});

const realDir = join(ROOT, 'content', 'fallacies');
const realCount = existsSync(realDir) ? readdirSync(realDir).filter((f) => f.endsWith('.json')).length : 0;

describe.runIf(realCount === FALLACIES.length)('real content (content/fallacies + content/items)', () => {
  const result = validateContent(loadContent(join(ROOT, 'content')), { allowPartial: false });

  it('passes the validator in strict mode', () => {
    expect(result.errors).toEqual([]);
  });

  it('matches the shipped bank (run `npm run content` after editing content)', () => {
    const rebuilt = buildBank(result, (shippedBank as unknown as Bank).version);
    expect(rebuilt).toEqual(shippedBank);
  });
});
