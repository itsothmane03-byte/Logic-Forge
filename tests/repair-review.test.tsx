// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import type { RepairItem } from '../src/engine/repair';
import { RepairRevision } from '../src/ui/components/RepairRevision';

const text = 'Compare all days, then check other changes before deciding.';
const review: NonNullable<RepairItem['review']> = {
  highlights: ['all days', 'other changes'], question: 'Could something else explain the change?',
};

afterEach(cleanup);

describe('the post-answer revision', () => {
  it.each([true, false])('preserves the whole revision and marks exactly the authored excerpts (chosen=%s)', (chosen) => {
    const { container } = render(<RepairRevision text={text} review={review} chosen={chosen} />);
    expect(container.querySelector('.repair-revision__text')?.textContent).toBe(text);
    expect([...container.querySelectorAll('mark')].map((mark) => mark.textContent)).toEqual(review.highlights);
    expect(screen.getByText('Highlighted words show what makes it stronger.')).toBeTruthy();
    expect(screen.getByText('Highlighted: “all days”; “other changes”')).toBeTruthy();
    expect(screen.getByRole('heading', { name: chosen ? 'Key changes' : 'A stronger revision' })).toBeTruthy();
  });

  it.each([
    { name: 'absent metadata', value: undefined },
    { name: 'empty highlights', value: { ...review, highlights: [] } },
    { name: 'missing excerpt', value: { ...review, highlights: ['absent words'] } },
    { name: 'reversed excerpts', value: { ...review, highlights: ['other changes', 'all days'] } },
    { name: 'overlapping excerpts', value: { ...review, highlights: ['check other changes', 'other changes'] } },
  ])('falls back to an unmarked stronger revision for $name', ({ value }) => {
    const { container } = render(<RepairRevision text={text} review={value} chosen={false} />);
    expect(screen.getByRole('heading', { name: 'A stronger revision' })).toBeTruthy();
    expect(container.querySelector('.repair-revision__text')?.textContent).toBe(text);
    expect(container.querySelector('mark')).toBeNull();
    expect(screen.queryByText('Highlighted words show what makes it stronger.')).toBeNull();
  });

  it('does not guess which occurrence of a repeated excerpt to highlight', () => {
    const repeated = 'Check the sample, then check the sample again.';
    const { container } = render(<RepairRevision text={repeated}
      review={{ ...review, highlights: ['the sample'] }} chosen={false} />);
    expect(container.querySelector('.repair-revision__text')?.textContent).toBe(repeated);
    expect(container.querySelector('mark')).toBeNull();
  });

  it.each([undefined, { ...review, highlights: ['missing'] }])('avoids repeating a chosen answer when it has no valid annotation (%s)', (value) => {
    const { container } = render(<RepairRevision text={text} review={value} chosen />);
    expect(container.textContent).toBe('');
  });

  it('renders authored text as text rather than interpreting HTML', () => {
    const literal = 'Compare <strong>all days</strong> & other changes.';
    const { container } = render(<RepairRevision text={literal}
      review={{ ...review, highlights: ['<strong>all days</strong>'] }} chosen={false} />);
    expect(container.querySelector('.repair-revision__text')?.textContent).toBe(literal);
    expect(container.querySelector('mark')?.textContent).toBe('<strong>all days</strong>');
    expect(container.querySelector('strong')).toBeNull();
  });
});
