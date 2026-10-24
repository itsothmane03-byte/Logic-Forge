// App chrome: desktop top bar, mobile header + bottom tab bar, footer.

import type { JSX } from 'preact';
import { APP_VERSION, REPO_URL } from '../../config';
import type { ThemeSetting } from '../../engine/types';
import type { Route } from '../../router';
import { progress, setTheme } from '../../state/store';
import { nextTheme } from '../theme';
import { cx } from '../util';
import { Icon, type IconName } from './Icon';
import { LogoMark } from './Logo';
import { shortcutsOpen } from './Overlays';

type Section = 'today' | 'practice' | 'library' | 'progress' | 'about';

function sectionOf(route: Route): Section | null {
  switch (route.name) {
    case 'setup':
      return 'practice';
    case 'today':
    case 'summary':
      return 'today';
    case 'welcome':
      // The introduction is Home: the logo marks it, no section does.
      return null;
    case 'play':
      return route.mode === 'practice' ? 'practice' : null;
    case 'practice':
    case 'repair':
    case 'logic':
      return 'practice';
    case 'library':
    case 'fallacy':
      return 'library';
    case 'progress':
      return 'progress';
    case 'about':
      return 'about';
  }
}

/** Home (#/, or the old #/welcome alias) is marked on the logo link. */
const homeCurrent = (route?: Route) => (route?.name === 'welcome' ? 'page' : undefined);

const LINKS: Array<{ id: Section; href: string; label: string; icon: IconName }> = [
  { id: 'today', href: '#/today', label: 'Today', icon: 'calendar' },
  { id: 'practice', href: '#/practice', label: 'Practice', icon: 'target' },
  { id: 'library', href: '#/library', label: 'Library', icon: 'book' },
  { id: 'progress', href: '#/progress', label: 'Progress', icon: 'chart' },
];

const THEME_LABEL: Record<ThemeSetting, string> = { system: 'System', light: 'Light', dark: 'Dark' };
const THEME_ICON: Record<ThemeSetting, IconName> = { system: 'monitor', light: 'sun', dark: 'moon' };

export function ThemeToggle(): JSX.Element {
  const theme = progress.value.settings.theme;
  const upcoming = nextTheme(theme);
  const label = `Theme: ${THEME_LABEL[theme]}. Switch to ${THEME_LABEL[upcoming]}`;
  return (
    <button type="button" class="icon-btn" aria-label={label} title={label} onClick={() => setTheme(upcoming)}>
      <Icon name={THEME_ICON[theme]} size={20} />
    </button>
  );
}

export function TopBar({ route }: { route: Route }): JSX.Element {
  const active = sectionOf(route);
  return (
    <header class="topbar">
      <div class="topbar__inner">
        <a class="topbar__brand" href="#/" aria-label="Fallacy Forge, Home" aria-current={homeCurrent(route)}>
          <LogoMark size={36} />
          <span class="topbar__wordmark" aria-hidden="true">
            Fallacy Forge
          </span>
        </a>
        <nav class="topbar__nav" aria-label="Primary">
          {[...LINKS, { id: 'about' as Section, href: '#/about', label: 'About', icon: 'info' as IconName }].map((link) => (
            <a
              key={link.id}
              href={link.href}
              class={cx('topbar__link', active === link.id && 'is-active')}
              aria-current={active === link.id ? 'page' : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div class="topbar__actions">
          <ThemeToggle />
          <button
            type="button"
            class="icon-btn icon-btn--glyph"
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
            onClick={() => (shortcutsOpen.value = true)}
          >
            <span aria-hidden="true">?</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export function MobileHeader({ route }: { route?: Route }): JSX.Element {
  return (
    <header class="mobile-header">
      <a class="mobile-header__brand" href="#/" aria-label="Fallacy Forge, Home" aria-current={homeCurrent(route)}>
        <LogoMark size={34} />
        <span class="mobile-header__name" aria-hidden="true">
          Fallacy Forge
        </span>
      </a>
      <div class="mobile-header__actions">
        <ThemeToggle />
        <a class="icon-btn" href="#/about" aria-label="About" title="About">
          <Icon name="info" size={20} />
        </a>
      </div>
    </header>
  );
}

export function TabBar({ route }: { route: Route }): JSX.Element {
  const active = sectionOf(route);
  return (
    <nav class="tabbar" aria-label="Primary">
      {LINKS.map((link) => (
        <a
          key={link.id}
          href={link.href}
          class={cx('tabbar__link', active === link.id && 'is-active')}
          aria-current={active === link.id ? 'page' : undefined}
        >
          <span class="tabbar__icon">
            <Icon name={link.icon} size={22} />
          </span>
          <span class="tabbar__label">{link.label}</span>
        </a>
      ))}
    </nav>
  );
}

export function AppFooter(): JSX.Element {
  return (
    <footer class="app-footer">
      <div class="app-footer__inner">
        <a href="#/">What is Fallacy Forge?</a>
        <a href="#/about">About</a>
        <a href={REPO_URL} rel="noopener">
          GitHub
        </a>
        <span>MIT license</span>
        <span>v{APP_VERSION}</span>
      </div>
    </footer>
  );
}
