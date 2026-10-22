// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { repairs } from '../src/data/repairs';
import { repairOptions } from '../src/engine/repair';
import { defaultProgress } from '../src/engine/storage';
import { checkRepair, clearRepairSession, nextRepair, repairSession, selectRepairOption, startRepair } from '../src/state/repair';
import { progress, storageOk } from '../src/state/store';
import { RepairScreen } from '../src/ui/screens/Repair';

beforeEach(() => {
  localStorage.clear();
  clearRepairSession();
  progress.value = { ...defaultProgress(), boxes: { fal_ad_hominem: 4 }, days: { '2026-10-20': 10 } };
  storageOk.value = true;
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

afterEach(cleanup);

describe('argument repair flow', () => {
  it('explains the actual selected revision and locks it after checking', () => {
    startRepair('pointer-feedback');
    const item = repairSession.peek()!.items[0]!;
    const wrong = item.options.find((option) => !option.correct)!;
    const correct = item.options.find((option) => option.correct)!;
    render(<RepairScreen />);
    const check = screen.getByRole('button', { name: /^Check my revision/ }) as HTMLButtonElement;
    expect(check.disabled).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: wrong.text }));
    fireEvent.click(check);
    const feedback = screen.getByRole('status');
    expect(feedback.textContent).toContain(wrong.explanation);
    expect(feedback.textContent).toContain(correct.text);
    expect(feedback.textContent).toContain(correct.explanation);
    expect(screen.getAllByRole('radio').every((input) => (input as HTMLInputElement).disabled)).toBe(true);
    checkRepair();
    selectRepairOption(correct.id);
    expect(progress.peek().repair.answered).toBe(1);
    expect(repairSession.peek()!.selected).toBe(wrong.id);
    fireEvent.click(screen.getByRole('button', { name: /^Next argument/ }));
    expect(screen.getByText('2 / 5')).toBeTruthy();
    expect(screen.queryByText(wrong.explanation)).toBeNull();
  });

  it('supports number keys and Enter without counting an answer twice', () => {
    startRepair('keyboard');
    const state = repairSession.peek()!;
    const options = repairOptions(state.items[0]!, state.seed);
    const correctIndex = options.findIndex((option) => option.correct);
    render(<RepairScreen />);
    fireEvent.keyDown(window, { key: String(correctIndex + 1) });
    expect((screen.getAllByRole('radio')[correctIndex] as HTMLInputElement).checked).toBe(true);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.getByText('That makes it stronger.')).toBeTruthy();
    expect(progress.peek().repair.correct).toBe(1);
    checkRepair();
    expect(progress.peek().repair.correct).toBe(1);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.getByText('2 / 5')).toBeTruthy();
  });

  it('finishes five unique exercises, keeps quiz progress intact, and offers a fresh set', () => {
    const original = progress.peek();
    startRepair('whole-set');
    const ids = repairSession.peek()!.items.map((item) => item.id);
    expect(new Set(ids).size).toBe(5);
    render(<RepairScreen />);
    for (let index = 0; index < 5; index += 1) {
      const item = repairSession.peek()!.items[index]!;
      const correct = item.options.find((option) => option.correct)!;
      fireEvent.click(screen.getByRole('radio', { name: correct.text }));
      fireEvent.click(screen.getByRole('button', { name: /^Check my revision/ }));
      fireEvent.click(screen.getByRole('button', { name: index === 4 ? /^See results/ : /^Next argument/ }));
    }
    expect(screen.getByRole('heading', { name: 'A little more thoughtful.' })).toBeTruthy();
    expect(progress.peek().repair).toEqual({ recent: ids, answered: 5, correct: 5, sets: 1 });
    const { repair: _originalRepairs, ...originalQuiz } = original;
    const { repair: _newRepairs, ...newQuiz } = progress.peek();
    expect(newQuiz).toEqual(originalQuiz);
    fireEvent.click(screen.getByRole('button', { name: /^Try another set/ }));
    expect(repairSession.peek()!.answers).toHaveLength(0);
    if (repairs.length >= 10) expect(repairSession.peek()!.items.every((item) => !ids.includes(item.id))).toBe(true);
    expect(progress.peek().repair.sets).toBe(1);
  });

  it('stays usable when browser storage rejects a save', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError'); });
    startRepair('storage-failure');
    render(<RepairScreen />);
    fireEvent.click(screen.getAllByRole('radio')[0]!);
    fireEvent.click(screen.getByRole('button', { name: /^Check my revision/ }));
    expect(screen.getByText(/This browser could not save/)).toBeTruthy();
    expect(progress.peek().repair.answered).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: /^Next argument/ }));
    expect(screen.getByText('2 / 5')).toBeTruthy();
  });

  it('ignores invalid or premature transitions', () => {
    startRepair('guards');
    nextRepair();
    checkRepair();
    selectRepairOption('not-an-option');
    expect(repairSession.peek()!.selected).toBeNull();
    expect(repairSession.peek()!.index).toBe(0);
    expect(progress.peek().repair.answered).toBe(0);
  });
});
