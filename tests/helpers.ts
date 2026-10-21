// Test helpers: a synthetic full-size bank (38 fallacies x 8 items, built
// from the canonical table) and the dev fixture bank.

import { join } from 'node:path';
import { buildBank } from '../scripts/build-bank.mjs';
import { FALLACIES, FAMILIES } from '../scripts/canonical.mjs';
import { ROOT, loadContent, validateContent } from '../scripts/validate-content.mjs';
import type { Attempt, Bank, Difficulty, Fallacy, FamilyId, Item, Level } from '../src/engine/types';

const title = (id: string) =>
  id
    .replace(/^fal_/, '')
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export function makeFallacy(id: string, family: FamilyId, difficulty: Level, confusableWith: string[]): Fallacy {
  return {
    id,
    name: title(id),
    aliases: [],
    family,
    difficulty,
    shortDef: `Short definition of ${title(id)}.`,
    definition: `Definition of ${title(id)}.`,
    howToSpot: ['Tip one.', 'Tip two.', 'Tip three.'],
    classicExample: 'An example.',
    legitimateVersion: 'When it is fair.',
    confusableWith: [...confusableWith],
    contrast: Object.fromEntries(confusableWith.map((c) => [c, `Contrast with ${title(c)}.`])),
  };
}

export function makeItems(fallacyId: string, confusable = 'fal_red_herring'): Item[] {
  const slug = fallacyId.replace(/^fal_/, '');
  const passage = `A realistic passage about ${slug} with a flawed move in the middle and ordinary sentences around it, long enough to look like something a real person would write.`;
  const flawed: Item[] = ([1, 1, 2, 2, 3, 3] as Difficulty[]).map((difficulty, i) => ({
    id: `itm_${slug}_0${i + 1}`,
    fallacyId,
    isSound: false,
    resembles: null,
    difficulty,
    format: 'post',
    source: 'Sam Doe · @sam',
    title: null,
    passage,
    cue: 'a flawed move in the middle',
    explanation: 'Why it is flawed.',
    whyNot: { [confusable === fallacyId ? 'fal_straw_man' : confusable]: 'Why not the look-alike.' },
    tags: ['everyday'],
  }));
  const sound: Item[] = ([2, 3] as Difficulty[]).map((difficulty, i) => ({
    id: `itm_snd_${slug}_0${i + 1}`,
    fallacyId: null,
    isSound: true,
    resembles: fallacyId,
    difficulty,
    format: 'email',
    source: 'Ana Ruiz',
    title: 'A subject line',
    passage,
    cue: 'a flawed move in the middle',
    explanation: 'Why it is sound.',
    whyNot: { [fallacyId]: 'Why it is not that fallacy.' },
    tags: ['workplace'],
  }));
  return [...flawed, ...sound];
}

/** 38 fallacies x (6 flawed + 2 sound) = 304 items, like the real bank. */
export function fullBank(): Bank {
  const fallacies = FALLACIES.map((f) => makeFallacy(f.id, f.family as FamilyId, f.difficulty as Level, [...f.confusableWith]));
  const items = FALLACIES.flatMap((f) => makeItems(f.id, f.confusableWith[0]));
  return {
    version: 'test',
    fallacies,
    items,
    families: FAMILIES.map((f) => ({ id: f.id as FamilyId, label: f.label, order: f.order })),
  };
}

/** The dev fixture bank, built exactly like `npm run content -- --fixtures`. */
export function fixtureBank(): Bank {
  const content = loadContent(join(ROOT, 'content', 'fixtures'));
  const result = validateContent(content, { allowPartial: true });
  if (result.errors.length) throw new Error(`Fixtures are invalid:\n${result.errors.join('\n')}`);
  return buildBank(result, 'test') as unknown as Bank;
}

export function attempt(itemId: string, outcome: Attempt['outcome'], at: number, mode = 'practice'): Attempt {
  return { itemId, outcome, at, mode };
}

export const fallacyOf = (bank: Bank, itemId: string): string | null =>
  bank.items.find((i) => i.id === itemId)?.fallacyId ?? null;

export const itemOf = (bank: Bank, itemId: string): Item => {
  const item = bank.items.find((i) => i.id === itemId);
  if (!item) throw new Error(`Unknown item ${itemId}`);
  return item;
};
