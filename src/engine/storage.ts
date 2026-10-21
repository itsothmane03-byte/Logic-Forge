// Persistence in localStorage (`fallacyforge:v1`), with defensive parsing:
// corrupt or missing data falls back to defaults and never crashes the app.

import { isDateKey } from './dates';
import type {
  Attempt, Box, DailyRecord, Outcome, Progress, SessionRecord, Settings, Tally, ThemeSetting,
} from './types';

export const STORAGE_KEY = 'fallacyforge:v1';
export const MAX_ATTEMPTS = 500;
export const MAX_SESSIONS = 60;

const OUTCOMES: readonly Outcome[] = ['correct', 'partial', 'wrong'];
const THEMES: readonly ThemeSetting[] = ['system', 'light', 'dark'];
const FALLACY_KEY = /^fal_[a-z0-9_]+$/;
const REQUIRED_KEYS = [
  'version', 'settings', 'onboarded', 'boxes', 'stats', 'soundStats',
  'attempts', 'days', 'daily', 'sessions', 'bestStreak',
] as const;

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function defaultProgress(): Progress {
  return {
    version: 1,
    settings: { theme: 'system', showDefinitions: true },
    onboarded: false,
    boxes: {},
    stats: {},
    soundStats: { seen: 0, correct: 0 },
    attempts: [],
    days: {},
    daily: {},
    sessions: [],
    bestStreak: 0,
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;
const isOutcome = (v: unknown): v is Outcome => typeof v === 'string' && (OUTCOMES as readonly string[]).includes(v);

function cleanSettings(raw: unknown): Settings {
  const fallback = defaultProgress().settings;
  if (!isRecord(raw)) return fallback;
  const theme = typeof raw.theme === 'string' && (THEMES as readonly string[]).includes(raw.theme)
    ? (raw.theme as ThemeSetting)
    : fallback.theme;
  const showDefinitions = typeof raw.showDefinitions === 'boolean' ? raw.showDefinitions : fallback.showDefinitions;
  return { theme, showDefinitions };
}

function cleanTally(raw: unknown): Tally | null {
  if (!isRecord(raw) || !isCount(raw.seen) || !isCount(raw.correct)) return null;
  return { seen: raw.seen, correct: Math.min(raw.correct, raw.seen) };
}

function cleanBoxes(raw: unknown): Record<string, Box> {
  const out: Record<string, Box> = {};
  if (!isRecord(raw)) return out;
  for (const [key, value] of Object.entries(raw)) {
    if (FALLACY_KEY.test(key) && typeof value === 'number' && [1, 2, 3, 4, 5].includes(value)) out[key] = value as Box;
  }
  return out;
}

function cleanStats(raw: unknown): Record<string, Tally> {
  const out: Record<string, Tally> = {};
  if (!isRecord(raw)) return out;
  for (const [key, value] of Object.entries(raw)) {
    const tally = cleanTally(value);
    if (FALLACY_KEY.test(key) && tally) out[key] = tally;
  }
  return out;
}

function cleanAttempts(raw: unknown): Attempt[] {
  if (!Array.isArray(raw)) return [];
  const out: Attempt[] = [];
  for (const a of raw) {
    if (isRecord(a) && typeof a.itemId === 'string' && isOutcome(a.outcome)
      && typeof a.at === 'number' && Number.isFinite(a.at) && typeof a.mode === 'string') {
      out.push({ itemId: a.itemId, outcome: a.outcome, at: a.at, mode: a.mode });
    }
  }
  return out.slice(-MAX_ATTEMPTS);
}

function cleanDays(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!isRecord(raw)) return out;
  for (const [key, value] of Object.entries(raw)) {
    if (isDateKey(key) && isCount(value) && value > 0) out[key] = value;
  }
  return out;
}

function cleanDaily(raw: unknown): Record<string, DailyRecord> {
  const out: Record<string, DailyRecord> = {};
  if (!isRecord(raw)) return out;
  for (const [key, value] of Object.entries(raw)) {
    if (!isDateKey(key) || !isRecord(value)) continue;
    const { itemIds, answers, done } = value;
    if (!Array.isArray(itemIds) || !itemIds.every((id) => typeof id === 'string')) continue;
    if (!Array.isArray(answers) || !answers.every(isOutcome) || answers.length > itemIds.length) continue;
    if (typeof done !== 'boolean') continue;
    out[key] = { itemIds: [...itemIds] as string[], answers: [...answers] as Outcome[], done };
  }
  return out;
}

function cleanSessions(raw: unknown): SessionRecord[] {
  if (!Array.isArray(raw)) return [];
  const out: SessionRecord[] = [];
  for (const s of raw) {
    if (isRecord(s) && typeof s.mode === 'string' && typeof s.at === 'number' && Number.isFinite(s.at)
      && isCount(s.total) && isCount(s.correct) && s.correct <= s.total) {
      out.push({ mode: s.mode, at: s.at, total: s.total, correct: s.correct });
    }
  }
  return out.slice(-MAX_SESSIONS);
}

/**
 * Coerces untrusted data into a valid Progress. Returns null when the data is
 * not a version-1 progress object at all; otherwise drops invalid entries.
 */
export function sanitizeProgress(raw: unknown): Progress | null {
  if (!isRecord(raw) || raw.version !== 1) return null;
  return {
    version: 1,
    settings: cleanSettings(raw.settings),
    onboarded: typeof raw.onboarded === 'boolean' ? raw.onboarded : false,
    boxes: cleanBoxes(raw.boxes),
    stats: cleanStats(raw.stats),
    soundStats: cleanTally(raw.soundStats) ?? { seen: 0, correct: 0 },
    attempts: cleanAttempts(raw.attempts),
    days: cleanDays(raw.days),
    daily: cleanDaily(raw.daily),
    sessions: cleanSessions(raw.sessions),
    bestStreak: isCount(raw.bestStreak) ? raw.bestStreak : 0,
  };
}

/** Reads progress; any missing, unreadable or corrupt data yields defaults. */
export function loadProgress(storage: Pick<Storage, 'getItem'> | null | undefined): Progress {
  try {
    const text = storage?.getItem(STORAGE_KEY);
    if (!text) return defaultProgress();
    return sanitizeProgress(JSON.parse(text)) ?? defaultProgress();
  } catch {
    return defaultProgress();
  }
}

/** Writes progress. Returns false (without throwing) when storage is unavailable or full. */
export function saveProgress(storage: StorageLike | null | undefined, progress: Progress): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

/** Caps the unbounded lists before saving. */
export function trimProgress(progress: Progress): Progress {
  return {
    ...progress,
    attempts: progress.attempts.slice(-MAX_ATTEMPTS),
    sessions: progress.sessions.slice(-MAX_SESSIONS),
  };
}

/** Pretty JSON for the "Export" download. */
export function serializeExport(progress: Progress): string {
  return `${JSON.stringify(progress, null, 2)}\n`;
}

export type ImportResult = { ok: true; progress: Progress } | { ok: false; error: string };

/** Validates an imported file's shape and version before it replaces anything. */
export function parseImport(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  if (!isRecord(raw)) return { ok: false, error: "That file isn't a Fallacy Forge export." };
  if (raw.version !== 1) {
    return { ok: false, error: `Unsupported export version (${String(raw.version ?? 'missing')}). Expected version 1.` };
  }
  const missing = REQUIRED_KEYS.filter((key) => !(key in raw));
  if (missing.length) return { ok: false, error: `That export is missing: ${missing.join(', ')}.` };
  const shapes: Array<[string, boolean]> = [
    ['settings', isRecord(raw.settings)],
    ['onboarded', typeof raw.onboarded === 'boolean'],
    ['boxes', isRecord(raw.boxes)],
    ['stats', isRecord(raw.stats)],
    ['soundStats', cleanTally(raw.soundStats) !== null],
    ['attempts', Array.isArray(raw.attempts)],
    ['days', isRecord(raw.days)],
    ['daily', isRecord(raw.daily)],
    ['sessions', Array.isArray(raw.sessions)],
    ['bestStreak', isCount(raw.bestStreak)],
  ];
  const wrong = shapes.filter(([, ok]) => !ok).map(([key]) => key);
  if (wrong.length) return { ok: false, error: `That export has invalid fields: ${wrong.join(', ')}.` };
  const progress = sanitizeProgress(raw);
  return progress ? { ok: true, progress } : { ok: false, error: "That file isn't a Fallacy Forge export." };
}
