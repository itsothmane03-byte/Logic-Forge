// Streaks: consecutive local days with at least one answered question.

import { addDays, daysBetween, isDateKey } from './dates';

const active = (days: Readonly<Record<string, number>>, key: string): boolean => (days[key] ?? 0) > 0;

/**
 * Counts back from today. If today has no answers yet, counts back from
 * yesterday, so the streak survives until the day is actually missed.
 */
export function currentStreak(days: Readonly<Record<string, number>>, today: string): number {
  let cursor = active(days, today) ? today : addDays(today, -1);
  let count = 0;
  while (active(days, cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

/** Longest run of consecutive active days anywhere in the history. */
export function longestStreak(days: Readonly<Record<string, number>>): number {
  const keys = Object.keys(days)
    .filter((k) => isDateKey(k) && active(days, k))
    .sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of keys) {
    run = prev !== null && daysBetween(prev, key) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = key;
  }
  return best;
}

/** Best streak = max of the stored best, the history and the current run. */
export function bestStreak(stored: number, days: Readonly<Record<string, number>>, today: string): number {
  return Math.max(stored, longestStreak(days), currentStreak(days, today));
}
