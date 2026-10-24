import { describe, expect, it } from 'vitest';
import bankJson from '../../src/data/bank.json';
import { repairs } from '../../src/data/repairs';
import { REPAIR_SESSION_SIZE, repairOptions, selectRepairs, type RepairItem } from '../../src/engine/repair';

const familyOf = new Map(bankJson.fallacies.map((f) => [f.id, f.family]));

function item(id: string): RepairItem {
  return {
    id,
    title: `Title ${id}`,
    fallacyId: 'fal_straw_man',
    passage: 'An original argument.',
    principle: 'A principle.',
    options: [
      { id: 'a', text: 'Option A', correct: true, explanation: 'Why A.' },
      { id: 'b', text: 'Option B', correct: false, explanation: 'Why B.' },
      { id: 'c', text: 'Option C', correct: false, explanation: 'Why C.' },
    ],
  };
}

const pool = (n: number): RepairItem[] => Array.from({ length: n }, (_, i) => item(`rep_${i + 1}`));
const idsOf = (items: readonly RepairItem[]): string[] => items.map((i) => i.id);
const sorted = (ids: readonly string[]): string[] => [...ids].sort();

describe('selectRepairs', () => {
  it('picks five distinct exercises by default', () => {
    const picked = selectRepairs(repairs, [], 'seed-1');
    expect(REPAIR_SESSION_SIZE).toBe(5);
    expect(picked).toHaveLength(5);
    expect(new Set(idsOf(picked)).size).toBe(5);
  });

  it('is deterministic for a seed and varies across seeds', () => {
    expect(idsOf(selectRepairs(repairs, [], 'same'))).toEqual(idsOf(selectRepairs(repairs, [], 'same')));
    const sets = new Set(Array.from({ length: 8 }, (_, i) => sorted(idsOf(selectRepairs(repairs, [], `s${i}`))).join()));
    expect(sets.size).toBeGreaterThan(1);
  });

  it('takes never-answered exercises first, then the least recently answered', () => {
    const recent = ['rep_1', 'rep_2', 'rep_3', 'rep_4', 'rep_5'];
    const picked = selectRepairs(pool(8), recent, 'seed');
    expect(sorted(idsOf(picked))).toEqual(sorted(['rep_6', 'rep_7', 'rep_8', 'rep_1', 'rep_2']));
  });

  it('counts the latest answer when an exercise was answered more than once', () => {
    const picked = selectRepairs(pool(3), ['rep_1', 'rep_2', 'rep_3', 'rep_1'], 'seed', 2);
    expect(sorted(idsOf(picked))).toEqual(['rep_2', 'rep_3']);
  });

  it('avoids recent sessions and gets through the whole bank before repeating', () => {
    const recent: string[] = [];
    const sessions: string[][] = [];
    for (let s = 0; s < 6; s++) {
      const ids = idsOf(selectRepairs(repairs, recent, `session-${s}`));
      sessions.push(ids);
      recent.push(...ids);
    }
    const freshRounds = sessions.slice(0, Math.floor(repairs.length / REPAIR_SESSION_SIZE)).flat();
    expect(new Set(freshRounds).size).toBe(freshRounds.length);
    const coverRounds = sessions.slice(0, Math.ceil(repairs.length / REPAIR_SESSION_SIZE)).flat();
    expect(new Set(coverRounds).size).toBe(repairs.length);
    for (let s = 1; s < sessions.length; s++) {
      expect(sessions[s]!.filter((id) => sessions[s - 1]!.includes(id))).toEqual([]);
    }
  });

  it('returns the whole pool, without duplicates, when it is smaller than a session', () => {
    expect(sorted(idsOf(selectRepairs(pool(3), [], 'seed')))).toEqual(['rep_1', 'rep_2', 'rep_3']);
  });

  it('ignores duplicate items and unknown ids in the history', () => {
    const items = [...pool(4), item('rep_2')];
    expect(sorted(idsOf(selectRepairs(items, ['rep_gone', 'rep_1'], 'seed', 10)))).toEqual(['rep_1', 'rep_2', 'rep_3', 'rep_4']);
    expect(idsOf(selectRepairs(items, ['rep_gone', 'rep_1'], 'seed', 3))).not.toContain('rep_1');
  });

  it('honours a custom size and never mutates its inputs', () => {
    const items = Object.freeze(pool(6));
    const recent = Object.freeze(['rep_1']);
    expect(selectRepairs(items, recent, 'seed', 2)).toHaveLength(2);
    expect(selectRepairs(items, recent, 'seed', 0)).toEqual([]);
    expect(idsOf(items)).toEqual(idsOf(pool(6)));
  });

  it('keeps question selection and option order unchanged when teaching notes are added', () => {
    const legacy = pool(8);
    const annotated = legacy.map((exercise) => ({
      ...exercise,
      review: { highlights: ['Option A'], question: 'What evidence would support this?' },
    }));
    const recent = ['rep_2', 'rep_4', 'rep_6'];
    const picked = selectRepairs(annotated, recent, 'review-compatibility');
    expect(idsOf(picked)).toEqual(idsOf(selectRepairs(legacy, recent, 'review-compatibility')));
    for (const exercise of picked) {
      const original = legacy.find((candidate) => candidate.id === exercise.id)!;
      expect(repairOptions(exercise, 'review-compatibility')).toEqual(repairOptions(original, 'review-compatibility'));
      expect(exercise.review).toEqual({ highlights: ['Option A'], question: 'What evidence would support this?' });
    }
  });
});

