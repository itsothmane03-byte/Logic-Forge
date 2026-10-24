// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app';
import { defaultProgress, loadProgress, STORAGE_KEY } from '../src/engine/storage';
import type { Progress } from '../src/engine/types';
import { replaceRoute, route } from '../src/router';
import { invalidateSessionCaches } from '../src/state/lifecycle';
import { next, pickOption, prepareSession, session, spot, startCustomSession } from '../src/state/session';
import { bank, commit, progress, replaceProgress, setTheme, storageOk, toast } from '../src/state/store';
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
  replaceRoute('#/');
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('optional practice preferences', () => {
  it('shows both sets of optional choices together and keeps edits unsaved until an action is chosen', () => {
    replaceRoute('#/setup');
    const save = vi.spyOn(Storage.prototype, 'setItem');
    render(<SetupScreen />);
    expect(screen.getByRole('heading', { name: 'Practice preferences' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Topics' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Five-question warm-up' })).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(radio('Let the app choose').checked).toBe(true);
    fireEvent.click(checkbox('Everyday life'));
    fireEvent.click(checkbox('Technology'));
    fireEvent.click(radio('Some experience'));
    expect(checkbox('Everyday life').checked).toBe(true);
    expect(checkbox('Technology').checked).toBe(true);
    expect(radio('Some experience').checked).toBe(true);
    expect(save).not.toHaveBeenCalled();
    expect(progress.peek()).toEqual(defaultProgress());
    expect(location.hash).toBe('#/setup');
    expect(screen.queryByRole('button', { name: /Continue|Skip setup/ })).toBeNull();
  });

  it('saves the choices with the latest theme without starting an exercise or crediting self-reported skill', () => {
    render(<SetupScreen />);
    fireEvent.click(checkbox('Technology'));
    fireEvent.click(radio('Comfortable'));
    act(() => setTheme('dark'));
    click('Save preferences');
    expect(progress.peek().settings).toMatchObject({ theme: 'dark', interests: ['tech'], startingExperience: 'comfortable' });
    expect(progress.peek().boxes).toEqual({});
    expect(progress.peek().stats).toEqual({});
    expect(progress.peek().attempts).toEqual([]);
    expect(loadProgress(localStorage)).toEqual(progress.peek());
    expect(session.peek()).toBeNull();
    expect(route.peek()).toEqual({ name: 'practice' });
  });

  it('starts five questions only through the separate explicit warm-up action', () => {
    render(<SetupScreen />);
    expect(screen.getByRole('button', { name: /^Mix everything/ }).getAttribute('aria-pressed')).toBe('true');
    expect(radio('Let the app choose').checked).toBe(true);
    click('Try 5 questions');
    expect(route.peek()).toEqual({ name: 'play', mode: 'practice' });
    expect(session.peek()!.itemIds).toHaveLength(5);
    expect(progress.peek().onboarded).toBe(true);
    expect(progress.peek().settings.interests).toEqual([]);
    expect(progress.peek().attempts).toEqual([]);
  });

  it.each([false, true])('prefills preferences and lets Cancel discard edits when onboarded is %s', (onboarded) => {
    commit({ ...defaultProgress(), onboarded,
      settings: { ...defaultProgress().settings, interests: ['work'], startingExperience: 'comfortable' } });
    const before = progress.peek();
    const serialized = localStorage.getItem(STORAGE_KEY);
    const save = vi.spyOn(Storage.prototype, 'setItem');
    render(<SetupScreen />);
    expect(checkbox('Work').checked).toBe(true);
    expect(radio('Comfortable').checked).toBe(true);
    fireEvent.click(checkbox('Technology'));
    fireEvent.click(radio('New to this'));
    click('Cancel');
    expect(progress.peek()).toBe(before);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(serialized);
    expect(save).not.toHaveBeenCalled();
    expect(route.peek()).toEqual({ name: 'practice' });
  });

  it('lets Mix everything and automatic comfort clear saved choices', () => {
    progress.value = { ...defaultProgress(), settings: { ...defaultProgress().settings,
      interests: ['work', 'tech'], startingExperience: 'some' } };
    render(<SetupScreen />);
    click(/^Mix everything/);
    fireEvent.click(radio('Let the app choose'));
    expect(screen.getAllByRole('checkbox').every((input) => !(input as HTMLInputElement).checked)).toBe(true);
    click('Save preferences');
    expect(progress.peek().settings.interests).toEqual([]);
    expect(Object.hasOwn(progress.peek().settings, 'startingExperience')).toBe(false);
    expect(loadProgress(localStorage).settings.interests).toEqual([]);
  });

  it('hides the warm-up action during an active Daily and saves preferences without replacing it', () => {
    startCustomSession({ key: 'daily:2026-10-23', mode: 'daily', dateKey: '2026-10-23',
      itemIds: [flawed.id, sound.id], seed: 'preferences-save-return' });
    const active = session.peek();
    render(<SetupScreen />);
    fireEvent.click(checkbox('Work'));
    expect(screen.queryByRole('button', { name: 'Try 5 questions' })).toBeNull();
    click('Save preferences');
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

describe('open home and optional preferences routing', () => {
  it.each(['#/', '#/welcome'])('shows the introduction at %s with Home current and no setup gate', (hash) => {
    replaceRoute(hash);
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Spot bad arguments in five minutes a day.' })).toBeTruthy();
    for (const link of screen.getAllByRole('link', { name: 'Open Daily Forge' })) {
      expect(link.getAttribute('href')).toBe('#/play/daily');
    }
    expect(screen.getByRole('link', { name: 'Choose practice' }).getAttribute('href')).toBe('#/practice');
    expect(screen.queryByRole('heading', { name: 'Practice preferences' })).toBeNull();
    expect(screen.getAllByRole('navigation', { name: 'Primary' })).toHaveLength(2);
    const homeLinks = screen.getAllByRole('link', { name: 'Fallacy Forge, Home' });
    expect(homeLinks).toHaveLength(2);
    for (const link of homeLinks) {
      expect(link.getAttribute('href')).toBe('#/');
      expect(link.getAttribute('aria-current')).toBe('page');
    }
    for (const link of screen.getAllByRole('link', { name: /^(Today|About)$/ })) {
      expect(link.getAttribute('aria-current')).toBeNull();
      if (link.textContent === 'Today') expect(link.getAttribute('href')).toBe('#/today');
    }
    expect(progress.peek()).toEqual(defaultProgress());
  });

  const legacyVisitors: Array<[string, (p: Progress) => void]> = [
    ['old demo answer', (p) => { p.attempts = [{ itemId: sound.id, mode: 'demo', at: Date.now(), outcome: 'correct' }]; }],
    ['old repair use', (p) => { p.repair.answered = 1; }],
    ['old logic use', (p) => { p.logic.answered = 1; }],
  ];
  it.each(legacyVisitors)('also shows Home for a returning visitor with %s', (_, addHistory) => {
    const p = defaultProgress();
    addHistory(p);
    progress.value = p;
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Spot bad arguments in five minutes a day.' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Practice preferences' })).toBeNull();
  });

  it('keeps the Today dashboard directly accessible with its own current navigation links', () => {
    replaceRoute('#/today');
    render(<App />);
    expect(screen.getByRole('heading', { name: /^Daily Forge/ })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Spot bad arguments in five minutes a day.' })).toBeNull();
    const todayLinks = screen.getAllByRole('link', { name: 'Today', exact: true });
    expect(todayLinks).toHaveLength(2);
    for (const link of todayLinks) {
      expect(link.getAttribute('href')).toBe('#/today');
      expect(link.getAttribute('aria-current')).toBe('page');
    }
    for (const link of screen.getAllByRole('link', { name: 'Fallacy Forge, Home' })) {
      expect(link.getAttribute('href')).toBe('#/');
      expect(link.getAttribute('aria-current')).toBeNull();
    }
  });

  it.each(['#/today', '#/practice', '#/library', '#/progress', '#/about', '#/repair', '#/logic', '#/play/daily'])('keeps the first-time deep link %s directly accessible', (hash) => {
    if (hash === '#/play/daily') startCustomSession({ key: 'daily:2026-10-23', mode: 'daily', dateKey: '2026-10-23',
      itemIds: [sound.id], seed: 'preferences-deep-link' });
    replaceRoute(hash);
    render(<App />);
    expect(screen.queryByRole('heading', { name: 'Practice preferences' })).toBeNull();
    expect(location.hash).toBe(hash);
  });

  it('opens preferences explicitly inside normal app navigation', () => {
    replaceRoute('#/setup');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Practice preferences' })).toBeTruthy();
    expect(screen.getAllByRole('navigation', { name: 'Primary' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  });

  it.each(['import', 'reset'] as const)('discards old drafts after a %s instead of writing them over the replaced save', (operation) => {
    replaceRoute('#/setup');
    render(<App />);
    fireEvent.click(checkbox('Technology'));
    fireEvent.click(radio('Some experience'));
    const replacement: Progress = operation === 'import'
      ? { ...defaultProgress(), onboarded: true, settings: { ...defaultProgress().settings,
        theme: 'dark', interests: ['work'], startingExperience: 'comfortable' } }
      : defaultProgress();
    act(() => replaceProgress(replacement));
    expect(checkbox('Technology').checked).toBe(false);
    expect(checkbox('Work').checked).toBe(operation === 'import');
    expect(radio('Some experience').checked).toBe(false);
    expect(radio(operation === 'import' ? 'Comfortable' : 'Let the app choose').checked).toBe(true);
    click('Save preferences');
    expect(progress.peek().settings).toEqual(replacement.settings);
    expect(loadProgress(localStorage).settings).toEqual(replacement.settings);
  });

  it('keeps a reset home visit on the introduction rather than starting preferences again', () => {
    progress.value = { ...defaultProgress(), onboarded: true };
    render(<App />);
    act(() => replaceProgress(defaultProgress()));
    expect(screen.getByRole('heading', { name: 'Spot bad arguments in five minutes a day.' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Practice preferences' })).toBeNull();
  });

  it('preserves an active quiz draft and saved progress across Home and Today navigation', () => {
    startCustomSession({ key: 'practice', mode: 'practice', itemIds: [sound.id, flawed.id], seed: 'home-today-draft' });
    spot('sound');
    next();
    spot('flawed');
    pickOption(flawed.fallacyId!);
    const draft = session.peek();
    const saved = progress.peek();
    const serialized = localStorage.getItem(STORAGE_KEY);
    replaceRoute('#/play/practice');
    render(<App />);

    act(() => replaceRoute('#/'));
    expect(screen.getByRole('heading', { name: 'Spot bad arguments in five minutes a day.' })).toBeTruthy();
    expect(session.peek()).toBe(draft);
    expect(progress.peek()).toBe(saved);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(serialized);

    act(() => replaceRoute('#/today'));
    expect(screen.getByRole('heading', { name: /^Daily Forge/ })).toBeTruthy();
    expect(session.peek()).toBe(draft);
    expect(progress.peek()).toBe(saved);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(serialized);

    expect(prepareSession({ name: 'play', mode: 'practice' })).toEqual({ status: 'ready', session: draft });
    act(() => replaceRoute('#/play/practice'));
    expect(screen.getByText('Which fallacy?')).toBeTruthy();
    const selected = screen.getAllByRole('radio').find((input) => (input as HTMLInputElement).checked) as HTMLInputElement;
    expect(selected.value).toBe(flawed.fallacyId);
    expect(session.peek()).toBe(draft);
    expect(progress.peek()).toBe(saved);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(serialized);
  });
});
