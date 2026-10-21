import { describe, expect, it } from 'vitest';
import { applyOutcome, isMastered, masteryChanges, masteryFraction, masteryPercent, nextBox } from '../../src/engine/mastery';
import { BAND_MESSAGES, needsName, scoreAnswer, scoreBand, sessionScore } from '../../src/engine/score';
import type { Box, Outcome } from '../../src/engine/types';
import { fullBank } from '../helpers';

const bank = fullBank();
const flawed = bank.items.find((i) => !i.isSound)!;
const sound = bank.items.find((i) => i.isSound)!;
const other = bank.fallacies.find((f) => f.id !== flawed.fallacyId)!.id;

describe('scoreAnswer', () => {
  it('flawed items: right name = correct, wrong name = partial, "sound" = wrong', () => {
    expect(scoreAnswer(flawed, 'flawed', flawed.fallacyId)).toBe('correct');
    expect(scoreAnswer(flawed, 'flawed', other)).toBe('partial');
    expect(scoreAnswer(flawed, 'flawed', null)).toBe('partial');
    expect(scoreAnswer(flawed, 'sound')).toBe('wrong');
    expect(scoreAnswer(flawed, 'sound', flawed.fallacyId)).toBe('wrong');
  });

  it('sound items: "sound" = correct, "flawed" = wrong', () => {
    expect(scoreAnswer(sound, 'sound')).toBe('correct');
    expect(scoreAnswer(sound, 'flawed')).toBe('wrong');
    expect(scoreAnswer(sound, 'flawed', sound.resembles)).toBe('wrong');
  });

  it('asks for a name only after "flawed" on a flawed item', () => {
    expect(needsName(flawed, 'flawed')).toBe(true);
    expect(needsName(flawed, 'sound')).toBe(false);
    expect(needsName(sound, 'flawed')).toBe(false);
  });

  it('summary score counts correct answers only', () => {
    expect(sessionScore(['correct', 'partial', 'wrong', 'correct'])).toBe(2);
    expect(sessionScore([])).toBe(0);
  });

  it('maps scores to bands and copy', () => {
    expect(scoreBand(10, 10)).toBe('flawless');
    expect([7, 8, 9].map((n) => scoreBand(n, 10))).toEqual(['sharp', 'sharp', 'sharp']);
    expect([4, 5, 6].map((n) => scoreBand(n, 10))).toEqual(['getting', 'getting', 'getting']);
    expect([0, 1, 2, 3].map((n) => scoreBand(n, 10))).toEqual(['start', 'start', 'start', 'start']);
    expect(scoreBand(1, 1)).toBe('flawless');
    expect(BAND_MESSAGES).toEqual({
      flawless: 'Flawless forging.',
      sharp: 'Sharp eye.',
      getting: 'Getting there.',
      start: 'Every expert started here.',
    });
  });
});

describe('Leitner transitions', () => {
  const table: Array<[Box, Outcome, Box]> = [
    [1, 'correct', 2], [2, 'correct', 3], [3, 'correct', 4], [4, 'correct', 5], [5, 'correct', 5],
    [1, 'partial', 1], [2, 'partial', 1], [3, 'partial', 2], [4, 'partial', 3], [5, 'partial', 4],
    [1, 'wrong', 1], [2, 'wrong', 1], [3, 'wrong', 1], [4, 'wrong', 1], [5, 'wrong', 1],
  ];
  it.each(table)('box %i + %s -> box %i', (box, outcome, expected) => {
    expect(nextBox(box, outcome)).toBe(expected);
  });
});

describe('applyOutcome', () => {
  const empty = { boxes: {}, stats: {}, soundStats: { seen: 0, correct: 0 } };
  const id = flawed.fallacyId!;

  it('moves only the TRUE fallacy of flawed items and tracks stats', () => {
    let state = applyOutcome(empty, flawed, 'correct');
    expect(state.boxes[id]).toBe(2);
    expect(state.stats[id]).toEqual({ seen: 1, correct: 1 });
    state = applyOutcome(state, flawed, 'correct');
    state = applyOutcome(state, flawed, 'partial');
    expect(state.boxes[id]).toBe(2);
    expect(state.stats[id]).toEqual({ seen: 3, correct: 2 });
    state = applyOutcome(state, flawed, 'wrong');
    expect(state.boxes[id]).toBe(1);
    expect(Object.keys(state.boxes)).toEqual([id]);
  });

  it('sound items never change boxes, only soundStats', () => {
    const start = { boxes: { [id]: 3 as Box }, stats: {}, soundStats: { seen: 0, correct: 0 } };
    const after = applyOutcome(applyOutcome(start, sound, 'correct'), sound, 'wrong');
    expect(after.boxes).toEqual({ [id]: 3 });
    expect(after.soundStats).toEqual({ seen: 2, correct: 1 });
  });

  it('never mutates its input', () => {
    const start = { boxes: { [id]: 3 as Box }, stats: { [id]: { seen: 4, correct: 2 } }, soundStats: { seen: 1, correct: 1 } };
    const snapshot = JSON.stringify(start);
    applyOutcome(start, flawed, 'wrong');
    applyOutcome(start, sound, 'correct');
    expect(JSON.stringify(start)).toBe(snapshot);
  });
});

describe('mastery display', () => {
  it('mastery % = (box - 1) / 4; mastered = box 5', () => {
    expect([1, 2, 3, 4, 5].map((b) => masteryFraction(b as Box))).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(masteryPercent(3)).toBe(50);
    expect(masteryPercent(undefined)).toBe(0);
    expect(isMastered(5)).toBe(true);
    expect(isMastered(4)).toBe(false);
  });

  it('reports up/down changes and ignores unchanged boxes', () => {
    const changes = masteryChanges({ a: 2, b: 3, c: 1 }, { a: 3, b: 1, c: 1 }, ['a', 'b', 'c', 'a']);
    expect(changes).toEqual([
      { fallacyId: 'a', direction: 'up' },
      { fallacyId: 'b', direction: 'down' },
    ]);
  });
});
