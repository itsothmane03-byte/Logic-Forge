// Session store: creates/resumes sessions for play routes and applies answers.

import { signal } from '@preact/signals';
import { buildDaily, dailyNumber } from '../engine/daily';
import { dateKey } from '../engine/dates';
import { buildOptions } from '../engine/distractors';
import { masteryChanges, type MasteryChange } from '../engine/mastery';
import { rngFrom } from '../engine/rng';
import { sessionScore } from '../engine/score';
import { pickDemoItem, selectFocus, selectPractice, selectReview } from '../engine/select';
import * as S from '../engine/session';
import type { Item, Mode, Outcome, SpotChoice } from '../engine/types';
import type { PlayRoute } from '../router';
import { registerSessionInvalidator } from './lifecycle';
import { bank, bankItemIds, commit, fallacyById, itemById, markOnboarded, progress } from './store';

export const session = signal<S.SessionState | null>(null);

export interface SummaryData {
  mode: Mode;
  dateKey: string | null;
  dailyNumber: number | null;
  focusId: string | null;
  itemIds: string[];
  outcomes: Outcome[];
  picks: Array<S.AnswerPick | null>;
  changes: MasteryChange[];
}

export const summary = signal<SummaryData | null>(null);

export function sessionKey(route: PlayRoute, today: string): string {
  if (route.mode === 'daily') return `daily:${today}`;
  if (route.mode === 'focus') return `focus:${route.fallacyId}`;
  return route.mode;
}

export type PrepareResult =
  | { status: 'ready'; session: S.SessionState }
  | { status: 'daily-done' }
  | { status: 'review-empty' }
  | { status: 'unknown-fallacy' }
  | { status: 'no-items' };

/** Returns the in-progress session for this route, or creates one. */
export function prepareSession(route: PlayRoute, now = Date.now()): PrepareResult {
  const today = dateKey(now);
  const key = sessionKey(route, today);
  const current = session.value;
  if (current && current.key === key && !current.finished) return { status: 'ready', session: current };

  const p = progress.value;
  let itemIds: string[] = [];
  let outcomes: Outcome[] = [];
  let seed = `${route.mode}:${now}`;
  let focusId: string | null = null;
  let day: string | null = null;

  switch (route.mode) {
    case 'daily': {
      const record = p.daily[today];
      if (record?.done) return { status: 'daily-done' };
      const resumable = record && record.itemIds.length > 0 && record.itemIds.every((id) => bankItemIds.has(id));
      itemIds = resumable ? record.itemIds : buildDaily(bank.items, today);
      outcomes = resumable ? record.answers : [];
      seed = `daily:${today}`;
      day = today;
      break;
    }
    case 'practice':
      itemIds = selectPractice({ bank, boxes: p.boxes, attempts: p.attempts, rng: rngFrom(seed) });
      break;
    case 'focus':
      if (!fallacyById.has(route.fallacyId)) return { status: 'unknown-fallacy' };
      focusId = route.fallacyId;
      itemIds = selectFocus({ bank, fallacyId: route.fallacyId, rng: rngFrom(seed) });
      break;
    case 'review':
      itemIds = selectReview(p.attempts, bankItemIds);
      if (itemIds.length === 0) return { status: 'review-empty' };
      break;
    case 'demo': {
      const demo = pickDemoItem(bank);
      itemIds = demo ? [demo.id] : [];
      break;
    }
  }
  if (itemIds.length === 0) return { status: 'no-items' };
  const created = S.createSession({ key, mode: route.mode, itemIds, seed, boxes: p.boxes, focusId, dateKey: day, outcomes });
  session.value = created;
  return { status: 'ready', session: created };
}

/** Starts a session with explicit items (tests and custom flows). */
export function startCustomSession(input: Omit<S.CreateSessionInput, 'boxes'>): S.SessionState {
  const created = S.createSession({ ...input, boxes: progress.value.boxes });
  session.value = created;
  return created;
}

export function currentItem(state: S.SessionState | null = session.value): Item | undefined {
  if (!state) return undefined;
  const id = S.currentItemId(state);
  return id ? itemById.get(id) : undefined;
}

