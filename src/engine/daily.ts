// Daily Forge: the same 10 questions for everyone on a given local date.

import { daysBetween } from './dates';
import { rngFrom, pickOne, shuffle } from './rng';
import type { Difficulty, Item } from './types';

/** Daily #1 is 2026-10-20. */
export const DAILY_EPOCH = '2026-10-20';
export const DAILY_SIZE = 10;
/** Difficulty mix for the 8 flawed items: 3 x d1, 3 x d2, 2 x d3. */
export const DAILY_DIFFICULTY_SLOTS: readonly Difficulty[] = [1, 1, 1, 2, 2, 2, 3, 3];
export const DAILY_SOUND = 2;

const byId = (a: Item, b: Item): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** Days since 2026-10-20 (inclusive) + 1. Never below 1. */
export function dailyNumber(key: string): number {
  const n = daysBetween(DAILY_EPOCH, key) + 1;
  return Number.isFinite(n) ? Math.max(1, n) : 1;
}

/**
 * Builds the daily set for a date: 8 flawed items from 8 distinct fallacies
 * (3 x d1, 3 x d2, 2 x d3) plus 2 sound items, shuffled with the same rng.
 * Deterministic for a given (date, bank). Small banks degrade gracefully:
 * fallacies repeat as rarely as possible and no item repeats.
 */
export function buildDaily(items: readonly Item[], key: string): string[] {
  const rng = rngFrom(`daily:${key}`);
  const sorted = [...items].sort(byId);
  const byFallacy = new Map<string, Item[]>();
  for (const item of sorted) {
    if (item.isSound || !item.fallacyId) continue;
    const list = byFallacy.get(item.fallacyId) ?? [];
    list.push(item);
    byFallacy.set(item.fallacyId, list);
  }

  const fallacyOrder = shuffle([...byFallacy.keys()], rng);
  const slots = shuffle(DAILY_DIFFICULTY_SLOTS, rng);
  const uses = new Map<string, number>();
  const chosen = new Set<string>();
  const picks: Item[] = [];

  const pickFlawed = (difficulty: Difficulty | null): Item | undefined => {
    const maxUse = Math.max(0, ...uses.values());
    for (let level = 0; level <= maxUse + 1; level++) {
      for (const fallacyId of fallacyOrder) {
        if ((uses.get(fallacyId) ?? 0) !== level) continue;
        const candidates = (byFallacy.get(fallacyId) ?? []).filter(
          (i) => !chosen.has(i.id) && (difficulty === null || i.difficulty === difficulty),
        );
        const pick = pickOne(candidates, rng);
        if (pick) return pick;
      }
    }
    return undefined;
  };

  for (const difficulty of slots) {
    const pick = pickFlawed(difficulty) ?? pickFlawed(null);
    if (!pick || !pick.fallacyId) continue;
    picks.push(pick);
    chosen.add(pick.id);
    uses.set(pick.fallacyId, (uses.get(pick.fallacyId) ?? 0) + 1);
  }

  const sound = shuffle(sorted.filter((i) => i.isSound), rng).slice(0, DAILY_SOUND);
  return shuffle([...picks, ...sound], rng).map((i) => i.id);
}
