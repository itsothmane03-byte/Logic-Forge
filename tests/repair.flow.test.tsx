// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { repairs } from '../src/data/repairs';
import { repairOptions, type RepairItem } from '../src/engine/repair';
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

function reviewItem(id = 'rep_review_fixture'): RepairItem {
  return {
    id,
    title: `The book recommendation ${id}`,
    fallacyId: 'fal_hasty_generalization',
    passage: 'Two classmates liked this book, so everyone will love it.',
    principle: 'Check a wider range of readers before generalizing.',
    options: [
      { id: 'a', text: 'Two classmates liked the book. Ask more readers before calling it a favorite.', correct: true,
        explanation: 'A small group can suggest a possibility, but a wider sample is needed.' },
      { id: 'b', text: 'Two classmates really liked the book, so everyone will definitely love it.', correct: false,
        explanation: 'Enthusiasm does not make two classmates representative of everyone.' },
      { id: 'c', text: 'The author is famous, so everyone will love this book.', correct: false,
        explanation: 'Fame does not establish what every reader will enjoy.' },
    ],
    review: { highlights: ['Two classmates', 'Ask more readers'], question: 'Would a larger and more varied group agree?' },
  };
}

function useItems(items: RepairItem[]): void {
  repairSession.value = {
    seed: 'annotated-review', items, index: 0, selected: null, checked: false, finished: false, answers: [],
  };
}

