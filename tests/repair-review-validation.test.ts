import { describe, expect, it } from 'vitest';
import { validateRepairReviews } from '../scripts/validate-repairs.mjs';
import { repairs } from '../src/data/repairs';

const item = (highlights: unknown, question = 'What evidence would help?') => ({
  id: 'rep_test',
  options: [{ correct: true, text: 'Check other changes and compare similar teams.' }],
  review: { highlights, question },
});

describe('authored repair teaching notes', () => {
  it('validates the whole production collection', () => {
    expect(validateRepairReviews(repairs)).toEqual([]);
  });

  it('rejects missing, ambiguous, reordered and overlapping excerpts', () => {
    expect(validateRepairReviews([item(['invented evidence'])])).not.toEqual([]);
    expect(validateRepairReviews([{
      ...item(['Check']), options: [{ correct: true, text: 'Check again. Check again.' }],
    }])).not.toEqual([]);
    expect(validateRepairReviews([item(['similar teams', 'other changes'])])).not.toEqual([]);
    expect(validateRepairReviews([item(['other changes', 'changes and compare'])])).not.toEqual([]);
  });

  it('rejects absent notes, empty excerpts, missing questions and ambiguous answers', () => {
    expect(validateRepairReviews([{ id: 'legacy', options: item([]).options }])).not.toEqual([]);
    expect(validateRepairReviews([item([])])).not.toEqual([]);
    expect(validateRepairReviews([item([''])])).not.toEqual([]);
    expect(validateRepairReviews([item(['other changes'], '')])).not.toEqual([]);
    expect(validateRepairReviews([{ ...item(['other changes']), options: [] }])).not.toEqual([]);
  });
});
