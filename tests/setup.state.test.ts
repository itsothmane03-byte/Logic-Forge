// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultProgress, loadProgress, STORAGE_KEY } from '../src/engine/storage';
import type { Progress } from '../src/engine/types';
import { replaceRoute, route } from '../src/router';
import { invalidateSessionCaches } from '../src/state/lifecycle';
import { logicSession, selectLogicVerdict, startLogic } from '../src/state/logic';
import { cancelSetup, finishSetup, hasActivePractice, saveSetup } from '../src/state/onboarding';
import { repairSession, selectRepairOption, startRepair } from '../src/state/repair';
import { next, session, spot, startCustomSession, summary } from '../src/state/session';
import { bank, commit, progress, setTheme, storageOk } from '../src/state/store';

const AT = new Date('2026-10-23T14:00:00Z').getTime();
const sound = bank.items.find((item) => item.isSound)!;
const flawed = bank.items.find((item) => !item.isSound)!;

beforeEach(() => {
  localStorage.clear();
  invalidateSessionCaches();
  progress.value = defaultProgress();
  storageOk.value = true;
  replaceRoute('#/setup');
  vi.spyOn(Date, 'now').mockReturnValue(AT);
});

afterEach(() => vi.restoreAllMocks());

function learning(p: Progress) {
  const { settings: _settings, onboarded: _onboarded, ...rest } = p;
  return rest;
}

function startQuiz(mode: 'practice' | 'daily' | 'focus' | 'review' | 'demo' = 'practice'): void {
  startCustomSession({ key: mode, mode, itemIds: [flawed.id, sound.id], seed: 'setup-active',
    ...(mode === 'daily' ? { dateKey: '2026-10-23' } : {}),
    ...(mode === 'focus' ? { focusId: flawed.fallacyId } : {}),
  });
  spot('flawed'); // A live Name-step draft must survive setup.
}