describe('argument repair flow', () => {
  it('keeps review hints out of the page until an answer is checked', () => {
    const item = reviewItem();
    useItems([item, reviewItem('rep_next_fixture')]);
    const { container } = render(<RepairScreen />);
    const question = item.review!.question;
    expect(screen.queryByText(question)).toBeNull();
    expect(screen.queryByText(item.principle)).toBeNull();
    expect(container.querySelectorAll('.repair-options strong, .repair-options mark')).toHaveLength(0);

    fireEvent.click(screen.getByRole('radio', { name: item.options[0]!.text }));
    expect(screen.queryByText(question)).toBeNull();
    expect(container.querySelectorAll('.repair-options strong, .repair-options mark')).toHaveLength(0);
    expect(progress.peek().repair.answered).toBe(0);
  });

  it.each([true, false])('shows the annotated strongest revision after a %s answer, then clears it for the next argument', (chooseCorrect) => {
    const item = reviewItem();
    const next = { ...reviewItem('rep_next_fixture'), review: {
      highlights: ['Ask more readers'], question: 'Who else should we ask about this book?',
    } };
    useItems([item, next]);
    const { container } = render(<RepairScreen />);
    const selected = item.options.find((option) => option.correct === chooseCorrect)!;
    const correct = item.options.find((option) => option.correct)!;
    fireEvent.click(screen.getByRole('radio', { name: selected.text }));
    fireEvent.click(screen.getByRole('button', { name: /^Check my revision/ }));

    const verdict = chooseCorrect ? 'That makes it stronger.' : 'This still leaves a problem.';
    const feedback = screen.getByRole('region', { name: verdict });
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: verdict }));
    expect(feedback.getAttribute('aria-live')).toBeNull();
    expect(feedback.textContent).toContain(selected.explanation);
    expect(feedback.textContent).toContain(correct.text);
    expect(feedback.textContent).toContain(item.review!.question);
    const emphasized = [...feedback.querySelectorAll('strong, mark')].map((node) => node.textContent);
    for (const highlight of item.review!.highlights) {
      expect(emphasized.some((text) => text?.includes(highlight)), highlight).toBe(true);
    }
    expect(container.querySelectorAll('.repair-options strong, .repair-options mark')).toHaveLength(0);
    expect(progress.peek().repair).toMatchObject({ answered: 1, correct: chooseCorrect ? 1 : 0, sets: 0 });

    fireEvent.click(screen.getByRole('button', { name: /^Next argument/ }));
    expect(screen.queryByText(item.review!.question)).toBeNull();
    expect(screen.queryByText(next.review.question)).toBeNull();
    expect(container.querySelector('.repair-feedback')).toBeNull();
    expect(container.querySelectorAll('.repair-options strong, .repair-options mark')).toHaveLength(0);
    expect(screen.getByRole('heading', { name: next.title })).toBeTruthy();
  });

  it('still checks and explains an older exercise with no review metadata', () => {
    const { review: _review, ...legacy } = reviewItem();
    useItems([legacy]);
    render(<RepairScreen />);
    const correct = legacy.options.find((option) => option.correct)!;
    fireEvent.click(screen.getByRole('radio', { name: correct.text }));
    fireEvent.click(screen.getByRole('button', { name: /^Check my revision/ }));
    expect(screen.getByText(correct.explanation)).toBeTruthy();
    expect(screen.getByText(legacy.principle)).toBeTruthy();
    expect(screen.queryByText(_review!.question)).toBeNull();
    expect(progress.peek().repair).toMatchObject({ answered: 1, correct: 1, sets: 1 });
    fireEvent.click(screen.getByRole('button', { name: /^See results/ }));
    expect(screen.getByRole('heading', { name: 'A little more thoughtful.' })).toBeTruthy();
  });

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
    const feedback = screen.getByRole('region', { name: 'This still leaves a problem.' });
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
    expect(screen.queryByRole('button', { name: /^Retry missed arguments/ })).toBeNull();
    expect(progress.peek().repair).toEqual({ recent: ids, answered: 5, correct: 5, sets: 1 });
    const { repair: _originalRepairs, ...originalQuiz } = original;
    const { repair: _newRepairs, ...newQuiz } = progress.peek();
    expect(newQuiz).toEqual(originalQuiz);
    fireEvent.click(screen.getByRole('button', { name: /^Try another set/ }));
    expect(repairSession.peek()!.answers).toHaveLength(0);
    if (repairs.length >= 10) expect(repairSession.peek()!.items.every((item) => !ids.includes(item.id))).toBe(true);
    expect(progress.peek().repair.sets).toBe(1);
  });

  it('retries only missed arguments and counts progress only when they are checked again', () => {
    startRepair('retry-mixed-set');
    const originalItems = repairSession.peek()!.items;
    const missedIds = [originalItems[1]!.id, originalItems[3]!.id];
    render(<RepairScreen />);
    for (let index = 0; index < originalItems.length; index += 1) {
      const item = originalItems[index]!;
      const shouldMiss = missedIds.includes(item.id);
      const option = item.options.find((candidate) => candidate.correct !== shouldMiss)!;
      fireEvent.click(screen.getByRole('radio', { name: option.text }));
      fireEvent.click(screen.getByRole('button', { name: /^Check my revision/ }));
      fireEvent.click(screen.getByRole('button', { name: index === originalItems.length - 1 ? /^See results/ : /^Next argument/ }));
    }
    const beforeRetry = progress.peek();
    expect(beforeRetry.repair).toEqual({
      recent: originalItems.map((item) => item.id), answered: 5, correct: 3, sets: 1,
    });

    fireEvent.click(screen.getByRole('button', { name: /^Retry missed arguments/ }));
    expect(repairSession.peek()!.items.map((item) => item.id)).toEqual(missedIds);
    expect(repairSession.peek()).toMatchObject({ index: 0, selected: null, checked: false, finished: false, answers: [] });
    expect(screen.getByText('1 / 2')).toBeTruthy();
    expect(progress.peek()).toBe(beforeRetry);

    for (let index = 0; index < missedIds.length; index += 1) {
      const item = repairSession.peek()!.items[index]!;
      const correct = item.options.find((option) => option.correct)!;
      const beforeSelection = progress.peek();
      fireEvent.click(screen.getByRole('radio', { name: correct.text }));
      expect(progress.peek()).toBe(beforeSelection);
      fireEvent.click(screen.getByRole('button', { name: /^Check my revision/ }));
      expect(progress.peek().repair.answered).toBe(6 + index);
      expect(progress.peek().repair.correct).toBe(4 + index);
      fireEvent.click(screen.getByRole('button', { name: index === missedIds.length - 1 ? /^See results/ : /^Next argument/ }));
    }
    expect(progress.peek().repair).toEqual({
      recent: [...beforeRetry.repair.recent, ...missedIds], answered: 7, correct: 5, sets: 2,
    });
    expect(screen.getByRole('heading', { name: 'A little more thoughtful.' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Retry missed arguments/ })).toBeNull();
  });

  it('stays usable when browser storage rejects a save', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError'); });
    startRepair('storage-failure');
    render(<RepairScreen />);
    const saveAnnouncement = screen.getByRole('status');
    expect(saveAnnouncement.textContent).toBe('');
    fireEvent.click(screen.getAllByRole('radio')[0]!);
    fireEvent.click(screen.getByRole('button', { name: /^Check my revision/ }));
    expect(screen.getByText(/This browser could not save/)).toBeTruthy();
    expect(screen.getByRole('status')).toBe(saveAnnouncement);
    expect(saveAnnouncement.textContent).toContain('This browser could not save');
    expect(saveAnnouncement.textContent).not.toContain('That makes it stronger.');
    expect(saveAnnouncement.textContent).not.toContain('This still leaves a problem.');
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
