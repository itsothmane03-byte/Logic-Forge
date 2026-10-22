import { signal } from '@preact/signals';
import { logicItems } from '../data/logic';
import { logicVerdict, selectLogic, type LogicItem, type LogicVerdict } from '../engine/logic';
import { MAX_ACTIVITY_RECENT } from '../engine/storage';
import { registerSessionInvalidator } from './lifecycle';
import { progress, updateProgress } from './store';

export interface LogicAnswer {
  itemId: string;
  selected: LogicVerdict;
  correct: boolean;
}

export interface LogicSession {
  items: LogicItem[];
  index: number;
  selected: LogicVerdict | null;
  checked: boolean;
  finished: boolean;
  answers: LogicAnswer[];
}

export const logicSession = signal<LogicSession | null>(null);

export function startLogic(seed = `${Date.now()}:${Math.random()}`): void {
  logicSession.value = {
    items: selectLogic(logicItems, progress.peek().logic.recent, seed),
    index: 0, selected: null, checked: false, finished: false, answers: [],
  };
}

export function clearLogicSession(): void {
  logicSession.value = null;
}

registerSessionInvalidator(clearLogicSession);

export function selectLogicVerdict(selected: LogicVerdict): void {
  const state = logicSession.peek();
  if (!state || state.checked || state.finished || !['must', 'cannot', 'possible'].includes(selected)) return;
  logicSession.value = { ...state, selected };
}

export function checkLogic(): void {
  const state = logicSession.peek();
  if (!state || state.checked || state.finished || !state.selected) return;
  const item = state.items[state.index];
  if (!item) return;
  const correct = state.selected === logicVerdict(item);
  logicSession.value = { ...state, checked: true, answers: [...state.answers, { itemId: item.id, selected: state.selected, correct }] };
  updateProgress((p) => ({ ...p, logic: {
    recent: [...p.logic.recent, item.id].slice(-MAX_ACTIVITY_RECENT),
    answered: p.logic.answered + 1,
    correct: p.logic.correct + Number(correct),
    sets: p.logic.sets + Number(state.index === state.items.length - 1),
  } }));
}

export function nextLogic(): void {
  const state = logicSession.peek();
  if (!state?.checked || state.finished) return;
  logicSession.value = state.index === state.items.length - 1
    ? { ...state, finished: true }
    : { ...state, index: state.index + 1, selected: null, checked: false };
}

export function retryLogicMisses(): void {
  const previous = logicSession.peek();
  if (!previous?.finished) return;
  const missed = new Set(previous.answers.filter((answer) => !answer.correct).map((answer) => answer.itemId));
  const items = previous.items.filter((item) => missed.has(item.id));
  if (items.length === 0) return;
  logicSession.value = { items, index: 0, selected: null, checked: false, finished: false, answers: [] };
}
