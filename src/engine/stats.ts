// Derived, read-only views of progress for the Today and Progress screens.

import { addDays, shortDate, weekdayOf } from './dates';
import { isMastered, masteryFraction } from './mastery';
import { rngFrom } from './rng';
import type { Box, Fallacy, Family, Progress, SessionRecord } from './types';

export function totalAnswered(days: Readonly<Record<string, number>>): number {
  return Object.values(days).reduce((sum, n) => sum + n, 0);
}

/** Overall accuracy (0..1) across flawed and sound items; null before any answer. */
export function accuracy(progress: Pick<Progress, 'stats' | 'soundStats'>): number | null {
  let seen = progress.soundStats.seen;
  let correct = progress.soundStats.correct;
  for (const t of Object.values(progress.stats)) {
    seen += t.seen;
    correct += t.correct;
  }
  return seen > 0 ? correct / seen : null;
}

export function masteredCount(boxes: Readonly<Record<string, Box>>, fallacyIds: readonly string[]): number {
  return fallacyIds.filter((id) => isMastered(boxes[id])).length;
}

/**
 * The three chips on the Practice card: practiced fallacies with the lowest
 * box (then lowest accuracy) first, topped up with unpracticed beginners.
 */
export function weakestFallacies(fallacies: readonly Fallacy[], progress: Pick<Progress, 'boxes' | 'stats'>, n = 3): Fallacy[] {
  const acc = (id: string) => {
    const t = progress.stats[id];
    return t && t.seen > 0 ? t.correct / t.seen : 1;
  };
  const practiced = fallacies
    .filter((f) => (progress.stats[f.id]?.seen ?? 0) > 0 && !isMastered(progress.boxes[f.id]))
    .sort((a, b) => (progress.boxes[a.id] ?? 1) - (progress.boxes[b.id] ?? 1) || acc(a.id) - acc(b.id) || a.name.localeCompare(b.name));
  const rank = { beginner: 0, intermediate: 1, advanced: 2 } as const;
  const fresh = fallacies
    .filter((f) => (progress.stats[f.id]?.seen ?? 0) === 0)
    .sort((a, b) => rank[a.difficulty] - rank[b.difficulty] || a.name.localeCompare(b.name));
  return [...practiced, ...fresh].slice(0, n);
}

/** Fallacy of the day, seeded by date. */
export function fallacyOfTheDay(fallacies: readonly Fallacy[], key: string): Fallacy | undefined {
  if (fallacies.length === 0) return undefined;
  const sorted = [...fallacies].sort((a, b) => (a.id < b.id ? -1 : 1));
  return sorted[Math.floor(rngFrom(`fotd:${key}`)() * sorted.length)];
}

export type HeatLevel = 0 | 1 | 2 | 3 | 4;

export interface HeatCell {
  key: string;
  count: number;
  level: HeatLevel;
  future: boolean;
  label: string;
}

/** 0 = none · 1 = 1-4 · 2 = 5-9 · 3 = 10-19 · 4 = 20+ questions. */
export function heatLevel(count: number): HeatLevel {
  if (count <= 0) return 0;
  if (count < 5) return 1;
  if (count < 10) return 2;
  if (count < 20) return 3;
  return 4;
}

/**
 * GitHub-style grid: `weeks` columns of 7 days (Sunday first). The last
 * column is the current week; days after today are marked `future`.
 */
export function heatmap(days: Readonly<Record<string, number>>, today: string, weeks = 20): HeatCell[][] {
  const lastSunday = addDays(today, -weekdayOf(today));
  const start = addDays(lastSunday, -(weeks - 1) * 7);
  const columns: HeatCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const column: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const key = addDays(start, w * 7 + d);
      const count = days[key] ?? 0;
      const future = key > today;
      const noun = count === 1 ? 'question' : 'questions';
      column.push({ key, count, level: heatLevel(count), future, label: `${shortDate(key)}: ${count} ${noun}` });
    }
    columns.push(column);
  }
  return columns;
}

/** Accuracy percentages of the last `n` sessions, oldest first. */
export function accuracyTrend(sessions: readonly SessionRecord[], n = 14): number[] {
  return sessions
    .filter((s) => s.total > 0)
    .slice(-n)
    .map((s) => Math.round((s.correct / s.total) * 100));
}

/** One-sentence text alternative for the sparkline. */
export function trendSummary(values: readonly number[]): string {
  if (values.length === 0) return 'Finish a session to start your accuracy trend.';
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const label = values.length === 1 ? 'Your first session' : `Last ${values.length} sessions`;
  if (values.length < 4) return `${label}: average ${avg}%.`;
  const half = Math.floor(values.length / 2);
  const early = values.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const late = values.slice(-half).reduce((a, b) => a + b, 0) / half;
  const delta = Math.round(late - early);
  const direction = delta > 2 ? `up ${delta} points` : delta < -2 ? `down ${-delta} points` : 'holding steady';
  return `${label}: average ${avg}%, ${direction} from the earlier half.`;
}

export interface FamilyMastery {
  family: Family;
  rows: { fallacy: Fallacy; box: Box; percent: number; practiced: boolean }[];
  percent: number;
}

export function familyMastery(
  families: readonly Family[],
  fallacies: readonly Fallacy[],
  progress: Pick<Progress, 'boxes' | 'stats'>,
): FamilyMastery[] {
  return [...families]
    .sort((a, b) => a.order - b.order)
    .map((family) => {
      const rows = fallacies
        .filter((f) => f.family === family.id)
        .map((fallacy) => {
          const box = progress.boxes[fallacy.id] ?? 1;
          return {
            fallacy,
            box,
            percent: Math.round(masteryFraction(box) * 100),
            practiced: (progress.stats[fallacy.id]?.seen ?? 0) > 0,
          };
        });
      const percent = rows.length ? Math.round(rows.reduce((s, r) => s + r.percent, 0) / rows.length) : 0;
      return { family, rows, percent };
    })
    .filter((group) => group.rows.length > 0);
}
