// Home (#/, with #/welcome kept as an old alias), set as a printed edition:
// a paper sheet on the Forge-orange field carries a real argument to judge,
// then the shared Daily Forge, a contents sheet of activities, the library's
// families, the plain facts, and the back cover.

import type { JSX } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { APP_VERSION, REPO_URL } from '../../config';
import { logicItems } from '../../data/logic';
import { repairs } from '../../data/repairs';
import { DAILY_SIZE } from '../../engine/daily';
import { LOGIC_SESSION_SIZE } from '../../engine/logic';
import { REPAIR_SESSION_SIZE } from '../../engine/repair';
import { pickDemoItem, SESSION_SIZE } from '../../engine/select';
import type { Item, SpotChoice } from '../../engine/types';
import { bank, fallacyName } from '../../state/store';
import { SQUARE, FORGE } from '../archive';
import { ButtonLink } from '../components/Button';
import { Icon } from '../components/Icon';
import { LogoMark } from '../components/Logo';
import { PassageCard } from '../components/PassageCard';
import { useNow } from '../hooks';
import { cx } from '../util';
import { showFamily } from './Library';
import { type ActivityId, inProgress } from './Practice';
import { DailyHero } from './Today';

/** The eye's diamond pupil, used as the separator in printed detail lines. */
export function Diamond(): JSX.Element {
  return <span class="diamond" aria-hidden="true" />;
}

