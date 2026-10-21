// Session selection: Practice (adaptive), Focus on one fallacy, Review mistakes.

import { pickOne, shuffle, weightedIndex, type Rng } from './rng';
import type { Attempt, Box, Fallacy, Item } from './types';

export const SESSION_SIZE = 10;
export const PRACTICE_SOUND = 2;
export const BOX_WEIGHTS: Readonly<Record<Box, number>> = { 1: 5, 2: 3, 3: 2, 4: 1, 5: 0.5 };
export const BEGINNER_BOOST = 1.5;
export const BEGINNER_PHASE_ATTEMPTS = 30;
export const RECENT_WINDOW = 40;
export const REVIEW_LIMIT = 10;

interface BankLike {
  fallacies: readonly Fallacy[];
  items: readonly Item[];
}

const byId = (a: Item, b: Item): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** Practice weight of a fallacy: Leitner box weight, with a beginner boost early on. */
export function fallacyWeight(fallacy: Fallacy, boxes: Readonly<Record<string, Box>>, totalAttempts: number): number {
  const box = boxes[fallacy.id] ?? 1;
  const base = BOX_WEIGHTS[box];
  const boosted = fallacy.difficulty === 'beginner' && totalAttempts < BEGINNER_PHASE_ATTEMPTS;
  return boosted ? base * BEGINNER_BOOST : base;
}

/** Ids of items answered in the last `window` attempts. */
export function recentItemIds(attempts: readonly Attempt[], window = RECENT_WINDOW): Set<string> {
  return new Set(attempts.slice(-window).map((a) => a.itemId));
}

function groupFlawed(items: readonly Item[]): Map<string, Item[]> {
  const map = new Map<string, Item[]>();
  for (const item of items) {
    if (item.isSound || !item.fallacyId) continue;
    const list = map.get(item.fallacyId) ?? [];
    list.push(item);
    map.set(item.fallacyId, list);
  }
  return map;
}

/** Fresh (not recent) items first; otherwise the least recently seen. */
function chooseItem(candidates: readonly Item[], recent: Set<string>, lastSeen: Map<string, number>, rng: Rng): Item | undefined {
  const fresh = candidates.filter((i) => !recent.has(i.id));
  if (fresh.length) return pickOne(fresh, rng);
  const oldest = Math.min(...candidates.map((i) => lastSeen.get(i.id) ?? -1));
  return pickOne(candidates.filter((i) => (lastSeen.get(i.id) ?? -1) === oldest), rng);
}

const fallacyKey = (item: Item): string | null => (item.isSound ? null : item.fallacyId);

/**
 * Orders items so the same fallacy never appears twice in a row (including
 * against `previous`, the last fallacy answered), whenever that is possible.
 * Keeps the incoming (shuffled) order otherwise.
 */
