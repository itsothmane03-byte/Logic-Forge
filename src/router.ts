// Tiny hash router (GitHub Pages friendly).
//   #/ (home)  #/welcome (home alias)  #/today  #/play/daily|practice|review|demo  #/play/focus/:id
//   #/practice  #/repair  #/summary  #/library  #/library/:id  #/progress  #/about
// Unknown routes go to the home page.

import { signal } from '@preact/signals';

export type PlayMode = 'daily' | 'practice' | 'review' | 'demo';

export type Route =
  | { name: 'today' }
  | { name: 'welcome' }
  | { name: 'setup' }
  | { name: 'practice' }
  | { name: 'repair' }
  | { name: 'logic' }
  | { name: 'play'; mode: PlayMode }
  | { name: 'play'; mode: 'focus'; fallacyId: string }
  | { name: 'summary' }
  | { name: 'library' }
  | { name: 'fallacy'; fallacyId: string }
  | { name: 'progress' }
  | { name: 'about' };

export type PlayRoute = Extract<Route, { name: 'play' }>;

const PLAY_MODES: readonly string[] = ['daily', 'practice', 'review', 'demo'];
const ID = /^[a-z0-9_]+$/;

/** Parses a location hash. Returns null for unknown routes. */
export function matchHash(hash: string): Route | null {
  const path = hash.replace(/^#/, '').replace(/^\/+/, '').replace(/\/+$/, '');
  let parts: string[];
  try {
    parts = path === '' ? [] : path.split('/').map((p) => decodeURIComponent(p));
  } catch {
    // A malformed shared URL should fall back like any other unknown route.
    return null;
  }
  const [head, a, b] = parts;
  if (parts.length === 0) return { name: 'welcome' };
  if (parts.length === 1) {
    if (head === 'welcome') return { name: 'welcome' };
    if (head === 'today') return { name: 'today' };
    if (head === 'setup') return { name: 'setup' };
    if (head === 'practice') return { name: 'practice' };
    if (head === 'repair') return { name: 'repair' };
    if (head === 'logic') return { name: 'logic' };
    if (head === 'summary') return { name: 'summary' };
    if (head === 'library') return { name: 'library' };
    if (head === 'progress') return { name: 'progress' };
    if (head === 'about') return { name: 'about' };
    return null;
  }
  if (head === 'play' && parts.length === 2 && a && PLAY_MODES.includes(a)) return { name: 'play', mode: a as PlayMode };
  if (head === 'play' && parts.length === 3 && a === 'focus' && b && ID.test(b)) {
    return { name: 'play', mode: 'focus', fallacyId: b };
  }
  if (head === 'library' && parts.length === 2 && a && ID.test(a)) return { name: 'fallacy', fallacyId: a };
  return null;
}

export function parseHash(hash: string): Route {
  return matchHash(hash) ?? { name: 'welcome' };
}

export function hrefFor(route: Route): string {
  switch (route.name) {
    case 'today': return '#/today';
    case 'welcome': return '#/';
    case 'setup': return '#/setup';
    case 'practice': return '#/practice';
    case 'repair': return '#/repair';
    case 'logic': return '#/logic';
    case 'play': return route.mode === 'focus' ? `#/play/focus/${route.fallacyId}` : `#/play/${route.mode}`;
    case 'summary': return '#/summary';
    case 'library': return '#/library';
    case 'fallacy': return `#/library/${route.fallacyId}`;
    case 'progress': return '#/progress';
    case 'about': return '#/about';
  }
}

const initialHash = typeof location !== 'undefined' ? location.hash : '';

/** The current route. A new object on every navigation (used as a visit identity). */
export const route = signal<Route>(parseHash(initialHash));

function sync(): void {
  const matched = matchHash(location.hash);
  if (!matched) history.replaceState(null, '', '#/');
  route.value = matched ?? { name: 'welcome' };
}

/** Starts listening to hash changes and normalizes unknown routes. */
export function startRouter(): () => void {
  sync();
  window.addEventListener('hashchange', sync);
  return () => window.removeEventListener('hashchange', sync);
}

/** Pushes a history entry. Re-navigating to the current hash refreshes the route. */
export function navigate(hash: string): void {
  if (location.hash === hash || (hash === '#/' && location.hash === '')) {
    route.value = parseHash(hash);
    return;
  }
  location.hash = hash;
}

/** Replaces the current history entry (no back-stack entry). */
export function replaceRoute(hash: string): void {
  history.replaceState(null, '', hash);
  route.value = parseHash(hash);
}
