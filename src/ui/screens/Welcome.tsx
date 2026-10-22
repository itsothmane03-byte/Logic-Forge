// Welcome landing (#/welcome, and #/ on the first visit). The hero and its
// primary call to action are never hidden or animated in; below-the-fold
// sections use progressive-enhancement scroll reveals.

import type { JSX } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { AUTHOR, REPO_URL } from '../../config';
import { pickDemoItem, pickFormatSamples } from '../../engine/select';
import type { Item, SpotChoice } from '../../engine/types';
import { bank, fallacyName, welcomeShown } from '../../state/store';
import { ButtonLink } from '../components/Button';
import { Icon, type IconName } from '../components/Icon';
import { LogoMark } from '../components/Logo';
import { PassageCard } from '../components/PassageCard';
import { Reveal } from '../components/Primitives';
import { cx, FORMAT_ICONS, FORMAT_LABELS } from '../util';

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
    <div class="mini-demo" aria-labelledby="demo-label">
      <p id="demo-label" class="mini-demo__label">
        <span class="live-dot" aria-hidden="true" />
        Try it now: a real question
      </p>
      <PassageCard item={item} highlight={choice !== null} />
      {choice === null ? (
        <div class="mini-demo__ask">
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
          class={cx('mini-demo__result', correct ? 'is-correct' : 'is-wrong')}
          role="status"
        >
          <p class="mini-demo__verdict">
            <span class="mini-demo__icon" aria-hidden="true">
              <Icon name={correct ? 'check' : 'x'} size={18} strokeWidth={3} />
            </span>
            {verdict}
          </p>
          {nameId && (
            <p class="mini-demo__name">
              {item.isSound ? 'It only looks like ' : ''}
              <strong>{fallacyName(nameId)}</strong>
            </p>
          )}
          <p class="mini-demo__exp">{item.explanation}</p>
          <div class="mini-demo__actions">
            <ButtonLink href="#/play/daily" variant="primary" iconRight="arrow-right">
              Start today's forge
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

const STEPS: Array<{ title: string; text: string; visual: 'spot' | 'name' | 'learn' }> = [
  { title: 'Spot', text: 'Read a short, real-world passage and decide: is the reasoning sound or flawed?', visual: 'spot' },
  { title: 'Name', text: "If it's flawed, name it. The wrong options are its closest look-alikes, so guessing won't cut it.", visual: 'name' },
  { title: 'Learn', text: 'See the exact phrase that breaks the argument, and why it isn’t the fallacy it resembles.', visual: 'learn' },
];

function StepVisual({ kind }: { kind: 'spot' | 'name' | 'learn' }) {
  if (kind === 'spot') {
    return (
      <div class="step-visual step-visual--spot" aria-hidden="true">
        <span class="sv-pill">
          <Icon name="check" size={16} strokeWidth={2.6} /> Sound
        </span>
        <span class="sv-pill sv-pill--on">
          <Icon name="crack" size={16} /> Flawed
        </span>
      </div>
    );
  }
  if (kind === 'name') {
    return (
      <div class="step-visual step-visual--name" aria-hidden="true">
        <span class="sv-opt">Red Herring</span>
        <span class="sv-opt sv-opt--on">
          Straw Man <Icon name="check" size={14} strokeWidth={3} />
        </span>
        <span class="sv-opt">False Dichotomy</span>
        <span class="sv-opt">Tu Quoque</span>
      </div>
    );
  }
  return (
    <div class="step-visual step-visual--learn" aria-hidden="true">
      <p>
        "So now we're supposed to <mark>sort every scrap of food we eat</mark>?"
      </p>
    </div>
  );
}

const FEATURES: Array<{ id: string; icon: IconName; title: string; text: string }> = [
  { id: 'daily', icon: 'calendar', title: 'A Daily Forge for everyone', text: 'The same ten questions for everyone, every day. Share your grid, never the answers.' },
  { id: 'adaptive', icon: 'layers', title: 'Practice that adapts', text: 'Every fallacy has its own Leitner box. Mistakes come back sooner; mastered ones fade out.' },
  { id: 'library', icon: 'book', title: 'The library', text: 'How to spot each one, a classic example, and when the move is actually fair.' },
  { id: 'progress', icon: 'flame', title: 'Progress and streaks', text: 'Mastery per fallacy, a practice heatmap and an accuracy trend.' },
  { id: 'offline', icon: 'phone', title: 'Works offline', text: 'Install it like an app. After the first visit it runs without a connection.' },
  { id: 'open', icon: 'code', title: 'Free and open source', text: 'MIT licensed. No accounts, no ads, no tracking.' },
];

function FeatureVisual({ id, count }: { id: string; count: number }) {
  if (id === 'daily') {
    return (
      <pre class="fv-share" aria-label="Example share text">
        {'Fallacy Forge #12 · 8/10\n🟩🟩🟨🟩🟥🟩🟩🟩🟩🟩'}
      </pre>
    );
  }
  if (id === 'adaptive') {
    return (
      <div class="fv-boxes" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((box) => (
          <span key={box} class="fv-box" style={{ '--box': String(box) }}>
            <i />
            <b>{box}</b>
          </span>
        ))}
      </div>
    );
  }
  if (id === 'library') {
    const names = bank.fallacies.slice(0, 5).map((f) => f.name);
    return (
      <div class="fv-library" aria-hidden="true">
        <span class="fv-count">{count}</span>
        <span class="fv-chips">
          {names.map((n) => (
            <span key={n}>{n}</span>
          ))}
        </span>
      </div>
    );
  }
  if (id === 'progress') {
    const levels = [0, 1, 2, 0, 3, 2, 4, 1, 0, 2, 3, 4, 4, 2, 1, 3, 0, 2, 4, 3, 2];
    return (
      <div class="fv-heat" aria-hidden="true">
        {levels.map((l, i) => (
          <i key={i} class={`heat heat--${l}`} />
        ))}
      </div>
    );
  }
  if (id === 'offline' || id === 'open') {
    const pills: Array<[IconName, string]> =
      id === 'offline'
        ? [['download', 'Install'], ['check', 'Offline ready'], ['phone', 'Phone to desktop']]
        : [['shield', 'No tracking'], ['check', 'No account'], ['code', 'MIT license']];
    return (
      <ul class="fv-pills" aria-hidden="true">
        {pills.map(([icon, text]) => (
          <li key={text}>
            <Icon name={icon} size={14} />
            {text}
          </li>
        ))}
      </ul>
    );
  }
  return null;
}

export function WelcomeScreen(): JSX.Element {
  const demo = useMemo(() => pickDemoItem(bank), []);
  const samples = useMemo(() => pickFormatSamples(bank.items, ['post', 'headline', 'email']), []);
  const count = bank.fallacies.length;

  useEffect(() => {
    welcomeShown.value = true;
  }, []);

  return (
    <div class="welcome">
      <div class="welcome-progress" aria-hidden="true" />

      <section class="hero" aria-labelledby="hero-title">
        <div class="hero__inner">
          <div class="hero__copy">
            <LogoMark size={72} class="hero__mark" />
            <h1 id="hero-title" class="hero__title" tabIndex={-1}>
              Spot bad arguments in five minutes a day.
            </h1>
            <p class="hero__sub">
              Realistic posts, emails and headlines with the flaw hidden among ordinary sentences, plus sound arguments that only look broken.
            </p>
            <div class="hero__ctas">
              <ButtonLink href="#/play/daily" variant="primary" size="lg" iconRight="arrow-right">
                Start today's forge
              </ButtonLink>
              <a class="text-link text-link--strong" href="#/library">
                Browse the {count} fallacies
              </a>
            </div>
          </div>
          {demo && (
            <div class="hero__demo">
              <MiniDemo item={demo} />
            </div>
          )}
        </div>
      </section>

      <section class="w-section how" aria-labelledby="how-title">
        <div class="w-inner">
          <Reveal class="w-head">
            <p class="eyebrow">How it works</p>
            <h2 id="how-title" class="w-title">
              Two small steps, then the lesson.
            </h2>
          </Reveal>
          <ol class="steps">
            {STEPS.map((step, i) => (
              <Reveal as="li" key={step.title} index={i} class="step-card">
                <StepVisual kind={step.visual} />
                <p class="step-card__n" aria-hidden="true">
                  0{i + 1}
                </p>
                <h3 class="step-card__title">{step.title}</h3>
                <p class="step-card__text">{step.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section class="w-section formats" aria-labelledby="formats-title">
        <div class="w-inner formats__grid">
          <Reveal class="formats__copy">
            <p class="eyebrow">Real-world formats</p>
            <h2 id="formats-title" class="w-title">
              Practice on what you actually read.
            </h2>
            <p class="w-lead">
              Posts, emails, group chats, headlines, ads, reviews and speeches. The flaw sits among ordinary, often reasonable sentences, the way it does in real life.
            </p>
            <ul class="format-list">
              {(Object.keys(FORMAT_LABELS) as Array<keyof typeof FORMAT_LABELS>).map((format) => (
                <li key={format}>
                  <Icon name={FORMAT_ICONS[format]} size={16} />
                  {FORMAT_LABELS[format]}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal class="fan" index={1}>
            {samples.map((item, i) => (
              <div key={item.id} class={`fan__card fan__card--${i}`}>
                <PassageCard item={item} />
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section class="w-section features" aria-labelledby="features-title">
        <div class="w-inner">
          <Reveal class="w-head">
            <p class="eyebrow">What's inside</p>
            <h2 id="features-title" class="w-title">
              Built for a five‑minute habit.
            </h2>
          </Reveal>
          <ul class="bento">
            {FEATURES.map((feature, i) => (
              <Reveal as="li" key={feature.id} index={i} class={`bento__tile bento__tile--${feature.id}`}>
                <span class="bento__icon" aria-hidden="true">
                  <Icon name={feature.icon} size={22} />
                </span>
                <h3 class="bento__title">{feature.id === 'library' ? `The library of ${count}` : feature.title}</h3>
                <p class="bento__text">{feature.text}</p>
                <FeatureVisual id={feature.id} count={count} />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section class="w-section" aria-labelledby="repair-discover-title">
        <div class="w-inner">
          <Reveal class="repair-discover">
            <p class="eyebrow">From spotting to improving</p>
            <h2 id="repair-discover-title" class="w-title">Found the flaw? Try fixing it.</h2>
            <p class="w-lead">Choose a better version of an everyday argument. Practice finding missing evidence, checking assumptions, and making fairer claims.</p>
            <ButtonLink href="#/practice" variant="secondary" iconRight="arrow-right">Explore the activities</ButtonLink>
          </Reveal>
        </div>
      </section>

      <section class="w-section final-cta" aria-labelledby="final-title">
        <Reveal class="final-cta__inner">
          <LogoMark size={56} />
          <h2 id="final-title" class="final-cta__title">
            Five minutes. One sharper eye.
          </h2>
          <p class="final-cta__text">No account, no ads, nothing to install.</p>
          <ButtonLink href="#/play/daily" variant="primary" size="lg" iconRight="arrow-right">
            Start today's forge
          </ButtonLink>
        </Reveal>
      </section>

      <footer class="welcome-footer">
        <div class="w-inner welcome-footer__inner">
          <span class="welcome-footer__brand">
            <LogoMark size={28} /> Fallacy Forge
          </span>
          <a href={REPO_URL} rel="noopener">
            <Icon name="code" size={16} /> GitHub
          </a>
          <span>MIT license</span>
          <span>Built by {AUTHOR}</span>
        </div>
      </footer>
    </div>
  );
}
