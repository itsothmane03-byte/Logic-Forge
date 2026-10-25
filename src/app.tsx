// App shell: skip link, landmarks, chrome, routed screen, toast, shortcuts.

import type { JSX } from 'preact';
import { useEffect } from 'preact/hooks';
import { navigate, route, type Route } from './router';
import { session, sessionKey } from './state/session';
import { fallacyById } from './state/store';
import { AppFooter, MobileHeader, TabBar, TopBar } from './ui/components/Nav';
import { ShortcutsDialog, shortcutsOpen, Toast } from './ui/components/Overlays';
import { isShortcutEvent, useKeydown } from './ui/hooks';
import { AboutScreen } from './ui/screens/About';
import { FallacyDetailScreen } from './ui/screens/FallacyDetail';
import { LibraryScreen } from './ui/screens/Library';
import { ProgressScreen } from './ui/screens/Progress';
import { SessionScreen, sessionTitle } from './ui/screens/Session';
import { SummaryScreen } from './ui/screens/Summary';
import { TodayScreen } from './ui/screens/Today';
import { WelcomeScreen } from './ui/screens/Welcome';
import { PracticeScreen } from './ui/screens/Practice';
import { RepairScreen } from './ui/screens/Repair';
import { LogicScreen } from './ui/screens/Logic';
import { dataEpoch } from './state/lifecycle';
import { cx } from './ui/util';
import { dateKey } from './engine/dates';
import { SetupScreen } from './ui/screens/Setup';

const SUFFIX = 'Fallacy Forge';

function titleFor(r: Route): string {
  switch (r.name) {
    case 'setup':
      return `Practice preferences · ${SUFFIX}`;
    case 'today':
      return `Daily Forge · ${SUFFIX}`;
    case 'welcome':
      return `Reasoning practice · ${SUFFIX}`;
    case 'practice':
      return `Practice · ${SUFFIX}`;
    case 'repair':
      return `Fix the argument · ${SUFFIX}`;
    case 'logic':
      return `What follows? · ${SUFFIX}`;
    case 'play':
      return `${sessionTitle(session.peek(), r)} · ${SUFFIX}`;
    case 'summary':
      return `Summary · ${SUFFIX}`;
    case 'library':
      return `Library · ${SUFFIX}`;
    case 'fallacy':
      return `${fallacyById.get(r.fallacyId)?.name ?? 'Fallacy'} · ${SUFFIX}`;
    case 'progress':
      return `Progress · ${SUFFIX}`;
    case 'about':
      return `About · ${SUFFIX}`;
  }
}

/** Same-hash link clicks don't fire hashchange; refresh the route instead. */
function useSameHashLinks(): void {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href^="#/"]') : null;
      const href = link?.getAttribute('href');
      if (!href) return;
      const current = location.hash || '#/';
      if (href === current) {
        event.preventDefault();
        navigate(href);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
}

export function App(): JSX.Element {
  const r = route.value;
  const epoch = dataEpoch.value;
  // The introduction is home; practice preferences remain optional.
  const showWelcome = r.name === 'welcome';
  const showSetup = r.name === 'setup';
  const inSession = r.name === 'play' || r.name === 'repair' || r.name === 'logic';
  const focused = inSession;
  const playKey = r.name === 'play' ? sessionKey(r, dateKey()) : '';
  const key = `${showSetup ? 'setup' : showWelcome ? 'welcome' : r.name === 'play' ? `play:${playKey}` : r.name === 'fallacy' ? `fallacy:${r.fallacyId}` : r.name}:${epoch}`;

  useSameHashLinks();

  useEffect(() => {
    document.title = titleFor(r);
    window.scrollTo(0, 0);
    const heading = document.querySelector<HTMLElement>('#main h1');
    if (heading) {
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }, [r, epoch]);

  useKeydown((event) => {
    if (event.key === '?' && isShortcutEvent(event)) {
      event.preventDefault();
      shortcutsOpen.value = true;
    }
  });

  let screen: JSX.Element;
  if (showSetup) screen = <SetupScreen />;
  else if (showWelcome) screen = <WelcomeScreen />;
  else {
    switch (r.name) {
      case 'practice':
        screen = <PracticeScreen />;
        break;
      case 'repair':
        screen = <RepairScreen />;
        break;
      case 'logic':
        screen = <LogicScreen />;
        break;
      case 'play':
        screen = <SessionScreen key={playKey} route={r} />;
        break;
      case 'summary':
        screen = <SummaryScreen />;
        break;
      case 'library':
        screen = <LibraryScreen />;
        break;
      case 'fallacy':
        screen = <FallacyDetailScreen key={r.fallacyId} id={r.fallacyId} />;
        break;
      case 'progress':
        screen = <ProgressScreen />;
        break;
      case 'about':
        screen = <AboutScreen />;
        break;
      default:
        screen = <TodayScreen />;
    }
  }

  return (
    <div class={cx('app', !focused && 'app--tabs')}>
      <a
        class="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          const main = document.getElementById('main');
          const target = main?.querySelector<HTMLElement>('h1') ?? main;
          target?.focus();
        }}
      >
        Skip to content
      </a>
      {!focused && <TopBar route={r} />}
      {!focused && <MobileHeader route={r} />}
      <main id="main" class="app-main" tabIndex={-1}>
        <div class={cx('route', inSession && 'route--session')} key={key}>
          {screen}
        </div>
      </main>
      {!focused && !showWelcome && <AppFooter />}
      {!focused && <TabBar route={r} />}
      <Toast />
      <ShortcutsDialog />
    </div>
  );
}
