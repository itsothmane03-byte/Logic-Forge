// App state (signals): the question bank, persisted progress, toasts.

import { batch, signal } from '@preact/signals';
import { invalidateSessionCaches } from './lifecycle';
import { INTERESTS, type InterestId } from '../engine/interests';
import bankJson from '../data/bank.json';
import { defaultProgress, loadProgress, saveProgress, STORAGE_KEY } from '../engine/storage';
import type { Bank, Family, Fallacy, Item, Progress, ThemeSetting } from '../engine/types';

export const bank = bankJson as unknown as Bank;
export const itemById: ReadonlyMap<string, Item> = new Map(bank.items.map((i) => [i.id, i]));
export const fallacyById: ReadonlyMap<string, Fallacy> = new Map(bank.fallacies.map((f) => [f.id, f]));
export const familyById: ReadonlyMap<string, Family> = new Map(bank.families.map((f) => [f.id, f]));
export const bankItemIds: ReadonlySet<string> = new Set(itemById.keys());

/** Display name for any canonical id, even one missing from a partial dev bank. */
export function fallacyName(id: string): string {
  const known = fallacyById.get(id);
  if (known) return known.name;
  return id
    .replace(/^fal_/, '')
    .split('_')
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export const progress = signal<Progress>(loadProgress(storage()));
/** False after a failed save (private mode, quota). Shown as a quiet notice. */
export const storageOk = signal(true);

export function commit(next: Progress): void {
  progress.value = next;
  storageOk.value = saveProgress(storage(), next);
}

export function updateProgress(fn: (p: Progress) => Progress): void {
  commit(fn(progress.value));
}

/** Replace a save and its transient sessions together (reset and import). */
export function replaceProgress(next: Progress): void {
  batch(() => {
    commit(next);
    invalidateSessionCaches();
  });
}

export function setTheme(theme: ThemeSetting): void {
  updateProgress((p) => ({ ...p, settings: { ...p.settings, theme } }));
}

export function setShowDefinitions(showDefinitions: boolean): void {
  updateProgress((p) => ({ ...p, settings: { ...p.settings, showDefinitions } }));
}

/** Topic preferences apply when a new set starts; never discard a live draft. */
export function setInterests(interests: readonly InterestId[]): void {
  const selected = INTERESTS.map((interest) => interest.id).filter((id) => interests.includes(id));
  updateProgress((p) => ({ ...p, settings: { ...p.settings, interests: selected } }));
}

export function markOnboarded(): void {
  if (!progress.value.onboarded) updateProgress((p) => ({ ...p, onboarded: true }));
}

/** Clears all progress but keeps display settings. */
export function resetProgress(): void {
  replaceProgress({ ...defaultProgress(), settings: progress.value.settings, onboarded: true });
}

function learningSnapshot(p: Progress): string {
  return JSON.stringify([p.boxes, p.stats, p.soundStats, p.attempts, p.days, p.daily, p.sessions, p.bestStreak, p.repair, p.logic]);
}

/** Keeps several open tabs in sync. */
export function watchOtherTabs(): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    const next = loadProgress(storage());
    const changed = learningSnapshot(progress.peek()) !== learningSnapshot(next);
    batch(() => {
      progress.value = next;
      if (changed) invalidateSessionCaches();
    });
    if (changed) showToast('Progress updated in another tab.');
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

export interface ToastMessage {
  id: number;
  text: string;
}

export const toast = signal<ToastMessage | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let toastId = 0;

export function showToast(text: string, ms = 2800): void {
  toastId += 1;
  toast.value = { id: toastId, text };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value = null;
  }, ms);
}

/** True once the Welcome page has been shown in this page session. */
export const welcomeShown = signal(false);
