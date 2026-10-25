// Home (#/, with #/welcome kept as an old alias): a compact working entry,
// not a marketing page. A real demo question, the real shared Daily Forge
// card, and quick access to practice and the library.

import type { JSX } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { REPO_URL } from '../../config';
import { pickDemoItem } from '../../engine/select';
import type { Item, SpotChoice } from '../../engine/types';
import { bank, fallacyName } from '../../state/store';
import { ButtonLink } from '../components/Button';
import { Icon } from '../components/Icon';
import { LogoMark } from '../components/Logo';
import { PassageCard } from '../components/PassageCard';
import { useNow } from '../hooks';
import { cx } from '../util';
import { ACTIVITIES, inProgress } from './Practice';
import { DailyHero } from './Today';

type PathStage = 'read' | 'decide' | 'understand';
const PATH_STEPS: ReadonlyArray<{ id: PathStage; label: string }> = [
  { id: 'read', label: 'Read' },
  { id: 'decide', label: 'Decide' },
  { id: 'understand', label: 'Understand' },
];

/**
 * Where the demo actually is: reading is implicit once the passage is on
 * screen, deciding is current until a choice is made, understanding follows
 * the check. The path indicates the task stage, never the answer.
 */
function ReasoningPath({ current }: { current: PathStage }) {
  const currentIndex = PATH_STEPS.findIndex((step) => step.id === current);
  return (
    <ol class="reasoning-path" aria-label="Where you are in this question">
      {PATH_STEPS.map((step, index) => {
        const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming';
        return (
          <li
            key={step.id}
            class={cx('reasoning-path__step', `reasoning-path__step--${state}`)}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span class="reasoning-path__node" aria-hidden="true">
              {state === 'done' && <Icon name="check" size={12} strokeWidth={3} />}
            </span>
            <span class="reasoning-path__label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function MiniDemo({ item }: { item: Item }) {
  const [choice, setChoice] = useState<SpotChoice | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const correct = choice !== null && (item.isSound ? choice === 'sound' : choice === 'flawed');
  const nameId = item.isSound ? item.resembles : item.fallacyId;

  useEffect(() => {
    if (choice !== null) resultRef.current?.focus({ preventScroll: true });
  }, [choice]);

  const verdict = item.isSound
    ? correct ? 'Sound, and sneaky.' : "This one's actually sound."
    : correct ? "Spot on. There's a flaw." : "There's a flaw here.";

  return (
    <div class="demo-workbench" aria-labelledby="demo-workbench-title">
      <div class="demo-workbench__head">
        <h2 id="demo-workbench-title" class="workbench-panel__title">Try a question</h2>
        <p class="demo-workbench__note">Fictional scenario · not scored</p>
      </div>
      <ReasoningPath current={choice === null ? 'decide' : 'understand'} />
      <PassageCard item={item} highlight={choice !== null} />
      {choice === null ? (
        <div class="demo-workbench__ask">
          <p id="demo-prompt" class="step-prompt">
            Is the reasoning sound?
          </p>
          <div class="spot spot--compact" role="group" aria-labelledby="demo-prompt">
            <button type="button" class="spot__btn spot__btn--sound" onClick={() => setChoice('sound')}>
              <span class="spot__icon">
                <Icon name="check" size={22} strokeWidth={2.5} />
              </span>
              <span class="spot__label">Sound</span>
            </button>
            <button type="button" class="spot__btn spot__btn--flawed" onClick={() => setChoice('flawed')}>
              <span class="spot__icon">
                <Icon name="crack" size={22} strokeWidth={2.2} />
              </span>
              <span class="spot__label">Flawed</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={resultRef}
          tabIndex={-1}
          class={cx('demo-workbench__result', correct ? 'is-correct' : 'is-wrong')}
          role="status"
        >
          <p class="demo-workbench__verdict">
            <span class="demo-workbench__icon" aria-hidden="true">
              <Icon name={correct ? 'check' : 'x'} size={18} strokeWidth={3} />
            </span>
            {verdict}
          </p>
          {nameId && (
            <p class="demo-workbench__name">
              {item.isSound ? 'It only looks like ' : ''}
              <strong>{fallacyName(nameId)}</strong>
            </p>
          )}
          <p class="demo-workbench__exp">{item.explanation}</p>
          <div class="demo-workbench__actions">
            <ButtonLink href="#/play/daily" variant="primary" iconRight="arrow-right">
              Open Daily Forge
            </ButtonLink>
            <button type="button" class="text-link" onClick={() => setChoice(null)}>
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function WelcomeScreen(): JSX.Element {
  const demo = useMemo(() => pickDemoItem(bank), []);
  const count = bank.fallacies.length;
  const now = useNow(30_000);

  return (
    <div class="welcome-workbench">
      <header class="workbench-head">
        <h1 class="workbench-head__title" tabIndex={-1}>
          Examine an argument.
        </h1>
        <p class="workbench-head__sub">
          Reasoning practice with everyday arguments. Try this one, then see why.
        </p>
      </header>

      <div class="workbench-grid">
        {demo && <MiniDemo item={demo} />}
        <DailyHero now={now} />
      </div>

      <section class="workbench-activities" aria-labelledby="workbench-activities-title">
        <h2 id="workbench-activities-title" class="workbench-panel__title">
          Practice on your own
        </h2>
        <ul class="workbench-activities__list">
          {ACTIVITIES.map((activity) => (
            <li class="workbench-activity" key={activity.id}>
              <span class="workbench-activity__icon" aria-hidden="true">
                <Icon name={activity.icon} size={20} />
              </span>
              <span class="workbench-activity__body">
                <span class="workbench-activity__title">{activity.title}</span>
                <span class="workbench-activity__text">{activity.text}</span>
              </span>
              <ButtonLink href={activity.href} variant="secondary" size="sm" iconRight="arrow-right">
                {inProgress(activity.id) ? 'Resume' : 'Start'}
                <span class="sr-only"> {activity.title}</span>
              </ButtonLink>
            </li>
          ))}
        </ul>
        <div class="workbench-activities__links">
          <a class="text-link" href="#/practice">
            Choose practice <Icon name="arrow-right" size={16} />
          </a>
          <a class="text-link" href="#/library">
            Browse the {count} fallacies <Icon name="arrow-right" size={16} />
          </a>
        </div>
      </section>

      <footer class="welcome-footer">
        <div class="welcome-footer__inner">
          <span class="welcome-footer__brand">
            <LogoMark size={28} /> Fallacy Forge
          </span>
          <a href={REPO_URL} rel="noopener">
            <Icon name="code" size={16} /> GitHub
          </a>
          <span>MIT license</span>
        </div>
      </footer>
    </div>
  );
}
