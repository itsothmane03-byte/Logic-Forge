// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logicVerdict } from '../src/engine/logic';
import { defaultProgress } from '../src/engine/storage';
import { clearLogicSession, logicSession, startLogic } from '../src/state/logic';
import { clearRepairSession, repairSession, startRepair } from '../src/state/repair';
import { session, startCustomSession } from '../src/state/session';
import { bank, fallacyName, progress, storageOk } from '../src/state/store';
import { LogicScreen } from '../src/ui/screens/Logic';
import { RepairScreen } from '../src/ui/screens/Repair';
import { SessionScreen } from '../src/ui/screens/Session';

const flawed = bank.items.filter((item) => !item.isSound && item.format !== 'chat').slice(0, 3);
const button = (name: string | RegExp) => screen.getByRole('button', { name, exact: typeof name === 'string' });
const click = (name: string | RegExp) => fireEvent.click(button(name));
const key = (value: string) => fireEvent.keyDown(window, { key: value });

beforeEach(() => {
  localStorage.clear();
  session.value = null;
  clearRepairSession();
  clearLogicSession();
  progress.value = defaultProgress();
  storageOk.value = true;
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});
afterEach(cleanup);

describe('read-only question navigation', () => {
  it('preserves the quiz Name-step draft and shows the actual earlier spot answer', () => {
    startCustomSession({ key: 'practice', mode: 'practice', itemIds: flawed.map((item) => item.id), seed: 'review-draft' });
    render(<SessionScreen route={{ name: 'play', mode: 'practice' }} />);
    expect(screen.queryByRole('button', { name: 'Previous', exact: true })).toBeNull();
    key('s'); // First flawed passage deliberately answered Sound.
    click(/^Continue/);
    key('f');
    fireEvent.click(screen.getAllByRole('radio')[1]!);
    const draft = session.peek()!;
    const saved = progress.peek();
    click('Previous');
    expect(screen.getByText('Your answer: Sound.')).toBeTruthy();
    expect(screen.getByText("There's a flaw here.")).toBeTruthy();
    expect(screen.queryByText(/Why not/)).toBeNull();
    expect(screen.getByText('Reviewing 1 of 3 · Read only')).toBeTruthy();
    expect((button('Previous') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText('Which fallacy?')).toBeNull();
    for (const value of ['f', 's', '1']) key(value);
    expect(session.peek()).toBe(draft);
    expect(progress.peek()).toBe(saved);
    click('Return to current');
    expect(screen.getByText('Which fallacy?')).toBeTruthy();
    expect((screen.getAllByRole('radio')[1] as HTMLInputElement).checked).toBe(true);
    expect(session.peek()).toBe(draft);
    expect(progress.peek()).toBe(saved);
    click(/^Check/);
    expect(progress.peek().attempts).toHaveLength(2);
  });

  it('keeps original named feedback and final feedback without finishing or rescoring during review', () => {
    startCustomSession({ key: 'practice', mode: 'practice', itemIds: flawed.slice(0, 2).map((item) => item.id), seed: 'review-final' });
    render(<SessionScreen route={{ name: 'play', mode: 'practice' }} />);
    key('f');
    const wrong = screen.getAllByRole('radio').find((radio) => (radio as HTMLInputElement).value !== flawed[0]!.fallacyId)!;
    const named = (wrong as HTMLInputElement).value;
    fireEvent.click(wrong);
    click(/^Check/);
    const originalFeedback = screen.getByRole('status').textContent!;
    const originalContrast = document.querySelector('.sheet__why')?.textContent ?? null;
    click(/^Continue/);
    key('s'); // Final checked feedback, before See results.
    const finalState = session.peek();
    const saved = progress.peek();
    expect(saved.sessions).toHaveLength(1);
    click('Previous');
    expect(screen.getByText(`Your answer: Flawed · ${fallacyName(named)}.`)).toBeTruthy();
    expect(screen.getByText('Right instinct, wrong name.')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain(`You picked ${fallacyName(named)}.`);
    expect(originalFeedback).toContain(`You picked ${fallacyName(named)}.`);
    expect(document.querySelector('.sheet__why')?.textContent ?? null).toBe(originalContrast);
    expect(screen.getAllByRole('radio').every((radio) => (radio as HTMLInputElement).disabled)).toBe(true);
    expect(screen.queryByRole('button', { name: /^See results/ })).toBeNull();
    click('Next');
    expect(button(/^See results/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Next', exact: true })).toBeNull();
    expect(session.peek()).toBe(finalState);
    expect(progress.peek()).toBe(saved);
    expect(session.peek()!.finished).toBe(false);
  });

  it('explains unavailable original choices on a resumed Daily without fabricating a named answer', () => {
    startCustomSession({ key: 'daily:2026-10-22', mode: 'daily', dateKey: '2026-10-22',
      itemIds: flawed.slice(0, 2).map((item) => item.id), seed: 'resumed-review', outcomes: ['partial'] });
    render(<SessionScreen route={{ name: 'play', mode: 'daily' }} />);
    const current = session.peek();
    click('Previous');
    expect(screen.getByText(/original choice is unavailable after reopening/)).toBeTruthy();
    expect(screen.queryByText(/You picked/)).toBeNull();
    expect(screen.queryByText(/Why not/)).toBeNull();
    click('Next');
    expect(screen.getByText('Is the reasoning sound?')).toBeTruthy();
    expect(session.peek()).toBe(current);
    expect(progress.peek().attempts).toHaveLength(0);
  });

  it('reviews repair answers in order, locks original choices, and restores the current draft', () => {
    startRepair('repair-review');
    const items = repairSession.peek()!.items;
    render(<RepairScreen />);
    for (let index = 0; index < 2; index += 1) {
      const choice = items[index]!.options.find((option) => option.correct === (index === 1))!;
      fireEvent.click(screen.getByRole('radio', { name: choice.text }));
      click(/^Check my revision/);
      click(/^Next argument/);
    }
    const draftOption = items[2]!.options[1]!;
    fireEvent.click(screen.getByRole('radio', { name: draftOption.text }));
    const draft = repairSession.peek();
    const saved = progress.peek();
    click('Previous');
    click('Previous');
    const original = items[0]!.options.find((option) => !option.correct)!;
    expect(screen.getByRole('status').textContent).toContain(original.explanation);
    const originalRadio = screen.getAllByRole('radio').find((radio) => (radio as HTMLInputElement).value === original.id) as HTMLInputElement;
    expect(originalRadio.checked).toBe(true);
    expect(screen.getAllByRole('radio').every((radio) => (radio as HTMLInputElement).disabled)).toBe(true);
    expect((button('Previous') as HTMLButtonElement).disabled).toBe(true);
    key('1');
    const disclosure = screen.getByText('Why this repair helps');
    expect(fireEvent.keyDown(disclosure, { key: 'Enter' })).toBe(true);
    expect(repairSession.peek()).toBe(draft);
    click('Next');
    expect(screen.getByRole('heading', { name: items[1]!.title, exact: true })).toBeTruthy();
    click('Next');
    expect((screen.getByRole('radio', { name: draftOption.text }) as HTMLInputElement).checked).toBe(true);
    expect(repairSession.peek()).toBe(draft);
    expect(progress.peek()).toBe(saved);
    click(/^Check my revision/);
    expect(progress.peek().repair.answered).toBe(3);
  });

  it('shows actual earlier logic feedback, preserves a draft, and leaves disclosure Enter native', () => {
    startLogic('logic-review');
    const items = logicSession.peek()!.items;
    render(<LogicScreen />);
    // Choose a known wrong verdict on puzzle one.
    const wrongIndex = logicVerdict(items[0]!) === 'must' ? 1 : 0;
    fireEvent.click(screen.getAllByRole('radio')[wrongIndex]!);
    click(/^Check my answer/);
    const originalChoiceText = screen.getByText(/^Your choice:/).textContent;
    click(/^Next puzzle/);
    fireEvent.click(screen.getAllByRole('radio')[2]!);
    const draft = logicSession.peek();
    const saved = progress.peek();
    click('Previous');
    expect(screen.getByText(/^Your choice:/).textContent).toBe(originalChoiceText);
    expect(screen.getByRole('status').textContent).toContain(items[0]!.explanation);
    expect((screen.getAllByRole('radio')[wrongIndex] as HTMLInputElement).checked).toBe(true);
    expect(screen.getAllByRole('radio').every((radio) => (radio as HTMLInputElement).disabled)).toBe(true);
    key('2');
    const disclosure = within(screen.getByRole('status')).getByText(/See .*situation/);
    expect(fireEvent.keyDown(disclosure, { key: 'Enter' })).toBe(true);
    expect(logicSession.peek()).toBe(draft);
    key('Enter');
    expect((screen.getAllByRole('radio')[2] as HTMLInputElement).checked).toBe(true);
    expect(logicSession.peek()).toBe(draft);
    expect(progress.peek()).toBe(saved);
    click(/^Check my answer/);
    expect(progress.peek().logic.answered).toBe(2);
  });

  it.each(['repair', 'logic'] as const)('cannot finish a %s set by reviewing final feedback', (mode) => {
    if (mode === 'repair') startRepair('final-review');
    else startLogic('final-review');
    render(mode === 'repair' ? <RepairScreen /> : <LogicScreen />);
    for (let index = 0; index < 5; index += 1) {
      fireEvent.click(screen.getAllByRole('radio')[0]!);
      click(mode === 'repair' ? /^Check my revision/ : /^Check my answer/);
      if (index < 4) click(mode === 'repair' ? /^Next argument/ : /^Next puzzle/);
    }
    const saved = progress.peek();
    const current = mode === 'repair' ? repairSession.peek() : logicSession.peek();
    click('Previous');
    expect(screen.queryByRole('button', { name: /^See results/ })).toBeNull();
    click('Return to current');
    expect(button(/^See results/)).toBeTruthy();
    expect((mode === 'repair' ? repairSession.peek() : logicSession.peek())).toBe(current);
    expect(progress.peek()).toBe(saved);
    expect(current!.finished).toBe(false);
    expect(saved[mode].sets).toBe(1);
    click(/^See results/);
    expect((mode === 'repair' ? repairSession.peek() : logicSession.peek())!.finished).toBe(true);
    expect(progress.peek()).toBe(saved);
  });
});
