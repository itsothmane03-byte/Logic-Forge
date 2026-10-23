import { describe, expect, it } from 'vitest';
import bankJson from '../../src/data/bank.json';
import { INTEREST_IDS, INTERESTS, isAdaptiveEligible, isInterestId, matchesInterests } from '../../src/engine/interests';

const tagsOf = (id: string) => INTERESTS.find((interest) => interest.id === id)!.tags;

describe('INTERESTS', () => {
  it('offers Everyday life, Work and Technology with non-overlapping tags', () => {
    expect(INTERESTS.map((interest) => [interest.id, interest.label])).toEqual([
      ['everyday', 'Everyday life'], ['work', 'Work'], ['tech', 'Technology'],
    ]);
    expect(INTEREST_IDS).toEqual(['everyday', 'work', 'tech']);
    expect(tagsOf('work')).toEqual(['workplace']);
    expect(tagsOf('tech')).toEqual(['tech', 'science']);
    const all = INTERESTS.flatMap((interest) => interest.tags);
    expect(new Set(all).size).toBe(all.length);
    expect(tagsOf('everyday')).not.toContain('workplace');
  });

  it('covers every topic tag used in the shipped bank', () => {
    const known = new Set(INTERESTS.flatMap((interest) => interest.tags));
    const used = new Set(bankJson.items.flatMap((item) => item.tags));
    expect([...used].filter((tag) => !known.has(tag))).toEqual([]);
  });
});

describe('matchesInterests', () => {
  it('treats no interests as "Mix everything"', () => {
    expect(matchesInterests({ tags: [] }, [])).toBe(true);
    expect(matchesInterests({ tags: ['workplace'] }, [])).toBe(true);
  });

  it('matches an item when any of its tags belongs to a chosen interest', () => {
    expect(matchesInterests({ tags: ['workplace'] }, ['work'])).toBe(true);
    expect(matchesInterests({ tags: ['science'] }, ['tech'])).toBe(true);
    expect(matchesInterests({ tags: ['money'] }, ['everyday'])).toBe(true);
    expect(matchesInterests({ tags: ['money'] }, ['work', 'tech'])).toBe(false);
    expect(matchesInterests({ tags: ['money', 'workplace'] }, ['work'])).toBe(true);
    expect(matchesInterests({ tags: ['unknown-topic'] }, ['everyday', 'work', 'tech'])).toBe(false);
  });
});

describe('guards', () => {
  it('recognizes only the three interest ids', () => {
    expect(INTEREST_IDS.every(isInterestId)).toBe(true);
    for (const value of ['Work', 'workplace', '', null, 3, {}]) expect(isInterestId(value)).toBe(false);
  });

  it('keeps general, explained and unannotated passages out of the specialist filter', () => {
    expect(isAdaptiveEligible({})).toBe(true);
    expect(isAdaptiveEligible({ backgroundKnowledge: 'general' })).toBe(true);
    expect(isAdaptiveEligible({ backgroundKnowledge: 'explained' })).toBe(true);
    expect(isAdaptiveEligible({ backgroundKnowledge: 'specialist' })).toBe(false);
  });
});
