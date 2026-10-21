// Pure session state machine (Spot -> Name -> Feedback -> next) and the
// progress update applied after every answer.

import { dateKey } from './dates';
import { applyOutcome } from './mastery';
import { needsName, scoreAnswer } from './score';
import { bestStreak } from './streak';
import { MAX_ATTEMPTS, MAX_SESSIONS } from './storage';
import type { Box, Item, Mode, Outcome, Progress, SessionRecord, SpotChoice } from './types';

export type Phase = 'spot' | 'name' | 'feedback';

export interface AnswerPick {
  spot: SpotChoice;
  named: string | null;
}

export interface SessionState {
  /** Route key, e.g. `daily:2026-10-20`, `practice`, `focus:fal_straw_man`. */
  key: string;
  mode: Mode;
  focusId: string | null;
  dateKey: string | null;
  seed: string;
  itemIds: string[];
  outcomes: Outcome[];
  picks: Array<AnswerPick | null>;
  index: number;
  phase: Phase;
  spot: SpotChoice | null;
  selected: string | null;
  boxesAtStart: Record<string, Box>;
  finished: boolean;
}

export interface CreateSessionInput {
  key: string;
  mode: Mode;
  itemIds: string[];
  seed: string;
  boxes: Record<string, Box>;
  focusId?: string | null;
  dateKey?: string | null;
  /** Previously saved answers (Daily resume). */
  outcomes?: Outcome[];
}

export function createSession(input: CreateSessionInput): SessionState {
  const outcomes = (input.outcomes ?? []).slice(0, input.itemIds.length);
  return {
    key: input.key,
    mode: input.mode,
    focusId: input.focusId ?? null,
    dateKey: input.dateKey ?? null,
    seed: input.seed,
    itemIds: input.itemIds.slice(),
    outcomes,
    picks: outcomes.map(() => null),
    index: outcomes.length,
    phase: 'spot',
    spot: null,
    selected: null,
    boxesAtStart: { ...input.boxes },
    finished: input.itemIds.length > 0 && outcomes.length >= input.itemIds.length,
  };
}

export function currentItemId(state: SessionState): string | undefined {
  return state.itemIds[state.index];
}

export interface Transition {
  state: SessionState;
  /** Set when this step decided the question's outcome. */
  outcome: Outcome | null;
}

function settle(state: SessionState, outcome: Outcome, pick: AnswerPick): SessionState {
  return {
    ...state,
    phase: 'feedback',
    outcomes: [...state.outcomes, outcome],
    picks: [...state.picks, pick],
  };
}

/** Spot step. Sound picks and flawed-on-sound picks settle immediately. */
export function chooseSpot(state: SessionState, item: Item, choice: SpotChoice): Transition {
  if (state.phase !== 'spot' || state.finished) return { state, outcome: null };
  if (needsName(item, choice)) {
    return { state: { ...state, phase: 'name', spot: choice, selected: null }, outcome: null };
  }
  const outcome = scoreAnswer(item, choice);
  return { state: settle({ ...state, spot: choice }, outcome, { spot: choice, named: null }), outcome };
}

export function selectOption(state: SessionState, fallacyId: string): SessionState {
  if (state.phase !== 'name') return state;
  return { ...state, selected: fallacyId };
}

/** Name step "Check". */
export function checkAnswer(state: SessionState, item: Item): Transition {
  if (state.phase !== 'name' || state.selected === null) return { state, outcome: null };
  const outcome = scoreAnswer(item, 'flawed', state.selected);
  return { state: settle(state, outcome, { spot: 'flawed', named: state.selected }), outcome };
}

/** "Continue": next question, or finished after the last one. */
export function advance(state: SessionState): SessionState {
  if (state.phase !== 'feedback') return state;
  const index = state.index + 1;
  return {
    ...state,
    index,
    phase: 'spot',
    spot: null,
    selected: null,
    finished: index >= state.itemIds.length,
  };
}

export interface AnswerContext {
  mode: Mode;
  at: number;
  /** For Daily: the date key, the day's item ids and all outcomes so far (including this one). */
  daily?: { key: string; itemIds: string[]; outcomes: Outcome[] };
}

/** Applies one answer to progress: mastery, stats, attempts, days, daily resume and best streak. */
export function recordAnswer(progress: Progress, item: Item, outcome: Outcome, ctx: AnswerContext): Progress {
  const mastery = applyOutcome(progress, item, outcome);
  const day = dateKey(ctx.at);
  const days = { ...progress.days, [day]: (progress.days[day] ?? 0) + 1 };
  const attempts = [...progress.attempts, { itemId: item.id, outcome, at: ctx.at, mode: ctx.mode }].slice(-MAX_ATTEMPTS);
  const daily = ctx.daily
    ? {
        ...progress.daily,
        [ctx.daily.key]: {
          itemIds: ctx.daily.itemIds.slice(),
          answers: ctx.daily.outcomes.slice(),
          done: ctx.daily.outcomes.length >= ctx.daily.itemIds.length,
        },
      }
    : progress.daily;
  return {
    ...progress,
    boxes: { ...mastery.boxes },
    stats: { ...mastery.stats },
    soundStats: mastery.soundStats,
    attempts,
    days,
    daily,
    bestStreak: bestStreak(progress.bestStreak, days, day),
  };
}

/** Appends a finished session to the history (last 60 kept). */
export function recordSession(progress: Progress, record: SessionRecord): Progress {
  return { ...progress, sessions: [...progress.sessions, record].slice(-MAX_SESSIONS) };
}
