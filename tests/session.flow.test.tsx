// @vitest-environment jsdom
// One rendered session flow: Spot -> Name -> Feedback -> Continue, by pointer
// and by keyboard, against the shipped question bank.

import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultProgress } from '../src/engine/storage';
import type { Item, Mode } from '../src/engine/types';
import { session, startCustomSession } from '../src/state/session';
import { bank, fallacyById, progress } from '../src/state/store';
import { SessionScreen } from '../src/ui/screens/Session';

const flawed: Item = bank.items.find((i) => !i.isSound && i.format !== 'chat') ?? bank.items.find((i) => !i.isSound)!;
const sound: Item = bank.items.find((i) => i.isSound)!;
const filler = bank.items.filter((i) => i.id !== flawed.id && i.id !== sound.id).slice(0, 8).map((i) => i.id);
const correctName = fallacyById.get(flawed.fallacyId!)!.name;

function start(itemIds: string[], mode: Mode = 'practice') {
  startCustomSession({ key: mode, mode, itemIds, seed: 'flow-test' });
  return render(<SessionScreen route={{ name: 'play', mode: mode === 'focus' ? 'practice' : mode }} />);
}

const key = (k: string) => fireEvent.keyDown(window, { key: k });

beforeEach(() => {
  localStorage.clear();
  progress.value = defaultProgress();
  session.value = null;
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

afterEach(() => cleanup());

describe('session flow', () => {
  it('spot flawed, then name, then feedback, then continue', () => {
    start([flawed.id, sound.id, ...filler]);
    expect(screen.getByText('Is the reasoning sound?')).toBeTruthy();
    expect(screen.getByText('1 / 10')).toBeTruthy();
    expect(document.querySelector('mark.cue')).toBeNull(); // no highlight before answering

    fireEvent.click(screen.getByRole('button', { name: /^Flawed/ }));
    expect(screen.getByText('Which fallacy?')).toBeTruthy();
    const options = screen.getAllByRole('radio');
    expect(options).toHaveLength(4);
    const check = screen.getByRole('button', { name: /^Check/ }) as HTMLButtonElement;
    expect(check.disabled).toBe(true);

    fireEvent.click(screen.getByRole('radio', { name: new RegExp(`^${correctName}`) }));
    expect(check.disabled).toBe(false);
    fireEvent.click(check);

    expect(screen.getByText('Spot on.')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain(correctName);
    expect(document.querySelector('mark.cue')?.textContent).toBe(flawed.cue);
    expect(progress.value.attempts.at(-1)).toMatchObject({ itemId: flawed.id, outcome: 'correct', mode: 'practice' });
    expect(progress.value.boxes[flawed.fallacyId!]).toBe(2);
    expect(screen.getByText(/Question 1: correct/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^Continue/ }));
    expect(screen.getByText('2 / 10')).toBeTruthy();
    expect(screen.getByText('Is the reasoning sound?')).toBeTruthy();
    expect(document.querySelector('mark.cue')).toBeNull();
  });

  it('works with the keyboard alone: F, a number key, Enter, Enter', () => {
    start([flawed.id, sound.id, ...filler]);
    key('f');
    expect(screen.getByText('Which fallacy?')).toBeTruthy();
    const target = screen.getByRole('radio', { name: new RegExp(`^${correctName}`) }) as HTMLInputElement;
    key(target.dataset.index!);
    expect(target.checked).toBe(true);
    key('Enter');
    expect(screen.getByText('Spot on.')).toBeTruthy();
    key('Enter');
    expect(screen.getByText('2 / 10')).toBeTruthy();
  });

  it('a wrong name is "Right instinct, wrong name."', () => {
    start([flawed.id, ...filler]);
    key('f');
    const wrong = screen.getAllByRole('radio').find((r) => !r.closest('label')?.textContent?.startsWith(`${correctName}`) && !(r.closest('label')?.textContent ?? '').includes(correctName))!;
    fireEvent.click(wrong);
    fireEvent.click(screen.getByRole('button', { name: /^Check/ }));
    expect(screen.getByText('Right instinct, wrong name.')).toBeTruthy();
    expect(progress.value.attempts.at(-1)?.outcome).toBe('partial');
  });

  it('a sound near-miss answered Sound skips the Name step', () => {
    start([sound.id, ...filler]);
    key('s');
    expect(screen.queryByText('Which fallacy?')).toBeNull();
    expect(screen.getByText('Sound, and sneaky.')).toBeTruthy();
    expect(progress.value.soundStats).toEqual({ seen: 1, correct: 1 });
  });

  it('calling a sound passage flawed says so and names the look-alike', () => {
    start([sound.id, ...filler]);
    key('f');
    expect(screen.getByText("This one's actually sound.")).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain(fallacyById.get(sound.resembles!)!.name);
  });
});