/** The 4 Name-step options for a flawed item (deterministic per session + item). */
export function optionsFor(state: S.SessionState, item: Item): string[] {
  return item.fallacyId ? buildOptions(bank.fallacies, item.fallacyId, state.seed, item.id) : [];
}

function settle(state: S.SessionState, item: Item, outcome: Outcome): void {
  const at = Date.now();
  const daily = state.mode === 'daily' && state.dateKey
    ? { key: state.dateKey, itemIds: state.itemIds, outcomes: state.outcomes }
    : undefined;
  const answered = S.recordAnswer(progress.value, item, outcome, { mode: state.mode, at, daily });
  // Completion must survive closing the final feedback without pressing Continue.
  // The answer state machine only settles each question once.
  const completed = state.mode !== 'demo' && state.outcomes.length === state.itemIds.length;
  commit(completed ? S.recordSession(answered, {
    mode: state.mode,
    at,
    total: state.itemIds.length,
    correct: sessionScore(state.outcomes),
  }) : answered);
}

export function spot(choice: SpotChoice): void {
  const state = session.value;
  const item = currentItem(state);
  if (!state || !item) return;
  const { state: next, outcome } = S.chooseSpot(state, item, choice);
  session.value = next;
  if (outcome) settle(next, item, outcome);
}

export function pickOption(fallacyId: string): void {
  const state = session.value;
  if (state) session.value = S.selectOption(state, fallacyId);
}

export function check(): void {
  const state = session.value;
  const item = currentItem(state);
  if (!state || !item) return;
  const { state: next, outcome } = S.checkAnswer(state, item);
  session.value = next;
  if (outcome) settle(next, item, outcome);
}

/** Builds the summary for a finished session. */
export function summarize(state: S.SessionState): SummaryData {
  const fallacyIds = state.itemIds
    .map((id) => itemById.get(id)?.fallacyId)
    .filter((id): id is string => typeof id === 'string');
  return {
    mode: state.mode,
    dateKey: state.dateKey,
    dailyNumber: state.dateKey ? dailyNumber(state.dateKey) : null,
    focusId: state.focusId,
    itemIds: state.itemIds,
    outcomes: state.outcomes,
    picks: state.picks,
    changes: masteryChanges(state.boxesAtStart, progress.value.boxes, fallacyIds),
  };
}

/**
 * "Continue". Returns 'next' while questions remain, or 'finished' after the
 * last one (the caller routes to the summary or back home).
 */
export function next(): 'next' | 'finished' | 'none' {
  const state = session.value;
  if (!state || state.phase !== 'feedback') return 'none';
  const advanced = S.advance(state);
  session.value = advanced;
  if (!advanced.finished) return 'next';
  if (advanced.mode === 'demo') {
    // The 1-question demo ends onboarding; it doesn't replace the last summary.
    markOnboarded();
    return 'finished';
  }
  summary.value = summarize(advanced);
  return 'finished';
}

/** Leaving mid-session: true when unsaved answers would be lost (non-daily). */
export function wouldLoseAnswers(state: S.SessionState | null = session.value): boolean {
  if (!state || state.finished || state.mode === 'daily' || state.mode === 'demo') return false;
  return state.outcomes.length > 0 || state.phase !== 'spot';
}

export function endSession(): void {
  session.value = null;
}

/** Discards cached quiz state when saved progress is replaced or reset. */
export function clearQuizSession(): void {
  session.value = null;
  summary.value = null;
}

/** Summary for today's (or another day's) finished Daily, rebuilt from progress. */
export function dailySummary(key: string): SummaryData | null {
  const record = progress.value.daily[key];
  if (!record || !record.done) return null;
  return {
    mode: 'daily',
    dateKey: key,
    dailyNumber: dailyNumber(key),
    focusId: null,
    itemIds: record.itemIds,
    outcomes: record.answers,
    picks: record.answers.map(() => null),
    changes: [],
  };
}

registerSessionInvalidator(clearQuizSession);
