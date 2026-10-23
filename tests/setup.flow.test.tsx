// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app';
import { defaultProgress, loadProgress, STORAGE_KEY } from '../src/engine/storage';
import type { Progress } from '../src/engine/types';
import { replaceRoute, route } from '../src/router';
import { invalidateSessionCaches } from '../src/state/lifecycle';
import { session, startCustomSession } from '../src/state/session';
import { bank, commit, progress, replaceProgress, setTheme, storageOk, toast, welcomeShown } from '../src/state/store';
import { SetupScreen } from '../src/ui/screens/Setup';

const flawed = bank.items.find((item) => !item.isSound && item.format !== 'chat')!;
const sound = bank.items.find((item) => item.isSound)!;
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name, exact: typeof name === 'string' }));
const checkbox = (name: string) => screen.getByRole('checkbox', { name }) as HTMLInputElement;
const radio = (name: string) => screen.getByRole('radio', { name: new RegExp(`^${name}`) }) as HTMLInputElement;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-23T14:00:00Z'));
  localStorage.clear();
  invalidateSessionCaches();
  progress.value = defaultProgress();
  storageOk.value = true;
  toast.value = null;
  welcomeShown.value = false;
  replaceRoute('#/');
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('two-step personal setup', () => {
  it('keeps both drafts through Back and Continue without saving or adding browser history entries', () => {
    replaceRoute('#/setup');
    const pushed = vi.spyOn(history, 'pushState');
    const save = vi.spyOn(Storage.prototype, 'setItem');
    render(<SetupScreen />);
    expect(screen.getByRole('heading', { name: 'What interests you?' })).toBeTruthy();
    fireEvent.click(checkbox('Everyday life'));
    fireEvent.click(checkbox('Technology'));
    click('Continue');
    expect(screen.getByRole('heading', { name: 'How would you like to start?' })).toBeTruthy();
    fireEvent.click(radio('Some experience'));
    click('Back');
    expect(checkbox('Everyday life').checked).toBe(true);
    expect(checkbox('Technology').checked).toBe(true);
    expect(checkbox('Work').checked).toBe(false);
    click('Continue');
    expect(radio('Some experience').checked).toBe(true);
    expect(save).not.toHaveBeenCalled();
    expect(pushed).not.toHaveBeenCalled();
    expect(location.hash).toBe('#/setup');
    expect(progress.peek()).toEqual(defaultProgress());
  });

  it('lets both questions remain optional and starts five questions with one final action', () => {
    render(<SetupScreen />);
    expect(screen.getByRole('button', { name: /^Mix everything/ }).getAttribute('aria-pressed')).toBe('true');
    click('Continue');
    expect(screen.getAllByRole('radio').every((input) => !(input as HTMLInputElement).checked)).toBe(true);
    expect((screen.getByRole('button', { name: 'Start 5 questions' }) as HTMLButtonElement).disabled).toBe(false);
    click('Start 5 questions');
    expect(route.peek()).toEqual({ name: 'play', mode: 'practice' });
    expect(session.peek()!.itemIds).toHaveLength(5);
    expect(progress.peek().onboarded).toBe(true);
    expect(progress.peek().settings.interests).toEqual([]);
    expect(progress.peek().attempts).toEqual([]);
    expect(loadProgress(localStorage)).toEqual(progress.peek());
  });

  it('discards unfinished choices when a new visitor skips from the second step', () => {
    commit({ ...defaultProgress(), settings: { ...defaultProgress().settings, theme: 'dark', interests: ['work'] } });
    const savedSettings = progress.peek().settings;
    render(<SetupScreen />);
    fireEvent.click(checkbox('Technology'));
    click('Continue');
    fireEvent.click(radio('Comfortable'));
    click('Skip setup');
    expect(progress.peek().settings).toEqual(savedSettings);
    expect(progress.peek().onboarded).toBe(true);
    expect(session.peek()).toBeNull();
    expect(route.peek()).toEqual({ name: 'today' });
    expect(loadProgress(localStorage).settings).toEqual(savedSettings);
  });

  it('prefills a returning visitor, permits changes, and Cancel discards them without writing', () => {
    commit({ ...defaultProgress(), onboarded: true,
      settings: { ...defaultProgress().settings, interests: ['work'], startingExperience: 'comfortable' } });
    const before = progress.peek();
    const serialized = localStorage.getItem(STORAGE_KEY);
    const save = vi.spyOn(Storage.prototype, 'setItem');
    render(<SetupScreen />);
    expect(checkbox('Work').checked).toBe(true);
    expect(screen.queryByRole('button', { name: 'Skip setup' })).toBeNull();
    fireEvent.click(checkbox('Technology'));
    click('Continue');
    expect(radio('Comfortable').checked).toBe(true);
    fireEvent.click(radio('New to this'));
    click('Cancel');
    expect(progress.peek()).toBe(before);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(serialized);
    expect(save).not.toHaveBeenCalled();
    expect(route.peek()).toEqual({ name: 'practice' });
  });

  it('finishes with the latest theme rather than restoring the setting from when setup opened', () => {
    render(<SetupScreen />);
    fireEvent.click(checkbox('Technology'));
    click('Continue');
    fireEvent.click(radio('Comfortable'));
    act(() => setTheme('dark'));
    click('Start 5 questions');
    expect(progress.peek().settings.theme).toBe('dark');
    expect(progress.peek().settings.interests).toEqual(['tech']);
    expect(progress.peek().boxes).toEqual({});
    expect(progress.peek().stats).toEqual({});
    expect(loadProgress(localStorage).settings.theme).toBe('dark');
  });

  it('offers Save and return when a current exercise must be preserved', () => {
    progress.value = { ...defaultProgress(), onboarded: true };
    startCustomSession({ key: 'daily:2026-10-23', mode: 'daily', dateKey: '2026-10-23',
      itemIds: [flawed.id, sound.id], seed: 'setup-save-return' });
    const active = session.peek();
    render(<SetupScreen />);
    fireEvent.click(checkbox('Work'));
    click('Continue');
    expect(screen.queryByRole('button', { name: 'Start 5 questions' })).toBeNull();
    click('Save and return');
    expect(session.peek()).toBe(active);
    expect(progress.peek().settings.interests).toEqual(['work']);
    expect(route.peek()).toEqual({ name: 'practice' });
  });

  it('shows a readable notice if browser storage could not save preferences', () => {
    storageOk.value = false;
    render(<SetupScreen />);
    expect(screen.getByText(/could not save|cannot save|can.t save|not saved/i)).toBeTruthy();
  });
});