describe('optional practice preferences', () => {
  it('saves choices once without starting an exercise or changing learning data', () => {
    setTheme('dark');
    const before = learning(progress.peek());
    const save = vi.spyOn(Storage.prototype, 'setItem');
    saveSetup({ interests: ['work'], experience: 'comfortable' });
    expect(save).toHaveBeenCalledTimes(1);
    expect(progress.peek().settings).toMatchObject({ theme: 'dark', interests: ['work'], startingExperience: 'comfortable' });
    expect(progress.peek().onboarded).toBe(true);
    expect(learning(progress.peek())).toEqual(before);
    expect(loadProgress(localStorage)).toEqual(progress.peek());
    expect(session.peek()).toBeNull();
    expect(route.peek()).toEqual({ name: 'practice' });
  });

  it('saves the choices once, preserves the latest theme, and starts five questions without crediting self-reported skill', () => {
    setTheme('dark');
    const before = learning(progress.peek());
    const save = vi.spyOn(Storage.prototype, 'setItem');
    finishSetup({ interests: ['tech', 'work'], experience: 'comfortable' });

    expect(save).toHaveBeenCalledTimes(1);
    expect(progress.peek().onboarded).toBe(true);
    expect(progress.peek().settings.theme).toBe('dark');
    expect(progress.peek().settings.startingExperience).toBe('comfortable');
    expect(new Set(progress.peek().settings.interests)).toEqual(new Set(['tech', 'work']));
    expect(learning(progress.peek())).toEqual(before);
    expect(loadProgress(localStorage)).toEqual(progress.peek());
    expect(route.peek()).toEqual({ name: 'play', mode: 'practice' });
    expect(session.peek()).toMatchObject({ mode: 'practice', index: 0, phase: 'spot', outcomes: [], picks: [], finished: false });
    expect(session.peek()!.itemIds).toHaveLength(5);
    expect(new Set(session.peek()!.itemIds).size).toBe(5);
  });

  it('lets automatic comfort replace an old self-report without inventing mastery', () => {
    progress.value = { ...defaultProgress(), settings: { ...defaultProgress().settings, startingExperience: 'some' } };
    saveSetup({ interests: [], experience: null });
    expect(progress.peek().settings.interests).toEqual([]);
    expect(Object.hasOwn(progress.peek().settings, 'startingExperience')).toBe(false);
    expect(Object.hasOwn(loadProgress(localStorage).settings, 'startingExperience')).toBe(false);
    expect(progress.peek().boxes).toEqual({});
    expect(progress.peek().stats).toEqual({});
    expect(progress.peek().attempts).toEqual([]);
    expect(session.peek()).toBeNull();
  });

  it.each(['practice', 'daily', 'focus', 'review', 'demo'] as const)('saves preferences without replacing an unfinished %s quiz', (mode) => {
    startQuiz(mode);
    const before = session.peek();
    const beforeLearning = learning(progress.peek());
    expect(hasActivePractice()).toBe(true);
    finishSetup({ interests: ['everyday'], experience: 'new' });
    expect(session.peek()).toBe(before);
    expect(learning(progress.peek())).toEqual(beforeLearning);
    expect(route.peek()).toEqual({ name: 'practice' });
  });

  it.each(['repair', 'logic'] as const)('preserves an unfinished %s draft when saving preferences', (activity) => {
    if (activity === 'repair') {
      startRepair('setup-repair');
      selectRepairOption(repairSession.peek()!.items[0]!.options[1]!.id);
    } else {
      startLogic('setup-logic');
      selectLogicVerdict('possible');
    }
    const before = activity === 'repair' ? repairSession.peek() : logicSession.peek();
    expect(hasActivePractice()).toBe(true);
    finishSetup({ interests: ['work'], experience: 'some' });
    expect(activity === 'repair' ? repairSession.peek() : logicSession.peek()).toBe(before);
    expect(session.peek()).toBeNull();
    expect(route.peek()).toEqual({ name: 'practice' });
  });

  it('keeps every active activity and the preceding summary intact together', () => {
    startCustomSession({ key: 'practice', mode: 'practice', itemIds: [sound.id], seed: 'setup-summary' });
    spot('sound');
    next();
    startQuiz('daily');
    startRepair('setup-all-repair');
    selectRepairOption(repairSession.peek()!.items[0]!.options[0]!.id);
    startLogic('setup-all-logic');
    selectLogicVerdict('cannot');
    const cached = [session.peek(), repairSession.peek(), logicSession.peek(), summary.peek()];
    const before = learning(progress.peek());
    saveSetup({ interests: ['tech'], experience: 'comfortable' });
    [session.peek(), repairSession.peek(), logicSession.peek(), summary.peek()]
      .forEach((value, index) => expect(value).toBe(cached[index]));
    expect(learning(progress.peek())).toEqual(before);
    expect(route.peek()).toEqual({ name: 'practice' });
  });

  it('ignores a finished quiz when deciding whether a fresh five-question set can start', () => {
    expect(hasActivePractice()).toBe(false);
    startCustomSession({ key: 'practice', mode: 'practice', itemIds: [sound.id], seed: 'setup-finished' });
    spot('sound');
    next();
    expect(hasActivePractice()).toBe(false);
    const previousSummary = summary.peek();
    finishSetup({ interests: [], experience: null });
    expect(session.peek()!.itemIds).toHaveLength(5);
    expect(summary.peek()).toBe(previousSummary);
    expect(route.peek()).toEqual({ name: 'play', mode: 'practice' });
  });

  it('Cancel returns to practice without writing anything', () => {
    commit({ ...defaultProgress(), onboarded: true });
    startQuiz();
    const before = progress.peek();
    const draft = session.peek();
    const serialized = localStorage.getItem(STORAGE_KEY);
    const save = vi.spyOn(Storage.prototype, 'setItem');
    cancelSetup();
    expect(save).not.toHaveBeenCalled();
    expect(progress.peek()).toBe(before);
    expect(session.peek()).toBe(draft);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(serialized);
    expect(route.peek()).toEqual({ name: 'practice' });
  });

  it('still starts practice in memory and exposes the failed-save state if browser storage is full', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); });
    expect(() => finishSetup({ interests: ['everyday'], experience: 'new' })).not.toThrow();
    expect(storageOk.peek()).toBe(false);
    expect(progress.peek().onboarded).toBe(true);
    expect(session.peek()!.itemIds).toHaveLength(5);
    expect(route.peek()).toEqual({ name: 'play', mode: 'practice' });
  });

  it('keeps a failed preferences-only save usable without unexpectedly starting questions', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); });
    expect(() => saveSetup({ interests: ['tech'], experience: null })).not.toThrow();
    expect(storageOk.peek()).toBe(false);
    expect(progress.peek().settings.interests).toEqual(['tech']);
    expect(session.peek()).toBeNull();
    expect(route.peek()).toEqual({ name: 'practice' });
  });
});
