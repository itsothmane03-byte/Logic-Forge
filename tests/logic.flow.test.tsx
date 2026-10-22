// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logicItems } from '../src/data/logic';
import { logicVerdict, type LogicItem, type LogicVerdict } from '../src/engine/logic';
import { defaultProgress } from '../src/engine/storage';
import { checkLogic, clearLogicSession, logicSession, startLogic } from '../src/state/logic';
import { progress, storageOk } from '../src/state/store';
import { LogicScreen } from '../src/ui/screens/Logic';

const labels: Record<LogicVerdict, string> = {
  must: 'Must be true', cannot: 'Must be false', possible: 'Could be either',
};
const keys: Record<LogicVerdict, string> = { must: '1', cannot: '2', possible: '3' };

beforeEach(() => {
  localStorage.clear();
  clearLogicSession();
  progress.value = { ...defaultProgress(), boxes: { fal_ad_hominem: 4 }, repair: { recent: ['rep_old_car'], answered: 7, correct: 3, sets: 1 } };
  storageOk.value = true;
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

afterEach(cleanup);

/** A real five-item session with the scenario under examination first. */
function startWith(item: LogicItem): void {
  startLogic('ui-scenarios');
  const state = logicSession.peek()!;
  logicSession.value = { ...state, items: [item, ...state.items.filter((other) => other.id !== item.id)].slice(0, 5) };
}

function chooseCurrent(correct = true): void {
  const state = logicSession.peek()!;
  const truth = logicVerdict(state.items[state.index]!);
  const choice = correct ? truth : truth === 'must' ? 'cannot' : 'must';
  fireEvent.click(screen.getByRole('radio', { name: labels[choice], exact: true }));
  fireEvent.click(screen.getByRole('button', { name: /^Check my answer/ }));
}

describe('What follows? activity flow', () => {
  it('presents separate facts and claim with three accessible, unselected answers', () => {
    startLogic('visible-facts');
    const item = logicSession.peek()!.items[0]!;
    render(<LogicScreen />);
    const facts = screen.getByRole('region', { name: 'Given facts' });
    expect(within(facts).getAllByRole('listitem')).toHaveLength(item.premises.length);
    for (const premise of item.premises) expect(within(facts).getByText(premise.text)).toBeTruthy();
    expect(within(screen.getByRole('region', { name: 'The claim' })).getByText(item.claim.text)).toBeTruthy();
    expect(screen.getByText('Treat the facts as true. Use only those facts.')).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: 'What can you conclude?' })).toBeTruthy();
    for (const label of Object.values(labels)) {
      const radio = screen.getByRole('radio', { name: label, exact: true }) as HTMLInputElement;
      expect(radio.checked).toBe(false);
    }
    expect((screen.getByRole('button', { name: /^Check my answer/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: item.title, exact: true }));
  });

  it('explains the actual wrong verdict, locks the answer, and resets feedback for the next puzzle', () => {
    startLogic('wrong-verdict');
    const state = logicSession.peek()!;
    const item = state.items[0]!;
    const truth = logicVerdict(item);
    const wrong = truth === 'must' ? 'cannot' : 'must';
    render(<LogicScreen />);
    chooseCurrent(false);
    const feedback = screen.getByRole('status');
    expect(within(feedback).getByRole('heading', { name: labels[truth], exact: true })).toBeTruthy();
    expect(feedback.textContent).toContain(`Your choice: ${labels[wrong]}.`);
    expect(feedback.textContent).toContain(item.explanation);
    expect(screen.getAllByRole('radio').every((radio) => (radio as HTMLInputElement).disabled)).toBe(true);
    checkLogic();
    expect(progress.peek().logic.answered).toBe(1);
    expect(progress.peek().logic.correct).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: /^Next puzzle/ }));
    expect(screen.queryByText(item.explanation)).toBeNull();
    expect(screen.getByText('2 / 5')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: state.items[1]!.title, exact: true }));
  });

  it('supports number keys and Enter while preserving native disclosure keyboard behavior', () => {
    startLogic('keyboard-flow');
    const item = logicSession.peek()!.items[0]!;
    const truth = logicVerdict(item);
    render(<LogicScreen />);
    fireEvent.keyDown(window, { key: keys[truth] });
    expect((screen.getByRole('radio', { name: labels[truth], exact: true }) as HTMLInputElement).checked).toBe(true);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.getByRole('heading', { name: 'That’s right.' })).toBeTruthy();
    const feedback = screen.getByRole('status');
    expect(document.activeElement).toBe(feedback);
    const summary = feedback.querySelector('summary')!;
    expect(summary).not.toBeNull();
    // Enter should remain available for the browser to open this disclosure.
    expect(fireEvent.keyDown(summary, { key: 'Enter' })).toBe(true);
    expect(logicSession.peek()!.index).toBe(0);
    expect(progress.peek().logic.answered).toBe(1);
    fireEvent.keyDown(feedback, { key: 'Enter' });
    expect(screen.getByText('2 / 5')).toBeTruthy();
  });

  it('reveals two concrete permitted situations for a could-be-either claim', () => {
    const item = logicItems.find((candidate) => candidate.id === 'logic_studio_code')!;
    startWith(item);
    render(<LogicScreen />);
    chooseCurrent();
    const summary = screen.getByText('See two situations that fit');
    const details = summary.closest('details')!;
    expect(details.open).toBe(false);
    fireEvent.click(summary);
    expect(details.open).toBe(true);
    const trueSituation = within(details).getByRole('region', { name: 'Claim true' });
    const falseSituation = within(details).getByRole('region', { name: 'Claim false' });
    for (const region of [trueSituation, falseSituation]) {
      expect(region.querySelectorAll('dt')).toHaveLength(2);
      expect(region.textContent).toContain(item.atoms.code);
      expect(region.textContent).toContain(item.atoms.reserved);
    }
    // Both cases have a code; the reservation is the part that can differ.
    expect(trueSituation.querySelectorAll('dd')[0]!.textContent).toBe('True');
    expect(falseSituation.querySelectorAll('dd')[0]!.textContent).toBe('False');
    expect(trueSituation.querySelectorAll('dd')[1]!.textContent).toBe('True');
    expect(falseSituation.querySelectorAll('dd')[1]!.textContent).toBe('True');
    expect(details.textContent).toContain(item.lesson);
    fireEvent.click(screen.getByRole('button', { name: /^Next puzzle/ }));
    expect(screen.queryByText('See two situations that fit')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Claim true' })).toBeNull();
  });

  it('finishes a set, retries only the missed puzzle, and keeps other activity scores unchanged', () => {
    const original = progress.peek();
    startLogic('ui-retry');
    const items = logicSession.peek()!.items;
    render(<LogicScreen />);
    for (let index = 0; index < items.length; index += 1) {
      chooseCurrent(index !== 2);
      fireEvent.click(screen.getByRole('button', { name: index === items.length - 1 ? /^See results/ : /^Next puzzle/ }));
    }
    expect(screen.getByRole('heading', { name: 'Set complete.' })).toBeTruthy();
    expect(progress.peek().logic).toMatchObject({ answered: 5, correct: 4, sets: 1 });
    const { logic: _before, ...otherBefore } = original;
    const { logic: _after, ...otherAfter } = progress.peek();
    expect(otherAfter).toEqual(otherBefore);
    fireEvent.click(screen.getByRole('button', { name: /^Retry missed puzzles/ }));
    expect(logicSession.peek()!.items.map((item) => item.id)).toEqual([items[2]!.id]);
    expect(screen.getByText('1 / 1')).toBeTruthy();
    expect(screen.getByRole('heading', { name: items[2]!.title, exact: true })).toBeTruthy();
    chooseCurrent();
    fireEvent.click(screen.getByRole('button', { name: /^See results/ }));
    expect(screen.getByRole('heading', { name: 'Set complete.' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Retry missed puzzles/ })).toBeNull();
    expect(progress.peek().logic).toMatchObject({ answered: 6, correct: 5 });
    const answered = progress.peek().logic.answered;
    fireEvent.click(screen.getByRole('button', { name: /^Try another set/ }));
    expect(logicSession.peek()!.answers).toEqual([]);
    expect(logicSession.peek()!.items.every((item) => !items.some((previous) => previous.id === item.id))).toBe(true);
    expect(progress.peek().logic.answered).toBe(answered);
  });

  it('explains a storage failure and still allows the next puzzle', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError'); });
    startLogic('ui-storage-failure');
    render(<LogicScreen />);
    chooseCurrent();
    expect(screen.getByText(/This browser could not save your latest progress/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Next puzzle/ }));
    expect(screen.getByText('2 / 5')).toBeTruthy();
    expect(progress.peek().logic.answered).toBe(1);
  });
});