describe('setup routing and data replacement', () => {
  it('offers the first setup step on a genuinely new home visit', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'What interests you?' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /^Daily Forge/ })).toBeNull();
  });

  const legacyVisitors: Array<[string, (p: Progress) => void]> = [
    ['old demo answer', (p) => { p.attempts = [{ itemId: sound.id, mode: 'demo', at: Date.now(), outcome: 'correct' }]; }],
    ['old repair use', (p) => { p.repair.answered = 1; }],
    ['old logic use', (p) => { p.logic.answered = 1; }],
    ['old mastery data', (p) => { p.boxes[flawed.fallacyId!] = 3; }],
    ['old saved daily', (p) => { p.daily['2026-10-22'] = { itemIds: [sound.id], answers: ['correct'], done: true }; }],
  ];

  it.each(legacyVisitors)('shows Today for a returning visitor with %s even without the onboarding flag', (_, addHistory) => {
    const p = defaultProgress();
    addHistory(p);
    progress.value = p;
    render(<App />);
    expect(screen.queryByRole('heading', { name: 'What interests you?' })).toBeNull();
    expect(screen.getByRole('heading', { name: /^Daily Forge/ })).toBeTruthy();
  });

  it.each(['#/practice', '#/library', '#/progress', '#/about', '#/repair', '#/logic', '#/play/daily'])('does not replace a first-time deep link to %s with setup', (hash) => {
    if (hash === '#/play/daily') {
      startCustomSession({ key: 'daily:2026-10-23', mode: 'daily', dateKey: '2026-10-23',
        itemIds: [sound.id], seed: 'setup-deep-link' });
    }
    replaceRoute(hash);
    render(<App />);
    expect(screen.queryByRole('heading', { name: 'What interests you?' })).toBeNull();
    expect(location.hash).toBe(hash);
  });

  it('allows a returning visitor to open setup explicitly', () => {
    progress.value = { ...defaultProgress(), onboarded: true };
    replaceRoute('#/setup');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'What interests you?' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  });

  it('remounts an open setup after an import so old drafts cannot overwrite the imported preferences', () => {
    replaceRoute('#/setup');
    render(<App />);
    fireEvent.click(checkbox('Technology'));
    click('Continue');
    fireEvent.click(radio('Some experience'));
    act(() => replaceProgress({ ...defaultProgress(), onboarded: true,
      settings: { ...defaultProgress().settings, theme: 'dark', interests: ['work'] } }));
    expect(screen.getByRole('heading', { name: 'What interests you?' })).toBeTruthy();
    expect(checkbox('Work').checked).toBe(true);
    expect(checkbox('Technology').checked).toBe(false);
    click('Continue');
    expect(radio('Some experience').checked).toBe(false);
    click('Start 5 questions');
    expect(progress.peek().settings.interests).toEqual(['work']);
    expect(progress.peek().settings.theme).toBe('dark');
    expect(loadProgress(localStorage).settings.interests).toEqual(['work']);
  });
});
