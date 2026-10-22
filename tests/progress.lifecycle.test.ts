// @vitest-environment jsdom
// Replacing saved learning data must not leave an old activity able to write it back.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dateKey } from '../src/engine/dates';
import { logicVerdict } from '../src/engine/logic';
import { defaultProgress, loadProgress, STORAGE_KEY } from '../src/engine/storage';
import type { Progress } from '../src/engine/types';
import { dataEpoch, invalidateSessionCaches } from '../src/state/lifecycle';
import { checkLogic, logicSession, selectLogicVerdict, startLogic } from '../src/state/logic';
import { checkRepair, repairSession, selectRepairOption, startRepair } from '../src/state/repair';
import { next, prepareSession, session, spot, startCustomSession, summary } from '../src/state/session';
import { bank, commit, progress, replaceProgress, resetProgress, storageOk, toast, watchOtherTabs } from '../src/state/store';

const AT = new Date('2026-10-22T14:00:00Z').getTime();
const TODAY = dateKey(AT);
const sound = bank.items.find((item) => item.isSound)!;
let stopWatching: (() => void) | undefined;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(AT);
  localStorage.clear();
  invalidateSessionCaches();
  progress.value = defaultProgress();
  storageOk.value = true;
  toast.value = null;
});

afterEach(() => {
  stopWatching?.();
  stopWatching = undefined;
  vi.clearAllTimers();
  vi.useRealTimers();
});

/** A past summary plus three active activities, each with an answer already saved. */
function populateActivities(): void {
  commit({ ...defaultProgress(), settings: { theme: 'dark', showDefinitions: false }, onboarded: true });
  startCustomSession({ key: 'practice', mode: 'practice', itemIds: [sound.id], seed: 'previous-summary' });
  spot('sound');
  next();
  const daily = prepareSession({ name: 'play', mode: 'daily' }, AT);
  expect(daily.status).toBe('ready');
  spot('sound');
  next();

  startRepair('replace-progress-repair');
  const repair = repairSession.peek()!.items[0]!;
  selectRepairOption(repair.options.find((option) => option.correct)!.id);
  checkRepair();
  startLogic('replace-progress-logic');
  selectLogicVerdict(logicVerdict(logicSession.peek()!.items[0]!));
  checkLogic();

  expect(summary.peek()).not.toBeNull();
  expect(session.peek()?.outcomes).toHaveLength(1);
  expect(repairSession.peek()?.answers).toHaveLength(1);
  expect(logicSession.peek()?.answers).toHaveLength(1);
}

function expectCachesCleared(): void {
  expect(session.peek()).toBeNull();
  expect(summary.peek()).toBeNull();
  expect(repairSession.peek()).toBeNull();
  expect(logicSession.peek()).toBeNull();
}

function cachedActivities() {
  return [session.peek(), summary.peek(), repairSession.peek(), logicSession.peek()] as const;
}

function expectActivitiesUnchanged(cached: ReturnType<typeof cachedActivities>): void {
  const current = cachedActivities();
  current.forEach((activity, index) => expect(activity).toBe(cached[index]));
}

/** jsdom does not emit storage events for writes made by this document. */
function otherTabSaves(nextProgress: Progress): void {
  const oldValue = localStorage.getItem(STORAGE_KEY);
  const newValue = JSON.stringify(nextProgress);
  localStorage.setItem(STORAGE_KEY, newValue);
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEY, oldValue, newValue, storageArea: localStorage,
  }));
}

