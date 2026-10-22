// @vitest-environment jsdom
// Completion history must not depend on clicking through the final feedback.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dateKey } from '../src/engine/dates';
import { defaultProgress, loadProgress } from '../src/engine/storage';
import { invalidateSessionCaches } from '../src/state/lifecycle';
import {
  check, clearQuizSession, next, pickOption, prepareSession,
  session, spot, startCustomSession, summary,
} from '../src/state/session';
import { bank, progress } from '../src/state/store';

const AT = new Date('2026-10-22T14:00:00Z').getTime();
const flawed = bank.items.find((item) => item.fallacyId === 'fal_ad_hominem')!;
const sound = bank.items.find((item) => item.isSound)!;

beforeEach(() => {
  localStorage.clear();
  progress.value = defaultProgress();
  clearQuizSession();
  vi.spyOn(Date, 'now').mockReturnValue(AT);
});

afterEach(() => vi.restoreAllMocks());

function startPractice(itemIds = [flawed.id]): void {
  startCustomSession({ key: 'practice', mode: 'practice', itemIds, seed: 'lifecycle-test' });
}

function nameCorrectly(): void {
  spot('flawed');
  pickOption(flawed.fallacyId!);
  check();
}

describe('quiz completion lifecycle', () => {
  it('persists a completed Daily before Continue, including when it is reopened after a reload', () => {
    const route = { name: 'play', mode: 'daily' } as const;
    const started = prepareSession(route, AT);
    expect(started.status).toBe('ready');
    if (started.status !== 'ready') throw new Error('Daily did not start');
    const total = started.session.itemIds.length;
    const expectedCorrect = started.session.itemIds.filter((id) => bank.items.find((item) => item.id === id)!.isSound).length;

    for (let index = 0; index < total; index += 1) {
      spot('sound');
      if (index < total - 1) {
        expect(progress.value.sessions).toHaveLength(0);
        next();
      }
    }

    expect(session.value?.phase).toBe('feedback');
    expect(session.value?.finished).toBe(false);
    expect(progress.value.daily[dateKey(AT)]?.done).toBe(true);
    expect(progress.value.sessions).toEqual([{ mode: 'daily', at: AT, total, correct: expectedCorrect }]);
    const saved = loadProgress(localStorage);
    expect(saved.sessions).toEqual(progress.value.sessions);

    // Clearing cached session state and loading storage models reopening the app.
    clearQuizSession();
    progress.value = saved;
    expect(prepareSession(route, AT)).toEqual({ status: 'daily-done' });
    expect(progress.value.sessions).toHaveLength(1);
  });

  it('records the last named answer once and keeps summary/mastery behavior on Continue', () => {
    startPractice();
    nameCorrectly();
    expect(progress.value.sessions).toEqual([{ mode: 'practice', at: AT, total: 1, correct: 1 }]);
    expect(progress.value.boxes[flawed.fallacyId!]).toBe(2);
    expect(summary.value).toBeNull();

    check();
    spot('sound');
    expect(progress.value.attempts).toHaveLength(1);
    expect(progress.value.sessions).toHaveLength(1);
    expect(next()).toBe('finished');
    expect(summary.value).toMatchObject({ mode: 'practice', itemIds: [flawed.id], outcomes: ['correct'] });
    expect(summary.value?.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ fallacyId: flawed.fallacyId, direction: 'up' }),
    ]));
    expect(next()).toBe('none');
    check();
    spot('sound');
    expect(progress.value.sessions).toHaveLength(1);
    expect(loadProgress(localStorage).sessions).toHaveLength(1);
  });

  it('does not log a session that was left before the last answer', () => {
    startPractice([sound.id, flawed.id]);
    spot('sound');
    expect(progress.value.sessions).toHaveLength(0);
    clearQuizSession();
    expect(progress.value.sessions).toHaveLength(0);
    expect(progress.value.attempts).toHaveLength(1);
  });

  it('keeps the demo out of session history and preserves the preceding summary', () => {
    startPractice();
    nameCorrectly();
    next();
    const previousSummary = summary.value;
    const previousHistory = progress.value.sessions;
    startCustomSession({ key: 'demo', mode: 'demo', itemIds: [sound.id], seed: 'demo-lifecycle' });
    spot('sound');
    expect(progress.value.sessions).toEqual(previousHistory);
    expect(next()).toBe('finished');
    expect(progress.value.onboarded).toBe(true);
    expect(summary.value).toBe(previousSummary);
    expect(progress.value.sessions).toEqual(previousHistory);
  });

  it.each([
    ['directly', clearQuizSession],
    ['through the shared replacement lifecycle', invalidateSessionCaches],
  ] as const)('clears both quiz caches %s without erasing saved progress', (_, invalidate) => {
    startPractice();
    nameCorrectly();
    next();
    startPractice([flawed.id, sound.id]);
    const saved = progress.value;
    expect(session.value).not.toBeNull();
    expect(summary.value).not.toBeNull();
    invalidate();
    expect(session.value).toBeNull();
    expect(summary.value).toBeNull();
    expect(progress.value).toBe(saved);
  });
});
