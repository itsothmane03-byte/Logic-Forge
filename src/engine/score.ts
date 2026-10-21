// Scoring: one outcome per question.

import type { Item, Outcome, SpotChoice } from './types';

/**
 * Flawed item: correct = flawed + right name; partial = flawed + wrong name;
 * wrong = picked sound. Sound item: correct = picked sound; otherwise wrong.
 */
export function scoreAnswer(item: Item, spot: SpotChoice, namedId: string | null = null): Outcome {
  if (item.isSound) return spot === 'sound' ? 'correct' : 'wrong';
  if (spot === 'sound') return 'wrong';
  return namedId !== null && namedId === item.fallacyId ? 'correct' : 'partial';
}

/** True when the Name step should follow the Spot step. */
export function needsName(item: Item, spot: SpotChoice): boolean {
  return spot === 'flawed' && !item.isSound;
}

/** Summary score = number of correct answers. */
export function sessionScore(outcomes: readonly Outcome[]): number {
  return outcomes.filter((o) => o === 'correct').length;
}

export type ScoreBand = 'flawless' | 'sharp' | 'getting' | 'start';

/** 10: flawless · 7-9: sharp · 4-6: getting there · 0-3: start (scaled for other totals). */
export function scoreBand(correct: number, total: number): ScoreBand {
  if (total > 0 && correct === total) return 'flawless';
  const tenths = total > 0 ? (correct / total) * 10 : 0;
  if (tenths >= 7) return 'sharp';
  if (tenths >= 4) return 'getting';
  return 'start';
}

export const BAND_MESSAGES: Readonly<Record<ScoreBand, string>> = {
  flawless: 'Flawless forging.',
  sharp: 'Sharp eye.',
  getting: 'Getting there.',
  start: 'Every expert started here.',
};
