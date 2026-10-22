// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logicVerdict, type LogicVerdict } from '../src/engine/logic';
import { defaultProgress, loadProgress } from '../src/engine/storage';
import { checkLogic, clearLogicSession, logicSession, nextLogic, retryLogicMisses, selectLogicVerdict, startLogic } from '../src/state/logic';
import { progress, replaceProgress, resetProgress, storageOk } from '../src/state/store';

beforeEach(() => {
  localStorage.clear();
  clearLogicSession();
  progress.value = {
    ...defaultProgress(),
    settings: { theme: 'dark', showDefinitions: false },
    boxes: { fal_ad_hominem: 4 },
    days: { '2026-10-20': 10 },
    repair: { recent: ['rep_old_car'], answered: 7, correct: 3, sets: 1 },
  };
  storageOk.value = true;
});

function answerCurrent(correct: boolean): string {
  const state = logicSession.peek()!;
  const item = state.items[state.index]!;
  const truth = logicVerdict(item);
  const choice: LogicVerdict = correct ? truth : truth === 'must' ? 'cannot' : 'must';
  selectLogicVerdict(choice);
  checkLogic();
  return item.id;
}

describe('logic activity state', () => {
  it('saves each checked answer once without changing quiz or repair scores', () => {
    const original = progress.peek();
    startLogic('independent-scores');
    const id = answerCurrent(true);
    const checked = logicSession.peek()!;
    checkLogic();
    selectLogicVerdict('cannot');
    expect(logicSession.peek()).toBe(checked);
    expect(progress.peek().logic).toEqual({ recent: [id], answered: 1, correct: 1, sets: 0 });
    const { logic: _before, ...otherBefore } = original;
    const { logic: _after, ...otherAfter } = progress.peek();
    expect(otherAfter).toEqual(otherBefore);
    expect(loadProgress(localStorage).logic).toEqual(progress.peek().logic);
    nextLogic();
    checkLogic();
    expect(logicSession.peek()!.index).toBe(1);
    expect(logicSession.peek()!.selected).toBeNull();
    expect(progress.peek().logic.answered).toBe(1);
  });

  it('ignores invalid choices, premature next/check, and retry before completion', () => {
    startLogic('guarded-transitions');
    const original = logicSession.peek();
    selectLogicVerdict('not-a-verdict' as LogicVerdict);
    checkLogic();
    nextLogic();
    retryLogicMisses();
    expect(logicSession.peek()).toBe(original);
    expect(progress.peek().logic.answered).toBe(0);
  });

  it('finishes a set, then retries only missed puzzles without rewriting prior results', () => {
    startLogic('retry-misses');
    const initial = logicSession.peek()!.items.map((item) => item.id);
    for (let index = 0; index < initial.length; index += 1) {
      answerCurrent(index !== 1);
      nextLogic();
    }
    const completed = logicSession.peek()!;
    expect(completed.finished).toBe(true);
    expect(completed.answers).toHaveLength(5);
    expect(progress.peek().logic).toEqual({ recent: initial, answered: 5, correct: 4, sets: 1 });
    checkLogic();
    nextLogic();
    expect(logicSession.peek()).toBe(completed);
    retryLogicMisses();
    expect(logicSession.peek()!.items.map((item) => item.id)).toEqual([initial[1]]);
    expect(logicSession.peek()!.answers).toEqual([]);
    expect(logicSession.peek()!.finished).toBe(false);
    expect(progress.peek().logic.answered).toBe(5);
    answerCurrent(true);
    nextLogic();
    expect(logicSession.peek()!.finished).toBe(true);
    expect(progress.peek().logic.answered).toBe(6);
    expect(progress.peek().logic.correct).toBe(5);
    expect(progress.peek().logic.recent).toEqual([...initial, initial[1]]);
  });

  it('does not retry a perfect set and avoids that set when starting the next one', () => {
    startLogic('perfect-set');
    const initial = logicSession.peek()!.items.map((item) => item.id);
    for (let index = 0; index < initial.length; index += 1) {
      answerCurrent(true);
      nextLogic();
    }
    const completed = logicSession.peek();
    retryLogicMisses();
    expect(logicSession.peek()).toBe(completed);
    startLogic('next-set');
    const next = logicSession.peek()!;
    expect(next.answers).toEqual([]);
    expect(next.items).toHaveLength(5);
    expect(next.items.every((item) => !initial.includes(item.id))).toBe(true);
    expect(new Set(next.items.map((item) => item.id)).size).toBe(5);
  });

  it('invalidates an active set when resetting progress, retaining display settings', () => {
    startLogic('reset-mid-set');
    answerCurrent(true);
    resetProgress();
    expect(logicSession.peek()).toBeNull();
    expect(progress.peek().logic).toEqual(defaultProgress().logic);
    expect(progress.peek().settings).toEqual({ theme: 'dark', showDefinitions: false });
    checkLogic();
    expect(progress.peek().logic.answered).toBe(0);
  });

  it('invalidates an active set when importing/replacing a save', () => {
    startLogic('import-mid-set');
    selectLogicVerdict('must');
    const imported = { ...defaultProgress(), logic: { recent: ['logic_studio_code'], answered: 11, correct: 7, sets: 2 } };
    replaceProgress(imported);
    expect(logicSession.peek()).toBeNull();
    checkLogic();
    expect(progress.peek()).toEqual(imported);
    expect(loadProgress(localStorage).logic).toEqual(imported.logic);
  });

  it('keeps the activity usable if browser storage rejects a save', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError'); });
    startLogic('storage-failure');
    answerCurrent(true);
    expect(storageOk.peek()).toBe(false);
    expect(progress.peek().logic.correct).toBe(1);
    nextLogic();
    expect(logicSession.peek()!.index).toBe(1);
    answerCurrent(true);
    expect(progress.peek().logic.answered).toBe(2);
    expect(progress.peek().logic.correct).toBe(2);
  });
});
