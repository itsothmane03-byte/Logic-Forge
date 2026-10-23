// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultProgress, STORAGE_KEY } from '../src/engine/storage';
import type { Mode } from '../src/engine/types';
import {
  clearQuizSession, currentItem, next, session, spot, startCustomSession,
  swapUnfamiliarExample,
} from '../src/state/session';
import { bank, commit, progress, setInterests, storageOk } from '../src/state/store';

const sound = bank.items.find((item) => item.isSound)!;
const flawed = bank.items.find((item) => !item.isSound)!;

beforeEach(() => {
  localStorage.clear();
  clearQuizSession();
  progress.value = defaultProgress();
  storageOk.value = true;
  vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-10-22T14:00:00Z').getTime());
});

afterEach(() => vi.restoreAllMocks());

function start(itemIds = [sound.id, flawed.id], mode: Mode = 'practice'): void {
  startCustomSession({ key: mode, mode, itemIds, seed: 'topic-swap',
    ...(mode === 'focus' ? { focusId: flawed.fallacyId } : {}),
    ...(mode === 'daily' ? { dateKey: '2026-10-22' } : {}),
  });
}

describe('unfamiliar-topic swaps', () => {
  it('keeps fallback skills away from adjacent Practice questions', () => {
    const neighbor = bank.items.find((item) => !item.isSound && item.fallacyId !== flawed.fallacyId)!;
    start([flawed.id, neighbor.id]);
    const active = session.peek()!;
    session.value = { ...active, skippedItemIds: bank.items.filter((item) => item.fallacyId === flawed.fallacyId).map((item) => item.id) };
    expect(swapUnfamiliarExample()).toBe('changed');
    expect(currentItem()!.fallacyId).not.toBe(neighbor.fallacyId);
    expect(currentItem()!.difficulty).toBe(flawed.difficulty);
    expect(progress.peek().attempts).toHaveLength(0);
  });

  it('replaces sound examples without changing their difficulty or writing any learning data', () => {
    setInterests(['tech']);
    const future = bank.items.find((item) => item.isSound && item.id !== sound.id)!;
    const planned = [sound.id, flawed.id, future.id];
    start(planned);
    const saved = progress.peek();
    const serialized = localStorage.getItem(STORAGE_KEY);
    const seen = new Set(planned);

    for (let index = 0; index < 5; index += 1) {
      const before = session.peek()!;
      expect(swapUnfamiliarExample()).toBe('changed');
      const after = session.peek()!;
      const replacement = currentItem()!;
      expect(seen.has(replacement.id)).toBe(false);
      expect(replacement.isSound).toBe(true);
      expect(replacement.difficulty).toBe(sound.difficulty);
      expect(after.itemIds.slice(1)).toEqual(planned.slice(1));
      expect(after.index).toBe(0);
      expect(after.phase).toBe('spot');
      expect(after.outcomes).toEqual([]);
      expect(after.picks).toEqual([]);
      expect(after.boxesAtStart).toEqual(before.boxesAtStart);
      expect(after.skippedItemIds).toContain(before.itemIds[0]);
      expect(after.skippedItemIds).toHaveLength(index + 1);
      expect(progress.peek()).toBe(saved);
      expect(localStorage.getItem(STORAGE_KEY)).toBe(serialized);
      seen.add(replacement.id);
    }
  });

  it('keeps a Focus question on its reasoning skill when an unused equivalent exists', () => {
    const alternatives = bank.items.filter((item) => item.fallacyId === flawed.fallacyId
      && item.difficulty === flawed.difficulty && item.id !== flawed.id);
    expect(alternatives.length).toBeGreaterThan(0);
    start([flawed.id], 'focus');
    expect(swapUnfamiliarExample()).toBe('changed');
    expect(currentItem()?.fallacyId).toBe(flawed.fallacyId);
    expect(currentItem()?.difficulty).toBe(flawed.difficulty);
  });

  it('preserves earlier checked answers and records the replacement only when it is answered', () => {
    start([flawed.id, sound.id]);
    spot('sound'); // A real incorrect first answer, already saved.
    next();
    const before = session.peek()!;
    const saved = progress.peek();
    const serialized = localStorage.getItem(STORAGE_KEY);
    expect(swapUnfamiliarExample()).toBe('changed');
    const after = session.peek()!;
    const replacement = currentItem()!;
    expect(after.index).toBe(1);
    expect(after.itemIds[0]).toBe(flawed.id);
    expect(after.outcomes).toEqual(before.outcomes);
    expect(after.picks).toEqual(before.picks);
    expect(after.outcomes).toEqual(['wrong']);
    expect(progress.peek()).toBe(saved);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(serialized);

    spot('sound');
    expect(progress.peek().attempts.map((attempt) => attempt.itemId)).toEqual([flawed.id, replacement.id]);
    expect(progress.peek().attempts.some((attempt) => attempt.itemId === sound.id)).toBe(false);
    expect(progress.peek().sessions).toEqual([{ mode: 'practice', at: Date.now(), total: 2, correct: 1 }]);
  });

  it('leaves the active question and saved progress intact when the matching pool is exhausted', () => {
    commit(defaultProgress());
    start(bank.items.map((item) => item.id));
    const before = session.peek();
    const saved = progress.peek();
    const serialized = localStorage.getItem(STORAGE_KEY);
    expect(swapUnfamiliarExample()).toBe('unavailable');
    expect(session.peek()).toBe(before);
    expect(progress.peek()).toBe(saved);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(serialized);
  });

  it.each(['daily', 'review', 'demo'] as const)('cannot swap the shared or fixed items in %s mode', (mode) => {
    start([sound.id, flawed.id], mode);
    const before = session.peek();
    const saved = progress.peek();
    expect(swapUnfamiliarExample()).toBe('not-allowed');
    expect(session.peek()).toBe(before);
    expect(progress.peek()).toBe(saved);
  });

  it('cannot replace a Name-step draft, checked feedback, finished set, or missing session', () => {
    expect(swapUnfamiliarExample()).toBe('not-allowed');
    start([flawed.id]);
    spot('flawed');
    const named = session.peek();
    expect(swapUnfamiliarExample()).toBe('not-allowed');
    expect(session.peek()).toBe(named);
    start([sound.id]);
    spot('sound');
    const feedback = session.peek();
    const saved = progress.peek();
    expect(swapUnfamiliarExample()).toBe('not-allowed');
    expect(session.peek()).toBe(feedback);
    next();
    const finished = session.peek();
    expect(swapUnfamiliarExample()).toBe('not-allowed');
    expect(session.peek()).toBe(finished);
    expect(progress.peek()).toBe(saved);
  });
});
