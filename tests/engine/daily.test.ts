import { describe, expect, it } from 'vitest';
import { buildDaily, dailyNumber, DAILY_EPOCH } from '../../src/engine/daily';
import { addDays, dateKey, daysBetween, msUntilMidnight } from '../../src/engine/dates';
import { rngFrom, shuffle } from '../../src/engine/rng';
import { fixtureBank, fullBank, itemOf } from '../helpers';

describe('dates', () => {
  it('dateKey uses the local calendar day, including just before and after midnight', () => {
    expect(dateKey(new Date(2026, 9, 20, 23, 59, 59))).toBe('2026-10-20');
    expect(dateKey(new Date(2026, 9, 21, 0, 0, 1))).toBe('2026-10-21');
    expect(dateKey(new Date(2027, 0, 1, 0, 0))).toBe('2027-01-01');
  });

  it('counts whole days across month, year and DST boundaries', () => {
    expect(daysBetween('2026-10-31', '2026-11-01')).toBe(1); // US DST ends 2026-11-01
    expect(daysBetween('2027-03-13', '2027-03-15')).toBe(2); // US DST starts 2027-03-14
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('msUntilMidnight counts down to the next local day', () => {
    expect(msUntilMidnight(new Date(2026, 9, 20, 23, 0, 0))).toBe(3_600_000);
    expect(msUntilMidnight(new Date(2026, 9, 20, 0, 0, 0))).toBe(86_400_000);
  });
});

describe('dailyNumber', () => {
  it('is 1 on the epoch day and counts up by one per day', () => {
    expect(DAILY_EPOCH).toBe('2026-10-20');
    expect(dailyNumber('2026-10-20')).toBe(1);
    expect(dailyNumber('2026-10-21')).toBe(2);
    expect(dailyNumber('2026-11-02')).toBe(14);
    expect(dailyNumber('2027-10-20')).toBe(366);
  });

  it('never goes below 1 (clock set before launch, or bad input)', () => {
    expect(dailyNumber('2026-10-01')).toBe(1);
    expect(dailyNumber('not-a-date')).toBe(1);
  });
});

describe('buildDaily on a full-size bank', () => {
  const bank = fullBank();

  it('is deterministic for the same date and bank', () => {
    expect(buildDaily(bank.items, '2026-10-20')).toEqual(buildDaily(bank.items, '2026-10-20'));
  });

  it('does not depend on the order items arrive in (sorted by id first)', () => {
    const scrambled = shuffle(bank.items, rngFrom('scramble'));
    expect(buildDaily(scrambled, '2026-11-05')).toEqual(buildDaily(bank.items, '2026-11-05'));
  });

  it('has 8 flawed items from 8 distinct fallacies (3 x d1, 3 x d2, 2 x d3) plus 2 sound, all unique', () => {
    for (let d = 0; d < 40; d++) {
      const key = addDays('2026-10-20', d);
      const ids = buildDaily(bank.items, key);
      const items = ids.map((id) => itemOf(bank, id));
      const flawed = items.filter((i) => !i.isSound);
      const sound = items.filter((i) => i.isSound);
      expect(ids).toHaveLength(10);
      expect(new Set(ids).size).toBe(10);
      expect(flawed).toHaveLength(8);
      expect(sound).toHaveLength(2);
      expect(new Set(flawed.map((i) => i.fallacyId)).size).toBe(8);
      const mix = [1, 2, 3].map((n) => flawed.filter((i) => i.difficulty === n).length);
      expect(mix).toEqual([3, 3, 2]);
    }
  });

  it('almost always differs between dates', () => {
    const sets = new Set<string>();
    for (let d = 0; d < 60; d++) sets.add([...buildDaily(bank.items, addDays('2026-10-20', d))].sort().join(','));
    expect(sets.size).toBe(60);
    // Adjacent days share few items.
    const a = new Set(buildDaily(bank.items, '2026-12-01'));
    const b = buildDaily(bank.items, '2026-12-02');
    expect(b.filter((id) => a.has(id)).length).toBeLessThanOrEqual(3);
  });

  it('shuffles sound items into the order instead of appending them', () => {
    const positions = new Set<number>();
    for (let d = 0; d < 30; d++) {
      const ids = buildDaily(bank.items, addDays('2027-01-01', d));
      ids.forEach((id, i) => {
        if (itemOf(bank, id).isSound) positions.add(i);
      });
    }
    expect(positions.size).toBeGreaterThan(6);
  });
});

describe('buildDaily on a small bank (dev fixtures)', () => {
  const bank = fixtureBank();

  it('still builds 10 unique items with the same mix, repeating fallacies as rarely as possible', () => {
    const ids = buildDaily(bank.items, '2026-10-20');
    const items = ids.map((id) => itemOf(bank, id));
    const flawed = items.filter((i) => !i.isSound);
    expect(new Set(ids).size).toBe(10);
    expect(items.filter((i) => i.isSound)).toHaveLength(2);
    expect([1, 2, 3].map((n) => flawed.filter((i) => i.difficulty === n).length)).toEqual([3, 3, 2]);
    const perFallacy = new Map<string, number>();
    for (const i of flawed) perFallacy.set(i.fallacyId ?? '', (perFallacy.get(i.fallacyId ?? '') ?? 0) + 1);
    expect(Math.max(...perFallacy.values())).toBe(2);
  });
});
