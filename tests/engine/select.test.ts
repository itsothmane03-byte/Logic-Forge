import { describe, expect, it } from 'vitest';
import { rngFrom } from '../../src/engine/rng';
import {
  arrangeNoRepeats,
  BOX_WEIGHTS,
  fallacyWeight,
  pickDemoItem,
  reviewQueue,
  selectFocus,
  selectPractice,
  selectReview,
} from '../../src/engine/select';
import type { Attempt, Box, Item } from '../../src/engine/types';
import { attempt, fallacyOf, fixtureBank, fullBank, itemOf } from '../helpers';

const bank = fullBank();

function adjacentRepeats(ids: string[], previous: string | null = null): number {
  let count = 0;
  let prev = previous;
  for (const id of ids) {
    const f = fallacyOf(bank, id);
    if (f && f === prev) count++;
    prev = f;
  }
  return count;
}

describe('fallacyWeight', () => {
  const advanced = bank.fallacies.find((f) => f.difficulty === 'advanced')!;
  const beginner = bank.fallacies.find((f) => f.difficulty === 'beginner')!;

  it('uses Leitner box weights 5/3/2/1/0.5, with never-seen fallacies as box 1', () => {
    expect(BOX_WEIGHTS).toEqual({ 1: 5, 2: 3, 3: 2, 4: 1, 5: 0.5 });
    for (const box of [1, 2, 3, 4, 5] as Box[]) {
      expect(fallacyWeight(advanced, { [advanced.id]: box }, 100)).toBe(BOX_WEIGHTS[box]);
    }
    expect(fallacyWeight(advanced, {}, 100)).toBe(5);
  });

  it('boosts beginner fallacies x1.5 only while total attempts are under 30', () => {
    expect(fallacyWeight(beginner, {}, 0)).toBe(7.5);
    expect(fallacyWeight(beginner, {}, 29)).toBe(7.5);
    expect(fallacyWeight(beginner, {}, 30)).toBe(5);
    expect(fallacyWeight(advanced, {}, 0)).toBe(5);
  });
});

describe('selectPractice', () => {
  it('returns 10 unique items, exactly 2 of them sound', () => {
    for (let s = 0; s < 25; s++) {
      const ids = selectPractice({ bank, boxes: {}, attempts: [], rng: rngFrom(`p${s}`) });
      expect(ids).toHaveLength(10);
      expect(new Set(ids).size).toBe(10);
      expect(ids.filter((id) => itemOf(bank, id).isSound)).toHaveLength(2);
    }
  });

  it('never shows the same fallacy twice in a row', () => {
    for (let s = 0; s < 60; s++) {
      const ids = selectPractice({ bank, boxes: {}, attempts: [], rng: rngFrom(`adj${s}`) });
      expect(adjacentRepeats(ids)).toBe(0);
    }
  });

  it('does not start with the fallacy that was answered last', () => {
    for (let s = 0; s < 30; s++) {
      const last = bank.items[s * 8]!;
      const attempts = [attempt(last.id, 'wrong', 1)];
      const boxes: Record<string, Box> = { [last.fallacyId!]: 1 };
      const ids = selectPractice({ bank, boxes, attempts, rng: rngFrom(`prev${s}`) });
      expect(fallacyOf(bank, ids[0]!)).not.toBe(last.fallacyId);
    }
  });

  it('avoids items seen in the last 40 attempts when the pool allows', () => {
    const recent: Attempt[] = bank.items.slice(0, 40).map((item, i) => attempt(item.id, 'correct', i));
    const recentIds = new Set(recent.map((a) => a.itemId));
    for (let s = 0; s < 20; s++) {
      const ids = selectPractice({ bank, boxes: {}, attempts: recent, rng: rngFrom(`fresh${s}`) });
      expect(ids.filter((id) => recentIds.has(id))).toEqual([]);
    }
  });

  it('only looks at the last 40 attempts, not older ones', () => {
    const old = bank.items.slice(0, 8).map((item, i) => attempt(item.id, 'wrong', i));
    const filler = bank.items.slice(100, 140).map((item, i) => attempt(item.id, 'correct', 100 + i));
    const ids = selectPractice({ bank, boxes: {}, attempts: [...old, ...filler], rng: rngFrom('window') });
    const fillerIds = new Set(filler.map((a) => a.itemId));
    expect(ids.some((id) => fillerIds.has(id))).toBe(false);
  });

  it('falls back gracefully when every item was seen recently (small bank)', () => {
    const small = fixtureBank();
    const all = small.items.map((item, i) => attempt(item.id, 'correct', i));
    const ids = selectPractice({ bank: small, boxes: {}, attempts: all, rng: rngFrom('small') });
    expect(ids).toHaveLength(10);
    expect(new Set(ids).size).toBe(10);
  });

  it('shows low-box fallacies far more often than mastered ones', () => {
    const weak = bank.fallacies.find((f) => f.difficulty === 'advanced')!;
    const boxes: Record<string, Box> = Object.fromEntries(bank.fallacies.map((f) => [f.id, 5 as Box]));
    boxes[weak.id] = 1;
    let weakHits = 0;
    for (let s = 0; s < 200; s++) {
      const ids = selectPractice({ bank, boxes, attempts: [], rng: rngFrom(`weight${s}`) });
      if (ids.some((id) => fallacyOf(bank, id) === weak.id)) weakHits++;
    }
    // A box-1 fallacy (weight 5) among 37 box-5 ones (0.5) lands in nearly every set.
    expect(weakHits).toBeGreaterThan(150);
  });

  it('is deterministic for the same seed', () => {
    const a = selectPractice({ bank, boxes: {}, attempts: [], rng: rngFrom('same') });
    const b = selectPractice({ bank, boxes: {}, attempts: [], rng: rngFrom('same') });
    expect(a).toEqual(b);
  });
});

