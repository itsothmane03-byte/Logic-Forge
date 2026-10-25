// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultProgress, STORAGE_KEY } from '../src/engine/storage';
import { parseHash } from '../src/router';
import { invalidateSessionCaches } from '../src/state/lifecycle';
import { finishSetup } from '../src/state/onboarding';
import { check, currentItem, next, pickOption, prepareSession, session, spot, summary } from '../src/state/session';
import { progress, storageOk } from '../src/state/store';
import { SessionScreen } from '../src/ui/screens/Session';
import { SummaryScreen } from '../src/ui/screens/Summary';

const AT = new Date('2026-10-23T14:00:00Z').getTime();

beforeEach(() => {
  localStorage.clear();
  invalidateSessionCaches();
  progress.value = defaultProgress();
  storageOk.value = true;
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  vi.spyOn(Date, 'now').mockReturnValue(AT);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/** Answers a real selected set, optionally missing one flawed argument. */
function completeSet(missOne = false): void {
  let missed = false;
  const total = session.peek()!.itemIds.length;
  for (let index = 0; index < total; index += 1) {
    const item = currentItem()!;
    if (missOne && !missed && !item.isSound) {
      spot('sound');
      missed = true;
    } else if (item.isSound) spot('sound');
    else {
      spot('flawed');
      pickOption(item.fallacyId!);
      check();
    }
    next();
  }
  expect(session.peek()!.finished).toBe(true);
}

describe('summary continuation', () => {
  it.each([
    ['perfect', false, 5],
    ['mixed', true, 4],
  ] as const)('offers neutral ten-question continuation after a %s five-question warm-up without changing its result', (_, missOne, score) => {
    finishSetup({ interests: ['everyday'], experience: 'new' });
    expect(session.peek()!.itemIds).toHaveLength(5);
    completeSet(missOne);
    const completed = summary.peek();
    const saved = progress.peek();
    const serialized = localStorage.getItem(STORAGE_KEY);
    const page = render(<SummaryScreen />);

    expect(screen.getByRole('img', { name: `Score: ${score} out of 5` })).toBeTruthy();
    const continuation = screen.getByRole('link', { name: 'Practice 10 more' });
    expect(screen.queryByRole('link', { name: /weak spots|Review mistakes/i })).toBeNull();
    expect(screen.getByRole('link', { name: 'Back to Daily Forge' }).getAttribute('href')).toBe('#/today');
    expect(continuation.getAttribute('href')).toBe('#/play/practice');

    // Use the same public route-entry operation as main.tsx after following the link.
    const destination = parseHash(continuation.getAttribute('href')!);
    if (destination.name !== 'play') throw new Error('Practice continuation is not a play route');
    page.unmount();
    const prepared = prepareSession(destination, AT + 1);
    expect(prepared.status).toBe('ready');
    expect(session.peek()!.itemIds).toHaveLength(10);
    expect(session.peek()!.outcomes).toEqual([]);
    expect(session.peek()!.index).toBe(0);
    expect(progress.peek()).toBe(saved);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(serialized);
    expect(summary.peek()).toBe(completed);
    expect(saved.sessions).toEqual([{ mode: 'practice', at: AT, total: 5, correct: score }]);
    render(<SessionScreen route={destination} />);
    expect(screen.getByText('1 / 10')).toBeTruthy();
  });

  it('resumes the existing practice draft when an older summary is revisited', () => {
    finishSetup({ interests: [], experience: 'new' });
    completeSet();
    const completed = summary.peek();
    expect(prepareSession({ name: 'play', mode: 'practice' }, AT + 1).status).toBe('ready');
    // Save at least one answer in the new set, then leave a live Name-step draft.
    spot('sound');
    next();
    while (currentItem()!.isSound) {
      spot('sound');
      next();
    }
    const draftItem = currentItem()!;
    spot('flawed');
    pickOption(draftItem.fallacyId!);
    const draft = session.peek();
    const saved = progress.peek();
    const serialized = localStorage.getItem(STORAGE_KEY);
    const page = render(<SummaryScreen />);

    expect(screen.getByRole('img', { name: 'Score: 5 out of 5' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Practice 10 more' })).toBeNull();
    const resume = screen.getByRole('link', { name: 'Resume practice' });
    expect(resume.getAttribute('href')).toBe('#/play/practice');
    const destination = parseHash(resume.getAttribute('href')!);
    if (destination.name !== 'play') throw new Error('Resume target is not a play route');
    page.unmount();

    expect(prepareSession(destination, AT + 2)).toEqual({ status: 'ready', session: draft });
    expect(session.peek()).toBe(draft);
    expect(summary.peek()).toBe(completed);
    expect(progress.peek()).toBe(saved);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(serialized);
    render(<SessionScreen route={destination} />);
    expect(screen.getByText('Which fallacy?')).toBeTruthy();
    const selected = screen.getAllByRole('radio').find((input) => (input as HTMLInputElement).checked) as HTMLInputElement;
    expect(selected.value).toBe(draftItem.fallacyId);
  });

  it('retains the Daily result, sharing action, and Today dashboard link', () => {
    expect(prepareSession({ name: 'play', mode: 'daily' }, AT).status).toBe('ready');
    completeSet();
    const saved = progress.peek();
    render(<SummaryScreen />);
    expect(screen.getByRole('img', { name: 'Score: 10 out of 10' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Share' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to Daily Forge' }).getAttribute('href')).toBe('#/today');
    expect(screen.getByRole('link', { name: 'Practice 10 more' }).getAttribute('href')).toBe('#/play/practice');
    expect(progress.peek()).toBe(saved);
  });
});
