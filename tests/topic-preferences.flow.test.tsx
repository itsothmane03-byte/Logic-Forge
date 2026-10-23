// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultProgress, loadProgress } from '../src/engine/storage';
import { clearQuizSession, session, startCustomSession } from '../src/state/session';
import { bank, progress, storageOk, toast } from '../src/state/store';
import { PracticeScreen } from '../src/ui/screens/Practice';
import { SessionScreen } from '../src/ui/screens/Session';

const flawed = bank.items.find((item) => !item.isSound && item.format !== 'chat')!;
const sound = bank.items.find((item) => item.isSound)!;
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const checkbox = (name: string) => screen.getByRole('checkbox', { name }) as HTMLInputElement;
const visibleItemId = () => document.querySelector('[data-item-id]')?.getAttribute('data-item-id');

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  clearQuizSession();
  progress.value = defaultProgress();
  storageOk.value = true;
  toast.value = null;
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('familiar-topic preferences and escape', () => {
  it('saves optional native checkboxes, restores them on return, and leaves the current set alone', () => {
    startCustomSession({ key: 'practice', mode: 'practice', itemIds: [flawed.id, sound.id], seed: 'preference-flow' });
    const active = session.peek();
    const first = render(<PracticeScreen />);
    fireEvent.click(screen.getByText('Familiar topics'));
    for (const label of ['Everyday life', 'Work', 'Technology']) expect(checkbox(label).checked).toBe(false);
    expect(screen.getByRole('button', { name: 'Mix everything' }).getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(checkbox('Work'));
    fireEvent.click(checkbox('Technology'));
    expect(checkbox('Work').checked).toBe(true);
    expect(checkbox('Technology').checked).toBe(true);
    expect(checkbox('Everyday life').checked).toBe(false);
    expect(new Set(progress.peek().settings.interests)).toEqual(new Set(['work', 'tech']));
    expect(loadProgress(localStorage).settings.interests).toEqual(progress.peek().settings.interests);
    expect(screen.getByRole('button', { name: 'Mix everything' }).getAttribute('aria-pressed')).toBe('false');
    expect(session.peek()).toBe(active);

    first.unmount();
    progress.value = loadProgress(localStorage);
    render(<PracticeScreen />);
    fireEvent.click(screen.getByText('Familiar topics'));
    expect(checkbox('Work').checked).toBe(true);
    expect(checkbox('Technology').checked).toBe(true);
    click('Mix everything');
    expect(progress.peek().settings.interests).toEqual([]);
    expect(loadProgress(localStorage).settings.interests).toEqual([]);
    expect(screen.getAllByRole('checkbox').every((input) => !(input as HTMLInputElement).checked)).toBe(true);
    expect(session.peek()).toBe(active);
  });

  it('swaps a current prompt without affecting the score or the ability to review an earlier answer', () => {
    startCustomSession({ key: 'practice', mode: 'practice', itemIds: [flawed.id, sound.id], seed: 'swap-review-flow' });
    render(<SessionScreen route={{ name: 'play', mode: 'practice' }} />);
    fireEvent.keyDown(window, { key: 's' });
    expect(screen.queryByRole('button', { name: 'Show another', exact: true })).toBeNull();
    click(/^Continue/);
    const saved = progress.peek();
    fireEvent.click(screen.getByText('Unfamiliar topic?'));
    expect(screen.getByText('Your score stays the same.')).toBeTruthy();
    click('Show another');
    const replacement = session.peek()!.itemIds[1]!;
    expect(replacement).not.toBe(sound.id);
    expect(visibleItemId()).toBe(replacement);
    expect(toast.peek()?.text).toBe('Another example. Your score is unchanged.');
    expect(progress.peek()).toBe(saved);

    click('Previous');
    expect(visibleItemId()).toBe(flawed.id);
    expect(screen.getByText('Your answer: Sound.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Show another', exact: true })).toBeNull();
    expect(screen.queryByText('Unfamiliar topic?')).toBeNull();
    click('Return to current');
    expect(visibleItemId()).toBe(replacement);
    expect(screen.getByText('Unfamiliar topic?')).toBeTruthy();
    expect(progress.peek()).toBe(saved);
  });

  it('removes the escape once a flawed prompt reaches the Name step', () => {
    startCustomSession({ key: 'practice', mode: 'practice', itemIds: [flawed.id], seed: 'swap-before-answer-only' });
    render(<SessionScreen route={{ name: 'play', mode: 'practice' }} />);
    expect(screen.getByText('Unfamiliar topic?')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'f' });
    expect(screen.getByText('Which fallacy?')).toBeTruthy();
    expect(screen.queryByText('Unfamiliar topic?')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Show another', exact: true })).toBeNull();
    expect(progress.peek().attempts).toHaveLength(0);
  });

  it.each(['daily', 'review', 'demo'] as const)('does not offer a swap during %s', (mode) => {
    startCustomSession({ key: mode, mode, dateKey: mode === 'daily' ? '2026-10-22' : null,
      itemIds: [sound.id], seed: 'fixed-set-flow' });
    render(<SessionScreen route={{ name: 'play', mode }} />);
    expect(screen.queryByText('Unfamiliar topic?')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Show another', exact: true })).toBeNull();
  });
});