describe('arrangeNoRepeats', () => {
  const item = (id: string, fallacyId: string | null): Item => ({ ...bank.items[0]!, id, fallacyId, isSound: fallacyId === null });

  it('separates repeats whenever an arrangement exists', () => {
    const list = [item('a1', 'A'), item('a2', 'A'), item('a3', 'A'), item('b1', 'B'), item('c1', 'C')];
    const out = arrangeNoRepeats(list).map((i) => i.fallacyId);
    for (let i = 1; i < out.length; i++) expect(out[i]).not.toBe(out[i - 1]);
  });

  it('respects the previous fallacy and treats sound items as neutral', () => {
    const list = [item('a1', 'A'), item('s1', null), item('b1', 'B')];
    expect(arrangeNoRepeats(list, 'A')[0]!.fallacyId).not.toBe('A');
  });

  it('keeps every item when no valid arrangement exists', () => {
    const list = [item('a1', 'A'), item('a2', 'A')];
    expect(arrangeNoRepeats(list).map((i) => i.id).sort()).toEqual(['a1', 'a2']);
  });
});

describe('selectFocus', () => {
  const target = bank.fallacies.find((f) => f.id === 'fal_ad_hominem')!;

  it('has 6 flawed of X, 2 flawed from its confusables and 2 sound items resembling X', () => {
    const ids = selectFocus({ bank, fallacyId: target.id, rng: rngFrom('focus') });
    const items = ids.map((id) => itemOf(bank, id));
    expect(ids).toHaveLength(10);
    expect(new Set(ids).size).toBe(10);
    expect(items.filter((i) => i.fallacyId === target.id)).toHaveLength(6);
    const confusable = items.filter((i) => !i.isSound && i.fallacyId !== target.id);
    expect(confusable).toHaveLength(2);
    expect(confusable.map((i) => i.fallacyId).sort()).toEqual([...target.confusableWith.slice(0, 2)].sort());
    const sound = items.filter((i) => i.isSound);
    expect(sound).toHaveLength(2);
    expect(sound.every((i) => i.resembles === target.id)).toBe(true);
  });

  it('is shuffled and deterministic per seed', () => {
    const a = selectFocus({ bank, fallacyId: target.id, rng: rngFrom('f1') });
    expect(selectFocus({ bank, fallacyId: target.id, rng: rngFrom('f1') })).toEqual(a);
    expect(selectFocus({ bank, fallacyId: target.id, rng: rngFrom('f2') })).not.toEqual(a);
  });

  it('tops up from the same family when confusables are missing (partial banks)', () => {
    const small = fixtureBank();
    const ids = selectFocus({ bank: small, fallacyId: 'fal_ad_hominem', rng: rngFrom('fx') });
    const items = ids.map((id) => itemOf(small, id));
    expect(ids).toHaveLength(10);
    expect(items.filter((i) => i.fallacyId === 'fal_ad_hominem')).toHaveLength(6);
    // Ad hominem's confusables are not in the fixtures; straw man shares its family.
    expect(items.filter((i) => i.fallacyId === 'fal_straw_man')).toHaveLength(2);
  });

  it('returns nothing for an unknown fallacy', () => {
    expect(selectFocus({ bank, fallacyId: 'fal_nope', rng: rngFrom('x') })).toEqual([]);
  });
});

describe('review', () => {
  it('keeps only items whose latest attempt was partial or wrong, most recent first', () => {
    const attempts = [
      attempt('a', 'wrong', 1),
      attempt('b', 'partial', 2),
      attempt('c', 'correct', 3),
      attempt('a', 'correct', 4), // fixed later: drops out
      attempt('d', 'wrong', 5),
      attempt('c', 'partial', 6), // missed later: comes back
    ];
    expect(reviewQueue(attempts)).toEqual(['c', 'd', 'b']);
  });

  it('caps the session at 10 and drops items missing from the bank', () => {
    const attempts = Array.from({ length: 14 }, (_, i) => attempt(`i${i}`, 'wrong', i));
    expect(selectReview(attempts)).toHaveLength(10);
    expect(selectReview(attempts)[0]).toBe('i13');
    expect(reviewQueue(attempts, new Set(['i2', 'i5']))).toEqual(['i5', 'i2']);
  });

  it('is empty (mode disabled) when there are no misses', () => {
    expect(selectReview([])).toEqual([]);
    expect(selectReview([attempt('a', 'correct', 1)])).toEqual([]);
  });
});

describe('pickDemoItem', () => {
  it('picks a flawed difficulty-1 item of a beginner fallacy', () => {
    const demo = pickDemoItem(bank)!;
    expect(demo.isSound).toBe(false);
    expect(demo.difficulty).toBe(1);
    expect(bank.fallacies.find((f) => f.id === demo.fallacyId)?.difficulty).toBe('beginner');
  });
});
