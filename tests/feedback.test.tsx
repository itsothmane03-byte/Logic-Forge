// @vitest-environment jsdom
// Feedback must describe the learner's actual answer, never an unrelated fallback.

import { cleanup, render, screen, within } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import type { AnswerPick } from '../src/engine/session';
import type { Item, Outcome } from '../src/engine/types';
import { bank, fallacyById, fallacyName } from '../src/state/store';
import { FeedbackSheet } from '../src/ui/components/Feedback';

const flawed = bank.items.find((item) => item.fallacyId === 'fal_ad_hominem')!;
const sound = bank.items.find((item) => item.isSound)!;
const [nearbyId, nearbyText] = Object.entries(flawed.whyNot)[0]!;
const truth = fallacyById.get(flawed.fallacyId!)!;
const contrastId = Object.keys(truth.contrast).find((id) => !flawed.whyNot[id])!;
const unrelatedId = bank.fallacies.find((fallacy) => fallacy.id !== truth.id
  && !flawed.whyNot[fallacy.id] && !truth.contrast[fallacy.id])!.id;

function show(item: Item, outcome: Outcome, pick: AnswerPick | null) {
  render(<FeedbackSheet item={item} outcome={outcome} pick={pick} isLast={false}
    onContinue={() => {}} onOpenFallacy={() => {}} />);
  return screen.getByRole('status');
}

afterEach(cleanup);

describe('answer-specific feedback', () => {
  it('does not invent a fallacy choice when a flawed argument was called sound', () => {
    const feedback = show(flawed, 'wrong', { spot: 'sound', named: null });
    expect(feedback.textContent).toContain("There's a flaw here.");
    expect(feedback.textContent).toContain(flawed.explanation);
    expect(feedback.querySelector('.sheet__why')).toBeNull();
  });

  it('explains the actual selected near miss using the passage-specific comparison', () => {
    const feedback = show(flawed, 'partial', { spot: 'flawed', named: nearbyId });
    expect(feedback.querySelector('.sheet__why')?.textContent).toContain(`Why not ${fallacyName(nearbyId)}?`);
    expect(feedback.querySelector('.sheet__why')?.textContent).toContain(nearbyText);
    const comparison = screen.getByRole('region', { name: `Why not ${fallacyName(nearbyId)}?` });
    expect(within(comparison).getByText('The flaw here')).toBeTruthy();
    expect(within(comparison).getByText(truth.name)).toBeTruthy();
    expect(within(comparison).getByText(truth.shortDef)).toBeTruthy();
    expect(within(comparison).getByText('Your pick')).toBeTruthy();
    expect(within(comparison).getByText(fallacyName(nearbyId))).toBeTruthy();
    expect(within(comparison).getByText(fallacyById.get(nearbyId)!.shortDef)).toBeTruthy();
  });

  it('can explain another selected near miss using the library contrast', () => {
    const feedback = show(flawed, 'partial', { spot: 'flawed', named: contrastId });
    expect(feedback.querySelector('.sheet__why')?.textContent).toContain(`Why not ${fallacyName(contrastId)}?`);
    expect(feedback.querySelector('.sheet__why')?.textContent).toContain(truth.contrast[contrastId]);
    expect(feedback.querySelector('.sheet__why')?.textContent).not.toContain(nearbyText);
  });

  it('keeps the explanation honest when the selected fallacy has no written comparison', () => {
    const feedback = show(flawed, 'partial', { spot: 'flawed', named: unrelatedId });
    expect(feedback.textContent).toContain(`You picked ${fallacyName(unrelatedId)}.`);
    expect(feedback.textContent).toContain(flawed.explanation);
    expect(feedback.querySelector('.sheet__why')).toBeNull();
  });

  it('does not imply a different choice after a correct identification', () => {
    const feedback = show(flawed, 'correct', { spot: 'flawed', named: flawed.fallacyId });
    expect(feedback.textContent).toContain('Spot on.');
    expect(feedback.querySelector('.sheet__why')).toBeNull();
  });

  it.each(['correct', 'wrong'] as const)('explains a sound argument without an invented choice (%s)', (outcome) => {
    const feedback = show(sound, outcome, { spot: outcome === 'correct' ? 'sound' : 'flawed', named: null });
    expect(feedback.textContent).toContain(sound.explanation);
    expect(feedback.querySelector('.sheet__why')).toBeNull();
  });

  it('does not infer a selected fallacy from a missing saved pick', () => {
    const feedback = show(flawed, 'partial', null);
    expect(feedback.textContent).toContain(flawed.explanation);
    expect(feedback.querySelector('.sheet__why')).toBeNull();
  });

  it('replaces or removes the comparison when the reviewed answer changes', () => {
    const common = { item: flawed, isLast: false, onContinue: () => {}, onOpenFallacy: () => {} };
    const view = render(<FeedbackSheet {...common} outcome="partial" pick={{ spot: 'flawed', named: nearbyId }} />);
    expect(screen.getByRole('region', { name: `Why not ${fallacyName(nearbyId)}?` })).toBeTruthy();

    view.rerender(<FeedbackSheet {...common} outcome="partial" pick={{ spot: 'flawed', named: contrastId }} />);
    const nextComparison = screen.getByRole('region', { name: `Why not ${fallacyName(contrastId)}?` });
    expect(nextComparison.textContent).toContain(truth.contrast[contrastId]);
    expect(screen.queryByRole('region', { name: `Why not ${fallacyName(nearbyId)}?` })).toBeNull();

    view.rerender(<FeedbackSheet {...common} outcome="partial" pick={{ spot: 'flawed', named: unrelatedId }} />);
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain(`You picked ${fallacyName(unrelatedId)}.`);

    view.rerender(<FeedbackSheet {...common} outcome="wrong" pick={{ spot: 'sound', named: null }} />);
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.queryByText(/You picked/)).toBeNull();
    expect(screen.getByRole('status').textContent).toContain(flawed.explanation);
  });
});
