// Theme: 'system' follows prefers-color-scheme (pure CSS); 'light' / 'dark'
// set [data-theme] on <html>. index.html applies the saved theme before paint.

import type { ThemeSetting } from '../engine/types';

const META_COLORS = { light: '#FAF8F4', dark: '#0F1012' } as const;

function prefersDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveTheme(setting: ThemeSetting): 'light' | 'dark' {
  if (setting === 'system') return prefersDark() ? 'dark' : 'light';
  return setting;
}

export function applyTheme(setting: ThemeSetting): void {
  const root = document.documentElement;
  if (setting === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', setting);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', META_COLORS[resolveTheme(setting)]);
}

/** Re-applies on OS theme changes while the setting is 'system'. */
export function watchSystemTheme(getSetting: () => ThemeSetting): () => void {
  if (typeof matchMedia !== 'function') return () => undefined;
  const query = matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => applyTheme(getSetting());
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

export const THEME_ORDER: readonly ThemeSetting[] = ['system', 'light', 'dark'];

export function nextTheme(current: ThemeSetting): ThemeSetting {
  const index = THEME_ORDER.indexOf(current);
  return THEME_ORDER[(index + 1) % THEME_ORDER.length] ?? 'system';
}
