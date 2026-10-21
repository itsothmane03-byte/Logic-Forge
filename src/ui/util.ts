// Small UI helpers: class names, formatting, labels.

import type { Format, Level } from '../engine/types';
import type { IconName } from './components/Icon';

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** "6h 12m", "12m", "under a minute". */
export function countdown(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 1) return 'under a minute';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function longDate(now: Date = new Date()): string {
  return now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export const FORMAT_LABELS: Readonly<Record<Format, string>> = {
  post: 'Social post',
  email: 'Email',
  chat: 'Group chat',
  headline: 'Headline',
  ad: 'Ad',
  review: 'Review',
  speech: 'Speech',
  quote: 'Overheard',
};

export const FORMAT_ICONS: Readonly<Record<Format, IconName>> = {
  post: 'at',
  email: 'mail',
  chat: 'chat',
  headline: 'news',
  ad: 'megaphone',
  review: 'star',
  speech: 'mic',
  quote: 'quote',
};

export const LEVEL_LABELS: Readonly<Record<Level, string>> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

/** Initials for avatars: "Jordan Lee" -> "JL". */
export function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const first = words[0]?.[0] ?? '?';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** Stable 0-359 hue from a string (avatar colors). */
export function hueFrom(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
  return h;
}

/** Stable small integer from a string, in [min, max]. */
export function numberFrom(text: string, min: number, max: number): number {
  let h = 7;
  for (let i = 0; i < text.length; i++) h = (h * 33 + text.charCodeAt(i)) >>> 0;
  return min + (h % (max - min + 1));
}

/** Accent-insensitive, case-insensitive normalization for search. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9≠]+/g, ' ')
    .trim();
}

/** Splits "Jordan Lee · @jordanlifts" into name and handle. */
export function splitSource(source: string): { name: string; detail: string | null } {
  const index = source.indexOf(' · ');
  if (index === -1) return { name: source, detail: null };
  return { name: source.slice(0, index), detail: source.slice(index + 3) };
}