describe('progress replacement lifecycle', () => {
  it('reset clears all activity caches and saved learning while preserving display settings', () => {
    populateActivities();
    const settings = progress.peek().settings;
    const epoch = dataEpoch.peek();
    resetProgress();

    expectCachesCleared();
    expect(dataEpoch.peek()).toBe(epoch + 1);
    expect(progress.peek()).toEqual({ ...defaultProgress(), settings, onboarded: true });
    expect(loadProgress(localStorage)).toEqual(progress.peek());

    // A stale button/keyboard event cannot restore an answer after the reset.
    const reset = progress.peek();
    checkRepair();
    checkLogic();
    spot('sound');
    expect(progress.peek()).toBe(reset);

    const fresh = prepareSession({ name: 'play', mode: 'daily' }, AT);
    expect(fresh.status).toBe('ready');
    if (fresh.status === 'ready') {
      expect(fresh.session.index).toBe(0);
      expect(fresh.session.outcomes).toEqual([]);
    }
  });

  it('replacing an imported save clears all caches and uses its completed Daily instead of resuming the old one', () => {
    populateActivities();
    const imported: Progress = {
      ...defaultProgress(),
      onboarded: true,
      settings: { theme: 'light', showDefinitions: true },
      daily: { [TODAY]: { itemIds: [sound.id], answers: ['correct'], done: true } },
      sessions: [{ mode: 'daily', at: AT - 1000, total: 1, correct: 1 }],
      repair: { recent: [], answered: 20, correct: 15, sets: 4 },
      logic: { recent: [], answered: 10, correct: 8, sets: 2 },
    };
    const epoch = dataEpoch.peek();
    replaceProgress(imported);

    expectCachesCleared();
    expect(dataEpoch.peek()).toBe(epoch + 1);
    expect(progress.peek()).toEqual(imported);
    expect(loadProgress(localStorage)).toEqual(imported);
    expect(prepareSession({ name: 'play', mode: 'daily' }, AT)).toEqual({ status: 'daily-done' });
    checkRepair();
    checkLogic();
    spot('sound');
    expect(progress.peek()).toEqual(imported);
  });

  it.each(['quiz', 'repair', 'logic'] as const)('invalidates every cached activity when another tab changes %s progress', (activity) => {
    populateActivities();
    stopWatching = watchOtherTabs();
    const external = structuredClone(progress.peek());
    if (activity === 'quiz') external.boxes.fal_ad_hominem = 5;
    else external[activity].answered += 1;
    const epoch = dataEpoch.peek();

    otherTabSaves(external);

    expectCachesCleared();
    expect(dataEpoch.peek()).toBe(epoch + 1);
    expect(progress.peek()).toEqual(external);
    expect(toast.peek()?.text).toBe('Progress updated in another tab.');
  });

  it('applies settings-only tab updates without interrupting active exercises or the cached summary', () => {
    populateActivities();
    stopWatching = watchOtherTabs();
    const cached = cachedActivities();
    const epoch = dataEpoch.peek();
    const external = { ...progress.peek(), settings: { theme: 'light' as const, showDefinitions: true } };

    otherTabSaves(external);

    expectActivitiesUnchanged(cached);
    expect(dataEpoch.peek()).toBe(epoch);
    expect(progress.peek().settings).toEqual(external.settings);
    expect(toast.peek()).toBeNull();
  });

  it.each(['remove', 'clear'] as const)('invalidates caches when another tab uses localStorage.%s', (operation) => {
    populateActivities();
    stopWatching = watchOtherTabs();
    const epoch = dataEpoch.peek();
    if (operation === 'remove') localStorage.removeItem(STORAGE_KEY);
    else localStorage.clear();
    window.dispatchEvent(new StorageEvent('storage', {
      key: operation === 'clear' ? null : STORAGE_KEY,
      newValue: null,
      storageArea: localStorage,
    }));

    expectCachesCleared();
    expect(dataEpoch.peek()).toBe(epoch + 1);
    expect(progress.peek()).toEqual(defaultProgress());
  });

  it('ignores unrelated storage keys and stops listening when its disposer is called', () => {
    populateActivities();
    const stop = watchOtherTabs();
    const cached = cachedActivities();
    const saved = progress.peek();
    const epoch = dataEpoch.peek();
    window.dispatchEvent(new StorageEvent('storage', { key: 'another-app', storageArea: localStorage }));
    expectActivitiesUnchanged(cached);
    expect(progress.peek()).toBe(saved);
    expect(dataEpoch.peek()).toBe(epoch);

    stop();
    otherTabSaves(defaultProgress());
    expectActivitiesUnchanged(cached);
    expect(progress.peek()).toBe(saved);
    expect(dataEpoch.peek()).toBe(epoch);
  });
});
