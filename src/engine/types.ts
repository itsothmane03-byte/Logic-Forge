// Shared domain types. The bank shape mirrors scripts/build-bank.mjs output.

export type FamilyId = 'distraction' | 'emotion' | 'appeals' | 'evidence' | 'framing' | 'language';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Format = 'post' | 'email' | 'chat' | 'headline' | 'ad' | 'review' | 'speech' | 'quote';
export type Outcome = 'correct' | 'partial' | 'wrong';
export type Box = 1 | 2 | 3 | 4 | 5;
export type Difficulty = 1 | 2 | 3;

export interface Fallacy {
  id: string;
  name: string;
  aliases: string[];
  family: FamilyId;
  difficulty: Level;
  shortDef: string;
  definition: string;
  howToSpot: string[];
  classicExample: string;
  legitimateVersion: string;
  confusableWith: string[];
  contrast: Record<string, string>;
}

export interface Item {
  id: string;
  fallacyId: string | null;
  isSound: boolean;
  resembles: string | null;
  difficulty: Difficulty;
  format: Format;
  source: string;
  title: string | null;
  passage: string;
  cue: string;
  explanation: string;
  whyNot: Record<string, string>;
  tags: string[];
}

export interface Family {
  id: FamilyId;
  label: string;
  order: number;
}

export interface Bank {
  version: string;
  fallacies: Fallacy[];
  items: Item[];
  families: Family[];
}

export type Mode = 'daily' | 'practice' | 'focus' | 'review' | 'demo';
export type ThemeSetting = 'system' | 'light' | 'dark';

export interface Settings {
  theme: ThemeSetting;
  showDefinitions: boolean;
}

export interface Tally {
  seen: number;
  correct: number;
}

export interface Attempt {
  itemId: string;
  outcome: Outcome;
  at: number;
  mode: string;
}

export interface DailyRecord {
  itemIds: string[];
  answers: Outcome[];
  done: boolean;
}

export interface SessionRecord {
  mode: string;
  at: number;
  total: number;
  correct: number;
}

/** Persisted progress (localStorage key `fallacyforge:v1`). */
export interface Progress {
  version: 1;
  settings: Settings;
  onboarded: boolean;
  boxes: Record<string, Box>;
  stats: Record<string, Tally>;
  soundStats: Tally;
  attempts: Attempt[];
  days: Record<string, number>;
  daily: Record<string, DailyRecord>;
  sessions: SessionRecord[];
  bestStreak: number;
}

export type SpotChoice = 'sound' | 'flawed';
