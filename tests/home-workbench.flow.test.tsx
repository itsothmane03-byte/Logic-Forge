// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dateKey } from '../src/engine/dates';
import { pickDemoItem } from '../src/engine/select';
import { defaultProgress, STORAGE_KEY } from '../src/engine/storage';
import { replaceRoute } from '../src/router';
import { invalidateSessionCaches } from '../src/state/lifecycle';
import { session, summary } from '../src/state/session';
import { bank, progress, storageOk } from '../src/state/store';
import { WelcomeScreen } from '../src/ui/screens/Welcome';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-25T14:00:00Z'));
  localStorage.clear();
  invalidateSessionCaches();
  progress.value = defaultProgress();
  storageOk.value = true;
  replaceRoute('#/');
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('working home entry', () => {
  it('reveals the actual sample explanation only after answering, without recording an attempt', () => {
    const demo = pickDemoItem(bank)!;
    const saved = progress.peek();
    const serialized = localStorage.getItem(STORAGE_KEY);
    render(<WelcomeScreen />);
    expect(screen.queryByText(demo.explanation)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Sound', exact: true }));
    expect(screen.getByText(demo.explanation)).toBeTruthy();
    expect(progress.peek()).toBe(saved);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(serialized);
    expect(session.peek()).toBeNull();
  });

  it('shows the saved daily resume state on Home instead of advertising a fresh challenge', () => {
    const today = dateKey();
    const itemIds = bank.items.slice(0, 10).map((item) => item.id);
    progress.value = { ...defaultProgress(), daily: { [today]: {
      itemIds, answers: ['correct', 'wrong', 'partial'], done: false,
    } } };
    const saved = progress.peek();
    render(<WelcomeScreen />);
    expect(screen.getByRole('link', { name: /Resume.*3.*10/ }).getAttribute('href')).toBe('#/play/daily');
    expect(progress.peek()).toBe(saved);
    expect(session.peek()).toBeNull();
  });

  it('opens the completed daily result from Home without starting or changing an exercise', () => {
    const today = dateKey();
    const itemIds = bank.items.slice(0, 10).map((item) => item.id);
    progress.value = { ...defaultProgress(), daily: { [today]: {
      itemIds, answers: Array.from({ length: 10 }, () => 'correct' as const), done: true,
    } } };
    const saved = progress.peek();
    render(<WelcomeScreen />);
    fireEvent.click(screen.getByRole('button', { name: /Done.*10.*10/ }));
    expect(location.hash).toBe('#/summary');
    expect(summary.peek()?.outcomes).toHaveLength(10);
    expect(progress.peek()).toBe(saved);
    expect(session.peek()).toBeNull();
  });
});
