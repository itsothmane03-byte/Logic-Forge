// A repair set stays available while navigating the app; checked answers save immediately.

import { signal } from '@preact/signals';
import { repairs } from '../data/repairs';
import { selectRepairs, type RepairItem } from '../engine/repair';
import { MAX_REPAIR_RECENT } from '../engine/storage';
import { progress, updateProgress } from './store';
import { registerSessionInvalidator } from './lifecycle';

export interface RepairAnswer {
  itemId: string;
  optionId: string;
  correct: boolean;
}

export interface RepairSession {
  seed: string;
  items: RepairItem[];
  index: number;
  selected: string | null;
  checked: boolean;
  finished: boolean;
  answers: RepairAnswer[];
}

export const repairSession = signal<RepairSession | null>(null);

export function startRepair(seed = `${Date.now()}:${Math.random()}`): void {
  repairSession.value = {
    seed,
    items: selectRepairs(repairs, progress.peek().repair.recent, seed),
    index: 0, selected: null, checked: false, finished: false, answers: [],
  };
}

export function clearRepairSession(): void {
  repairSession.value = null;
}

registerSessionInvalidator(clearRepairSession);

export function retryRepairMisses(): void {
  const previous = repairSession.peek();
  if (!previous?.finished) return;
  const missed = new Set(previous.answers.filter((answer) => !answer.correct).map((answer) => answer.itemId));
  const items = previous.items.filter((item) => missed.has(item.id));
  if (items.length === 0) return;
  repairSession.value = {
    seed: `${Date.now()}:${Math.random()}`, items,
    index: 0, selected: null, checked: false, finished: false, answers: [],
  };
}

export function selectRepairOption(id: string): void {
  const state = repairSession.peek();
  if (!state || state.checked || state.finished || !state.items[state.index]?.options.some((option) => option.id === id)) return;
  repairSession.value = { ...state, selected: id };
}

export function checkRepair(): void {
  const state = repairSession.peek();
  if (!state || state.checked || state.finished) return;
  const item = state.items[state.index];
  const option = item?.options.find((candidate) => candidate.id === state.selected);
  if (!item || !option) return;
  // Lock the answer before notifying progress subscribers, so it can only count once.
  repairSession.value = {
    ...state, checked: true,
    answers: [...state.answers, { itemId: item.id, optionId: option.id, correct: option.correct }],
  };
  updateProgress((p) => ({
    ...p,
    repair: {
      recent: [...p.repair.recent, item.id].slice(-MAX_REPAIR_RECENT),
      answered: p.repair.answered + 1,
      correct: p.repair.correct + (option.correct ? 1 : 0),
      sets: p.repair.sets + (state.index === state.items.length - 1 ? 1 : 0),
    },
  }));
}

export function nextRepair(): void {
  const state = repairSession.peek();
  if (!state || !state.checked || state.finished) return;
  repairSession.value = state.index === state.items.length - 1
    ? { ...state, finished: true }
    : { ...state, index: state.index + 1, selected: null, checked: false };
}
