import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/bricolage-grotesque/wght.css';
import './ui/styles/tokens.css';
import './ui/styles/base.css';
import './ui/styles/controls.css';
import './ui/styles/chrome.css';
import './ui/styles/overlays.css';
import './ui/styles/forms.css';
import './ui/styles/passages.css';
import './ui/styles/session.css';
import './ui/styles/today.css';
import './ui/styles/library.css';
import './ui/styles/detail.css';
import './ui/styles/pages.css';
import './ui/styles/welcome.css';
import './ui/styles/welcome-sections.css';

import { effect, untracked } from '@preact/signals';
import { render } from 'preact';
import { App } from './app';
import { dateKey } from './engine/dates';
import { replaceRoute, route, startRouter } from './router';
import { dailySummary, prepareSession, summary } from './state/session';
import { progress, watchOtherTabs } from './state/store';
import { initReveal } from './ui/reveal';
import { playFallback } from './ui/screens/Session';
import { applyTheme, watchSystemTheme } from './ui/theme';

// Theme follows the saved setting; 'system' tracks the OS.
effect(() => applyTheme(progress.value.settings.theme));
watchSystemTheme(() => progress.peek().settings.theme);

// Play routes create or resume their session before the screen renders.
effect(() => {
  const current = route.value;
  if (current.name !== 'play') return;
  untracked(() => {
    const result = prepareSession(current);
    if (result.status === 'ready') return;
    if (result.status === 'daily-done') {
      summary.value = dailySummary(dateKey());
      replaceRoute('#/summary');
      return;
    }
    playFallback(result.status, current.mode === 'focus' ? current.fallacyId : undefined);
  });
});

startRouter();
watchOtherTabs();
initReveal();

const root = document.getElementById('app');
if (root) render(<App />, root);
