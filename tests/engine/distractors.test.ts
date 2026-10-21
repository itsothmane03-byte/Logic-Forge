import { describe, expect, it } from 'vitest';
import { buildOptions, OPTION_COUNT } from '../../src/engine/distractors';
import type { Fallacy } from '../../src/engine/types';
import { fullBank, makeFallacy } from '../helpers';

const bank = fullBank();

describe('buildOptions', () => {
  it('always returns 4 unique options including the correct answer', () => {
    for (const f of bank.fallacies) {
      const options = buildOptions(bank.fallacies, f.id, 'seed', `itm_${f.id}`);
      expect(options).toHaveLength(OPTION_COUNT);
      expect(new Set(options).size).toBe(OPTION_COUNT);
      expect(options).toContain(f.id);
    }
  });

  it('includes the first two confusables (the closest look-alikes)', () => {
    for (const f of bank.fallacies) {
      const options = buildOptions(bank.fallacies, f.id, 'seed', `itm_${f.id}`);
      for (const id of f.confusableWith.slice(0, 2)) expect(options).toContain(id);
    }
  });

  it('fills the rest from the same family before other families', () => {
    const adHominem = bank.fallacies.find((f) => f.id === 'fal_ad_hominem')!;
    const options = buildOptions(bank.fallacies, adHominem.id, 'seed', 'itm_x');
    const extra = options.filter((id) => id !== adHominem.id && !adHominem.confusableWith.slice(0, 2).includes(id));
    expect(extra).toHaveLength(1);
    expect(bank.fallacies.find((f) => f.id === extra[0])?.family).toBe('distraction');
  });

  it('skips confusables that are not in the bank and keeps confusable order', () => {
    const fallacies: Fallacy[] = [
      makeFallacy('fal_a', 'framing', 'beginner', ['fal_missing', 'fal_b', 'fal_c', 'fal_d']),
      makeFallacy('fal_b', 'framing', 'beginner', []),
      makeFallacy('fal_c', 'framing', 'beginner', []),
      makeFallacy('fal_d', 'framing', 'beginner', []),
      makeFallacy('fal_e', 'language', 'beginner', []),
    ];
    const options = buildOptions(fallacies, 'fal_a', 's', 'i');
    expect(options).toContain('fal_b');
    expect(options).toContain('fal_c');
    expect(options).not.toContain('fal_missing');
    // The 4th comes from the same family (framing): fal_d, not fal_e.
    expect(options).toContain('fal_d');
  });

  it('is deterministic for (sessionSeed, itemId) and varies across items', () => {
    const a = buildOptions(bank.fallacies, 'fal_straw_man', 'session-1', 'itm_straw_man_01');
    expect(buildOptions(bank.fallacies, 'fal_straw_man', 'session-1', 'itm_straw_man_01')).toEqual(a);
    const positions = new Set<number>();
    for (let i = 0; i < 40; i++) {
      positions.add(buildOptions(bank.fallacies, 'fal_straw_man', `session-${i}`, 'itm_straw_man_01').indexOf('fal_straw_man'));
    }
    expect(positions.size).toBe(4); // the right answer shows up in every slot
  });

  it('returns as many unique options as exist for tiny banks', () => {
    const tiny = bank.fallacies.slice(0, 2);
    const options = buildOptions(tiny, tiny[0]!.id, 's', 'i');
    expect(options).toHaveLength(2);
    expect(new Set(options).size).toBe(2);
  });
});