export function arrangeNoRepeats(items: readonly Item[], previous: string | null = null): Item[] {
  const remaining = items.slice();
  const out: Item[] = [];
  let prev = previous;
  while (remaining.length) {
    const counts = new Map<string, number>();
    for (const item of remaining) {
      const k = fallacyKey(item);
      if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    let forced: string | null = null;
    for (const [k, c] of counts) {
      if (k !== prev && c > Math.ceil((remaining.length - 1) / 2)) forced = k;
    }
    let index = forced
      ? remaining.findIndex((i) => fallacyKey(i) === forced)
      : remaining.findIndex((i) => fallacyKey(i) === null || fallacyKey(i) !== prev);
    if (index === -1) index = 0;
    const [next] = remaining.splice(index, 1);
    if (!next) break;
    out.push(next);
    prev = fallacyKey(next);
  }
  return out;
}

export interface PracticeInput {
  bank: BankLike;
  boxes: Readonly<Record<string, Box>>;
  attempts: readonly Attempt[];
  rng: Rng;
}

/**
 * Practice: 10 items, 2 of them sound. Fallacies are drawn by Leitner weight
 * without replacement; items seen in the last 40 attempts are avoided when the
 * pool allows, and the same fallacy never appears twice in a row.
 */
export function selectPractice({ bank, boxes, attempts, rng }: PracticeInput): string[] {
  const items = [...bank.items].sort(byId);
  const recent = recentItemIds(attempts);
  const lastSeen = new Map<string, number>();
  attempts.forEach((a, i) => lastSeen.set(a.itemId, i));
  const flawedByFallacy = groupFlawed(items);
  const fallacies = bank.fallacies.filter((f) => (flawedByFallacy.get(f.id)?.length ?? 0) > 0);
  const sound = items.filter((i) => i.isSound);
  const soundTarget = Math.min(PRACTICE_SOUND, sound.length);
  const flawedTotal = [...flawedByFallacy.values()].reduce((n, list) => n + list.length, 0);
  const flawedTarget = Math.min(SESSION_SIZE - soundTarget, flawedTotal);

  const used = new Set<string>();
  const usedFallacies = new Set<string>();
  const unused = (f: Fallacy) => (flawedByFallacy.get(f.id) ?? []).filter((i) => !used.has(i.id));
  const hasFresh = (f: Fallacy) => unused(f).some((i) => !recent.has(i.id));
  const tiers: Array<(f: Fallacy) => boolean> = [
    (f) => !usedFallacies.has(f.id) && hasFresh(f),
    (f) => hasFresh(f),
    (f) => !usedFallacies.has(f.id) && unused(f).length > 0,
    (f) => unused(f).length > 0,
  ];

  const flawed: Item[] = [];
  while (flawed.length < flawedTarget) {
    const pool = tiers.map((test) => fallacies.filter(test)).find((list) => list.length > 0);
    if (!pool) break;
    const index = weightedIndex(pool.map((f) => fallacyWeight(f, boxes, attempts.length)), rng);
    const fallacy = pool[index] ?? pool[0];
    if (!fallacy) break;
    const item = chooseItem(unused(fallacy), recent, lastSeen, rng);
    if (!item) break;
    flawed.push(item);
    used.add(item.id);
    usedFallacies.add(fallacy.id);
  }

  const soundPicks: Item[] = [];
  while (soundPicks.length < SESSION_SIZE - flawed.length) {
    const item = chooseItem(sound.filter((i) => !used.has(i.id)), recent, lastSeen, rng);
    if (!item) break;
    soundPicks.push(item);
    used.add(item.id);
  }

  const lastAttempt = attempts[attempts.length - 1];
  const previous = lastAttempt ? (items.find((i) => i.id === lastAttempt.itemId)?.fallacyId ?? null) : null;
  return arrangeNoRepeats(shuffle([...flawed, ...soundPicks], rng), previous).map((i) => i.id);
}

export interface FocusInput {
  bank: BankLike;
  fallacyId: string;
  rng: Rng;
}

/**
 * Focus on X: 5 flawed of X + 2 flawed from X's confusables + 2 sound items
 * resembling X (or any sound) + 1 more flawed of X, shuffled. Short pools are
 * topped up from the same family, then any family.
 */
export function selectFocus({ bank, fallacyId, rng }: FocusInput): string[] {
  const items = [...bank.items].sort(byId);
  const target = bank.fallacies.find((f) => f.id === fallacyId);
  if (!target) return [];
  const flawedByFallacy = groupFlawed(items);
  const used = new Set<string>();
  const take = (pool: readonly Item[], n: number): Item[] => {
    const picks = shuffle(pool.filter((i) => !used.has(i.id)), rng).slice(0, Math.max(0, n));
    picks.forEach((i) => used.add(i.id));
    return picks;
  };

  const own = take(flawedByFallacy.get(fallacyId) ?? [], 6);

  const confusables: Item[] = [];
  for (const id of target.confusableWith) {
    if (confusables.length >= 2) break;
    confusables.push(...take(flawedByFallacy.get(id) ?? [], 1));
  }
  const others = (sameFamily: boolean) =>
    bank.fallacies
      .filter((f) => f.id !== fallacyId && (f.family === target.family) === sameFamily)
      .flatMap((f) => flawedByFallacy.get(f.id) ?? []);
  if (confusables.length < 2) {
    for (const id of target.confusableWith) {
      if (confusables.length >= 2) break;
      confusables.push(...take(flawedByFallacy.get(id) ?? [], 2 - confusables.length));
    }
  }
  if (confusables.length < 2) confusables.push(...take(others(true), 2 - confusables.length));
  if (confusables.length < 2) confusables.push(...take(others(false), 2 - confusables.length));

  const sound = take(items.filter((i) => i.isSound && i.resembles === fallacyId), 2);
  if (sound.length < 2) sound.push(...take(items.filter((i) => i.isSound), 2 - sound.length));

  const picked = [...own, ...confusables, ...sound];
  if (picked.length < SESSION_SIZE) picked.push(...take(others(true), SESSION_SIZE - picked.length));
  if (picked.length < SESSION_SIZE) picked.push(...take(others(false), SESSION_SIZE - picked.length));
  return shuffle(picked.slice(0, SESSION_SIZE), rng).map((i) => i.id);
}

/**
 * Items whose latest attempt was partial or wrong, most recent first.
 * `validIds` drops items that no longer exist in the bank.
 */
export function reviewQueue(attempts: readonly Attempt[], validIds?: ReadonlySet<string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (let i = attempts.length - 1; i >= 0; i--) {
    const attempt = attempts[i];
    if (!attempt || seen.has(attempt.itemId)) continue;
    seen.add(attempt.itemId);
    if (attempt.outcome !== 'correct' && (!validIds || validIds.has(attempt.itemId))) out.push(attempt.itemId);
  }
  return out;
}

/** Review session: up to 10 recent misses. Empty means the mode is disabled. */
export function selectReview(attempts: readonly Attempt[], validIds?: ReadonlySet<string>): string[] {
  return reviewQueue(attempts, validIds).slice(0, REVIEW_LIMIT);
}

/**
 * A short, textbook item for demos (Welcome mini-demo, "Try one"): a flawed
 * difficulty-1 item of a beginner fallacy, preferring posts and chats.
 */
export function pickDemoItem(bank: BankLike): Item | undefined {
  const beginner = new Set(bank.fallacies.filter((f) => f.difficulty === 'beginner').map((f) => f.id));
  const formatRank = (i: Item) => (i.format === 'post' ? 0 : i.format === 'chat' ? 1 : 2);
  const candidates = bank.items
    .filter((i) => !i.isSound && i.difficulty === 1 && i.fallacyId !== null && bank.fallacies.some((f) => f.id === i.fallacyId))
    .sort((a, b) =>
      Number(!beginner.has(a.fallacyId ?? '')) - Number(!beginner.has(b.fallacyId ?? ''))
      || formatRank(a) - formatRank(b)
      || a.passage.length - b.passage.length
      || (a.id < b.id ? -1 : 1));
  return candidates[0] ?? bank.items.find((i) => !i.isSound) ?? bank.items[0];
}

/** One sample item per requested format (first by id), for showcase cards. */
export function pickFormatSamples(items: readonly Item[], formats: readonly Item['format'][]): Item[] {
  const sorted = [...items].sort(byId);
  const out: Item[] = [];
  for (const format of formats) {
    const match = sorted.find((i) => i.format === format && !out.includes(i));
    if (match) out.push(match);
  }
  return out;
}
