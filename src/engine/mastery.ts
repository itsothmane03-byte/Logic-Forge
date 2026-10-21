// Mastery: one Leitner box (1-5) per fallacy, moved only by flawed items.

import type { Box, Item, Outcome, Tally } from './types';

export interface MasteryState {
  boxes: Readonly<Record<string, Box>>;
  stats: Readonly<Record<string, Tally>>;
  soundStats: Tally;
}

/** correct: +1 (max 5) · partial: -1 (min 1) · wrong: back to 1. */
export function nextBox(box: Box, outcome: Outcome): Box {
  if (outcome === 'correct') return Math.min(5, box + 1) as Box;
  if (outcome === 'partial') return Math.max(1, box - 1) as Box;
  return 1;
}

const bump = (tally: Tally | undefined, outcome: Outcome): Tally => ({
  seen: (tally?.seen ?? 0) + 1,
  correct: (tally?.correct ?? 0) + (outcome === 'correct' ? 1 : 0),
});

/**
 * Applies one answer. Flawed items move the box of their TRUE fallacy and its
 * stats; sound items only update `soundStats`. Returns new objects.
 */
export function applyOutcome(state: MasteryState, item: Item, outcome: Outcome): MasteryState {
  if (item.isSound || !item.fallacyId) {
    return { ...state, soundStats: bump(state.soundStats, outcome) };
  }
  const id = item.fallacyId;
  return {
    boxes: { ...state.boxes, [id]: nextBox(state.boxes[id] ?? 1, outcome) },
    stats: { ...state.stats, [id]: bump(state.stats[id], outcome) },
    soundStats: state.soundStats,
  };
}

/** Mastery as a fraction: (box - 1) / 4. */
export function masteryFraction(box: Box | undefined): number {
  return ((box ?? 1) - 1) / 4;
}

/** Whole-number percent for display and aria labels. */
export function masteryPercent(box: Box | undefined): number {
  return Math.round(masteryFraction(box) * 100);
}

export function isMastered(box: Box | undefined): boolean {
  return box === 5;
}

export interface MasteryChange {
  fallacyId: string;
  direction: 'up' | 'down';
}

/** Box movements between two snapshots, for the session summary chips. */
export function masteryChanges(
  before: Readonly<Record<string, Box>>,
  after: Readonly<Record<string, Box>>,
  fallacyIds: readonly string[],
): MasteryChange[] {
  const out: MasteryChange[] = [];
  for (const id of new Set(fallacyIds)) {
    const from = before[id] ?? 1;
    const to = after[id] ?? 1;
    if (to > from) out.push({ fallacyId: id, direction: 'up' });
    else if (to < from) out.push({ fallacyId: id, direction: 'down' });
  }
  return out;
}