function Trial({ item }: { item: Item }): JSX.Element {
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
    <div class="trial" data-ui>
      <PassageCard item={item} highlight={choice !== null} />
      {choice === null ? (
        <div class="trial__ask">
          <p id="trial-prompt" class="trial__prompt">
            Is the reasoning sound?
          </p>
          <div class="trial__choices" role="group" aria-labelledby="trial-prompt">
            <button type="button" class="trial__choice" onClick={() => setChoice('sound')}>
              <Icon name="check" size={20} strokeWidth={2.5} />
              <span>Sound</span>
            </button>
            <button type="button" class="trial__choice" onClick={() => setChoice('flawed')}>
              <Icon name="crack" size={20} strokeWidth={2.2} />
              <span>Flawed</span>
            </button>
          </div>
        </div>
      ) : (
        <div ref={resultRef} tabIndex={-1} class={cx('trial__result', correct ? 'is-correct' : 'is-wrong')} role="status">
          <p class="trial__verdict">
            <span class="trial__mark" aria-hidden="true">
              <Icon name={correct ? 'check' : 'x'} size={16} strokeWidth={3} />
            </span>
            {verdict}
          </p>
          {nameId && (
            <p class="trial__name">
              {item.isSound ? 'It only looks like ' : 'The flaw: '}
              <strong>{fallacyName(nameId)}</strong>
            </p>
          )}
          <p class="trial__why">{item.explanation}</p>
          <div class="trial__actions">
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

interface Entry {
  id: ActivityId | 'library' | 'progress';
  title: string;
  text: string;
  href: string;
  value: string;
}

function ContentsGroup({ title, entries }: { title: string; entries: readonly Entry[] }): JSX.Element {
  return (
    <div class="contents__group" data-reveal>
      <h3 class="contents__group-title">{title}</h3>
      <ul class="contents__list">
        {entries.map((entry) => {
          const resume = entry.id !== 'library' && entry.id !== 'progress' && inProgress(entry.id);
          return (
            <li key={entry.id}>
              <a class="contents__row" href={entry.href}>
                <span class="contents__name">{entry.title}</span>
                <span class="contents__leader" aria-hidden="true" />
                <span class="contents__value">{resume ? 'Resume' : entry.value}</span>
              </a>
              <p class="contents__text">{entry.text}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function WelcomeScreen(): JSX.Element {
  const demo = useMemo(() => pickDemoItem(bank), []);
  const now = useNow(30_000);
  const fallacies = bank.fallacies.length;
  const families = [...bank.families].sort((a, b) => a.order - b.order);

  const practice: readonly Entry[] = [
    { id: 'spot', title: 'Spot the flaw', text: 'Decide if an argument holds up, then name the flaw.', href: '#/play/practice', value: `${SESSION_SIZE} questions` },
    { id: 'repair', title: 'Fix the argument', text: 'Choose the rewrite that fixes a weak argument.', href: '#/repair', value: `${REPAIR_SESSION_SIZE} arguments` },
    { id: 'logic', title: 'What follows?', text: 'Given a few facts, judge whether a claim must follow.', href: '#/logic', value: `${LOGIC_SESSION_SIZE} puzzles` },
  ];
  const study: readonly Entry[] = [
    { id: 'library', title: 'Library', text: 'Plain definitions, how to spot each one, and when it is fair.', href: '#/library', value: `${fallacies} fallacies` },
    { id: 'progress', title: 'Progress', text: 'Accuracy, mastery and streaks, with a backup file.', href: '#/progress', value: 'This device' },
  ];

  return (
    <div class="home">
      <section class="home-hero" aria-labelledby="home-title">
        <div class="home-hero__sheet">
          <LogoMark size={56} class="home-hero__eye" />
          <h1 id="home-title" class="home-hero__title" tabIndex={-1}>
            <span>Examine</span> <span>an argument.</span>
          </h1>
          <p class="home-hero__lede">Free reasoning practice with everyday arguments. Read this one, decide, then see why.</p>
          <p class="home-hero__details">
            <span>Fictional scenario</span>
            <Diamond />
            <span>Not scored</span>
          </p>
          {demo && <Trial item={demo} />}
        </div>
      </section>

      <section class="home-daily" aria-labelledby="home-daily-title">
        <div class="home-daily__plate" data-ui>
          <DailyHero now={now} />
        </div>
        <div class="home-daily__text">
          <div class="home-daily__copy">
            <h2 id="home-daily-title" data-reveal>
              The same ten for everyone
            </h2>
            <p data-reveal style={{ '--reveal-i': '1' }}>
              One shared set of arguments for each calendar day. Answer at your own pace; your answers stay on this device.
            </p>
            <p class="home-daily__facts" data-reveal style={{ '--reveal-i': '2' }}>
              <span>{DAILY_SIZE} questions</span>
              <Diamond />
              <span>About 5 minutes</span>
              <Diamond />
              <span>New each day</span>
            </p>
          </div>
          <div class="home-daily__cells" data-reveal style={{ '--reveal-i': '3' }}>
            <a class="cell cell--ink" href="#/practice">
              Choose practice <Icon name="arrow-right" size={18} />
            </a>
            <a class="cell cell--tone" href="#/about">
              How scoring works <Icon name="arrow-right" size={18} />
            </a>
          </div>
        </div>
      </section>

      <section class="home-contents" aria-labelledby="home-contents-title">
        <div class="contents">
          <h2 id="home-contents-title" class="contents__title" data-reveal>
            Practice on your own
          </h2>
          <ContentsGroup title="Practice" entries={practice} />
          <ContentsGroup title="Study" entries={study} />
        </div>
      </section>

      <section class="home-library" aria-labelledby="home-library-title">
        <h2 id="home-library-title" class="home-library__title" data-reveal>
          <span>{fallacies} fallacies,</span> <span>in {families.length} families.</span>
        </h2>
        <div class="home-library__grid">
          <figure class="home-library__figure" data-reveal>
            <img src={SQUARE.src} width={SQUARE.width} height={SQUARE.height} alt={SQUARE.alt} loading="lazy" decoding="async" />
            <figcaption>
              {SQUARE.caption}{' '}
              <span class="credit">
                {SQUARE.credit},{' '}
                <a href={SQUARE.licenseUrl} rel="noopener">
                  {SQUARE.license}
                </a>
                .
              </span>
            </figcaption>
          </figure>
          <div class="home-library__index">
            <p class="home-library__label" aria-hidden="true">
              Families
            </p>
            <ul class="home-library__rows" aria-label="Fallacy families">
              {families.map((family, index) => {
                const members = bank.fallacies.filter((f) => f.family === family.id);
                return (
                  <li key={family.id} data-reveal style={{ '--reveal-i': String(Math.min(index, 4)) }}>
                    <a class="home-library__row" href="#/library" onClick={() => showFamily(family.id)}>
                      <span class="home-library__family">{family.label}</span>
                      <span class="home-library__examples">
                        {members
                          .slice(0, 2)
                          .map((f) => f.name)
                          .join(', ')}
                      </span>
                      <span class="home-library__count">
                        {members.length} <Icon name="arrow-right" size={16} />
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
            <a class="text-link" href="#/library">
              Open the library <Icon name="arrow-right" size={16} />
            </a>
          </div>
        </div>
      </section>

      <section class="home-facts" aria-labelledby="home-facts-title">
        <h2 id="home-facts-title" class="home-facts__title" data-reveal>
          Free, private and open
        </h2>
        <div class="home-facts__row">
          <dl class="home-facts__pairs" data-reveal>
            <div>
              <dt>Cost</dt>
              <dd>Free</dd>
            </div>
            <div>
              <dt>Accounts</dt>
              <dd>None</dd>
            </div>
            <div>
              <dt>Your progress</dt>
              <dd>Saved on this device</dd>
            </div>
          </dl>
          <p class="home-facts__para" data-reveal style={{ '--reveal-i': '1' }}>
            Fallacy Forge is a workbench for everyday reasoning. Every scenario is fictional and reviewed, answers stay in this
            browser, and the app keeps working offline once it has loaded.
          </p>
        </div>
        <div class="home-facts__row home-facts__row--record">
          <figure class="home-facts__figure" data-reveal>
            <img src={FORGE.src} width={FORGE.width} height={FORGE.height} alt={FORGE.alt} loading="lazy" decoding="async" />
            <figcaption>
              {FORGE.caption}{' '}
              <span class="credit">
                {FORGE.credit},{' '}
                <a href={FORGE.licenseUrl} rel="noopener">
                  {FORGE.license}
                </a>
                .
              </span>
            </figcaption>
          </figure>
          <h3 class="home-facts__word">Inside</h3>
          <ul class="home-facts__list" data-reveal>
            <li><span>Quiz questions</span><span>{bank.items.length}</span></li>
            <li><span>Fallacies</span><span>{fallacies}</span></li>
            <li><span>Repair exercises</span><span>{repairs.length}</span></li>
            <li><span>Deduction puzzles</span><span>{logicItems.length}</span></li>
          </ul>
          <ul class="home-facts__list" data-reveal style={{ '--reveal-i': '1' }}>
            <li><span>License</span><span>MIT</span></li>
            <li><a href={REPO_URL} rel="noopener">Source on GitHub</a><span>Open</span></li>
            <li><a href="#/about">About and scoring</a><span>Read</span></li>
            <li><span>Version</span><span>{APP_VERSION}</span></li>
          </ul>
        </div>
      </section>

      <footer class="home-back">
        <div class="home-back__panel">
          <div class="home-back__note">
            <p class="home-back__signoff">Think it through.</p>
            <p>A new Daily Forge waits each morning. Practice the rest whenever you like.</p>
          </div>
          <div class="home-back__address">
            <span class="home-back__stamp" aria-hidden="true">
              <LogoMark size={64} />
            </span>
            <a href="#/today">Daily Forge</a>
            <a href="#/library">Library</a>
            <a href="#/about">About</a>
            <a href={REPO_URL} rel="noopener">
              GitHub
            </a>
          </div>
          <p class="home-back__imprint">
            Fallacy Forge <Diamond /> MIT license <Diamond /> v{APP_VERSION}
          </p>
        </div>
      </footer>
    </div>
  );
}
