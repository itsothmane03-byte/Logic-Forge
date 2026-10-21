import { describe, expect, it } from 'vitest';
import { mulberry32, pickOne, rngFrom, seedFrom, shuffle, weightedIndex } from '../../src/engine/rng';

describe('mulberry32', () => {
  it('matches the reference implementation (golden values)', () => {
    const rng = mulberry32(1);
    expect(rng()).toBe(0.6270739405881613);
    expect(rng()).toBe(0.002735721180215478);
    expect(rng()).toBe(0.5274470399599522);
  });

  it('is deterministic for the same seed and differs across seeds', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const c = mulberry32(43);
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    const seqC = Array.from({ length: 20 }, () => c());
    expect(seqA).toEqual(seqB);
    expect(seqA).not.toEqual(seqC);
  });

  it('returns floats in [0, 1)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 5000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('seedFrom (FNV-1a)', () => {
  it('matches the official 32-bit FNV-1a test vectors', () => {
    expect(seedFrom('')).toBe(0x811c9dc5);
    expect(seedFrom('a')).toBe(0xe40c292c);
    expect(seedFrom('foobar')).toBe(0xbf9cf968);
  });

  it('is stable and unsigned', () => {
    expect(seedFrom('daily:2026-10-20')).toBe(seedFrom('daily:2026-10-20'));
    expect(seedFrom('daily:2026-10-20')).not.toBe(seedFrom('daily:2026-10-21'));
    expect(seedFrom('any text')).toBeGreaterThanOrEqual(0);
  });
});

describe('shuffle', () => {
  const input = Array.from({ length: 30 }, (_, i) => i);

  it('is deterministic for the same rng seed', () => {
    expect(shuffle(input, rngFrom('x'))).toEqual(shuffle(input, rngFrom('x')));
    expect(shuffle(input, rngFrom('x'))).not.toEqual(shuffle(input, rngFrom('y')));
  });

  it('returns a permutation and never mutates the input', () => {
    const copy = input.slice();
    const out = shuffle(input, rngFrom('perm'));
    expect(input).toEqual(copy);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
    expect(out).not.toBe(input);
  });

  it('handles empty and single-element arrays', () => {
    expect(shuffle([], rngFrom('e'))).toEqual([]);
    expect(shuffle(['only'], rngFrom('e'))).toEqual(['only']);
  });
});

describe('pickOne and weightedIndex', () => {
  it('pickOne returns undefined for an empty list', () => {
    expect(pickOne([], rngFrom('p'))).toBeUndefined();
    expect(pickOne(['a'], rngFrom('p'))).toBe('a');
  });

  it('never picks non-positive weights', () => {
    const rng = rngFrom('w');
    for (let i = 0; i < 500; i++) {
      expect(weightedIndex([0, 3, 0, -1], rng)).toBe(1);
    }
    expect(weightedIndex([0, 0], rng)).toBe(-1);
    expect(weightedIndex([], rng)).toBe(-1);
  });

  it('picks roughly in proportion to weight', () => {
    const rng = rngFrom('proportion');
    const counts = [0, 0];
    for (let i = 0; i < 6000; i++) counts[weightedIndex([5, 1], rng)]! += 1;
    const ratio = counts[0]! / counts[1]!;
    expect(ratio).toBeGreaterThan(4);
    expect(ratio).toBeLessThan(6.2);
  });
});
