// "Fix the argument": pick a session's exercises and shuffle their options.
// Pure functions; the exercises themselves live in src/data/repairs.ts.

import { rngFrom, shuffle } from './rng';

export interface RepairOption {
  id: string;
  /** A rewritten version of the original argument. */
  text: string;
  /** True for the single strongest repair. */
  correct: boolean;
  /** Feedback for a learner who picks this option. */
  explanation: string;
}

export interface RepairItem {
  id: string;
  /** Short scenario label, e.g. "The old car". */
  title: string;
  /** The flaw in the original argument, as a fallacy library id. */
  fallacyId: string;
  /** The original, flawed argument. */
  passage: string;
  /** The reusable rule the strongest repair applies. */
  principle: string;
  /** Three rewrites; exactly one is correct. */
  options: RepairOption[];
  /** Authored teaching notes, revealed only after checking an answer. */
  review?: {
    /** Exact, unique excerpts of the strongest revision, in reading order. */
    highlights: string[];
    /** A remaining question to check; a stronger argument is not proof. */
    question: string;
  };
}

export const REPAIR_SESSION_SIZE = 5;

function uniqueById(items: readonly RepairItem[]): RepairItem[] {
  const ids = new Set<string>();
  return items.filter((item) => {
    if (ids.has(item.id)) return false;
    ids.add(item.id);
    return true;
  });
}

/**
 * Up to `size` distinct items: never-answered ones first, then the least
 * recently answered. `recent` lists answered item ids oldest first; repeats
 * are fine (the last occurrence counts). The picks are shuffled so a recycled
 * set doesn't replay in its old order.
 */
export function selectRepairs(
  items: readonly RepairItem[],
  recent: readonly string[],
  seed: string,
  size = REPAIR_SESSION_SIZE,
): RepairItem[] {
  const lastSeen = new Map<string, number>();
  recent.forEach((id, index) => {
    lastSeen.set(id, index);
  });
  const rng = rngFrom(`repair:${seed}`);
  // Shuffling first breaks ties between never-answered items at random.
  const pool = shuffle(uniqueById(items), rng);
  const unseen = pool.filter((item) => !lastSeen.has(item.id));
  const seen = pool
    .filter((item) => lastSeen.has(item.id))
    .sort((a, b) => (lastSeen.get(a.id) ?? 0) - (lastSeen.get(b.id) ?? 0));
  const count = Math.max(0, Math.min(pool.length, Math.floor(size)));
  return shuffle([...unseen, ...seen].slice(0, count), rng);
}

/** The item's options in a shuffled order, stable for the same seed and item. */
export function repairOptions(item: RepairItem, seed: string): RepairOption[] {
  return shuffle(item.options, rngFrom(`repair-options:${seed}:${item.id}`));
}