describe('repairOptions', () => {
  it('returns the same three options, in an order fixed by the seed', () => {
    for (const r of repairs) {
      const shuffled = repairOptions(r, 'seed');
      expect(sorted(shuffled.map((o) => o.id))).toEqual(sorted(r.options.map((o) => o.id)));
      expect(repairOptions(r, 'seed')).toEqual(shuffled);
    }
  });

  it('moves the strongest repair across all three positions', () => {
    for (const r of repairs) {
      const positions = new Set(Array.from({ length: 30 }, (_, i) => repairOptions(r, `s${i}`).findIndex((o) => o.correct)));
      expect([...positions].sort(), r.id).toEqual([0, 1, 2]);
    }
  });

  it('leaves the authored order untouched', () => {
    const r = item('rep_x');
    repairOptions(r, 'seed');
    expect(r.options.map((o) => o.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('the shipped repair bank', () => {
  it('has at least 12 exercises with unique ids', () => {
    const ids = repairs.map((r) => r.id);
    expect(ids.length).toBeGreaterThanOrEqual(12);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^rep_[a-z0-9_]+$/);
  });

  it('links every exercise to the fallacy library, across varied fallacies', () => {
    for (const r of repairs) expect(familyOf.has(r.fallacyId), `${r.id}: ${r.fallacyId}`).toBe(true);
    const uses = new Map<string, number>();
    for (const r of repairs) uses.set(r.fallacyId, (uses.get(r.fallacyId) ?? 0) + 1);
    expect(uses.size).toBeGreaterThanOrEqual(10);
    expect(Math.max(...uses.values())).toBeLessThanOrEqual(2);
    expect(new Set(repairs.map((r) => familyOf.get(r.fallacyId))).size).toBeGreaterThanOrEqual(5);
  });

  it('gives each exercise three options with exactly one strongest repair', () => {
    for (const r of repairs) {
      expect(r.options, r.id).toHaveLength(3);
      expect(new Set(r.options.map((o) => o.id)).size, r.id).toBe(3);
      expect(r.options.filter((o) => o.correct), r.id).toHaveLength(1);
      expect(new Set(r.options.map((o) => o.explanation)).size, r.id).toBe(3);
      for (const text of [r.title, r.passage, r.principle, ...r.options.flatMap((o) => [o.text, o.explanation])]) {
        expect(text.trim().length, r.id).toBeGreaterThan(0);
      }
    }
  });

  it("keeps option lengths close, so length doesn't give the answer away", () => {
    let longest = 0;
    let shortest = 0;
    for (const r of repairs) {
      const lengths = r.options.map((o) => o.text.length);
      expect(Math.max(...lengths) / Math.min(...lengths), r.id).toBeLessThanOrEqual(1.2);
      const best = r.options.find((o) => o.correct)!.text.length;
      const others = r.options.filter((o) => !o.correct).map((o) => o.text.length);
      if (best > Math.max(...others)) longest += 1;
      if (best < Math.min(...others)) shortest += 1;
    }
    expect(longest / repairs.length).toBeLessThanOrEqual(0.4);
    expect(shortest / repairs.length).toBeLessThanOrEqual(0.4);
  });

  it('never says a repair proves the claim', () => {
    const overclaim = /\b(prove[sdn]?|proving|proof|definitely|guarantee[sd]?)\b/i;
    for (const r of repairs) {
      const best = r.options.find((o) => o.correct)!;
      for (const text of [r.principle, best.text, ...r.options.map((o) => o.explanation)]) {
        expect(text, r.id).not.toMatch(overclaim);
      }
    }
  });
});
