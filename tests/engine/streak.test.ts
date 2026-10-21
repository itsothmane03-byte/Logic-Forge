import { describe, expect, it } from 'vitest';
import { dateKey } from '../../src/engine/dates';
import { recordAnswer } from '../../src/engine/session';
import { defaultProgress } from '../../src/engine/storage';
import { bestStreak, currentStreak, longestStreak } from '../../src/engine/streak';
import { fullBank } from '../helpers';

const days = (...keys: string[]) => Object.fromEntries(keys.map((k) => [k, 10]));

describe('currentStreak', () => {
  it('is 0 with no history', () => {
    expect(currentStreak({}, '2026-10-20')).toBe(0);
  });

  it('counts consecutive days back from today', () => {
    expect(currentStreak(days('2026-10-18', '2026-10-19', '2026-10-20'), '2026-10-20')).toBe(3);
  });

  it('counts back from yesterday when today has no answers yet', () => {
    expect(currentStreak(days('2026-10-18', '2026-10-19'), '2026-10-20')).toBe(2);
  });

  it('breaks on a gap', () => {
    expect(currentStreak(days('2026-10-17', '2026-10-18', '2026-10-20'), '2026-10-20')).toBe(1);
    expect(currentStreak(days('2026-10-15', '2026-10-16', '2026-10-17'), '2026-10-20')).toBe(0);
  });

  it('ignores zero-count days', () => {
    expect(currentStreak({ '2026-10-19': 0, '2026-10-20': 3 }, '2026-10-20')).toBe(1);
  });

  it('treats answers just before and just after midnight as two days', () => {
    const lateNight = new Date(2026, 9, 19, 23, 59, 30).getTime();
    const justAfter = new Date(2026, 9, 20, 0, 0, 30).getTime();
    const history = { [dateKey(lateNight)]: 1, [dateKey(justAfter)]: 1 };
    expect(Object.keys(history)).toEqual(['2026-10-19', '2026-10-20']);
    expect(currentStreak(history, '2026-10-20')).toBe(2);
  });

  it('runs across month, year and DST boundaries', () => {
    expect(currentStreak(days('2026-12-30', '2026-12-31', '2027-01-01'), '2027-01-01')).toBe(3);
    expect(currentStreak(days('2026-10-31', '2026-11-01', '2026-11-02'), '2026-11-02')).toBe(3);
    expect(currentStreak(days('2027-03-13', '2027-03-14', '2027-03-15'), '2027-03-15')).toBe(3);
  });
});

describe('best streak', () => {
  it('finds the longest run anywhere in the history', () => {
    expect(longestStreak(days('2026-01-01', '2026-01-02', '2026-01-03', '2026-02-10', '2026-02-11'))).toBe(3);
    expect(longestStreak({})).toBe(0);
    expect(longestStreak({ 'not-a-date': 4 })).toBe(0);
  });

  it('is the max of the stored best, the longest run and the current run', () => {
    expect(bestStreak(9, days('2026-10-20'), '2026-10-20')).toBe(9);
    expect(bestStreak(1, days('2026-10-18', '2026-10-19', '2026-10-20'), '2026-10-20')).toBe(3);
  });

  it('is updated after every answer', () => {
    const bank = fullBank();
    const item = bank.items[0]!;
    let progress = { ...defaultProgress(), days: days('2026-10-18', '2026-10-19') };
    progress = recordAnswer(progress, item, 'correct', { mode: 'practice', at: new Date(2026, 9, 20, 9).getTime() });
    expect(progress.days['2026-10-20']).toBe(1);
    expect(progress.bestStreak).toBe(3);
  });
});
