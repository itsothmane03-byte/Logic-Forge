// Home: greeting + streak, first-run card, the Daily Forge hero, secondary cards.

import type { JSX } from 'preact';
import { DAILY_SIZE, dailyNumber } from '../../engine/daily';
import { dateKey, msUntilMidnight } from '../../engine/dates';
import { sessionScore } from '../../engine/score';
import { reviewQueue } from '../../engine/select';
import { fallacyOfTheDay, weakestFallacies } from '../../engine/stats';
import { currentStreak } from '../../engine/streak';
import type { Outcome } from '../../engine/types';
import { navigate } from '../../router';
import { dailySummary, summary } from '../../state/session';
import { bank, bankItemIds, markOnboarded, progress } from '../../state/store';
import { Button, ButtonLink, IconButton } from '../components/Button';
import { Icon } from '../components/Icon';
import { LogoMark } from '../components/Logo';
import { FamilyDot, StreakChip } from '../components/Primitives';
import { ShareButton } from '../components/Share';
import { useNow } from '../hooks';
import { countdown, cx, greeting, longDate, plural } from '../util';

function DailyPips({ answers, total }: { answers: readonly Outcome[]; total: number }) {
  return (
    <ol class="pips" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <li key={i} class={cx('pip', answers[i] && `pip--${answers[i]}`)} />
      ))}
    </ol>
  );
}

function HowItWorks() {
  return (
    <section class="howto" aria-labelledby="howto-title">
      <div class="howto__head">
        <h2 id="howto-title" class="howto__title">
          How it works
        </h2>
        <IconButton icon="x" label="Dismiss How it works" onClick={markOnboarded} />
      </div>
      <ol class="howto__steps">
        <li>
          <span class="howto__n" aria-hidden="true">1</span>
          <span>
            <strong>Spot.</strong> Is the reasoning sound or flawed?
          </span>
        </li>
        <li>
          <span class="howto__n" aria-hidden="true">2</span>
          <span>
            <strong>Name.</strong> Pick the fallacy from four look-alikes.
          </span>
        </li>
        <li>
          <span class="howto__n" aria-hidden="true">3</span>
          <span>
            <strong>Learn.</strong> See the exact phrase that gives it away.
          </span>
        </li>
      </ol>
      <ButtonLink href="#/play/demo" variant="secondary" icon="sparkle">
        Try one
      </ButtonLink>
    </section>
  );
}

function DailyHero({ now }: { now: number }) {
  const today = dateKey(now);
  const record = progress.value.daily[today];
  const total = record?.itemIds.length ?? DAILY_SIZE;
  const answers = record?.answers ?? [];
  const number = dailyNumber(today);
  const done = record?.done === true;
  const score = sessionScore(answers);

  const openSummary = () => {
    summary.value = dailySummary(today);
    navigate('#/summary');
  };

  return (
    <section class={cx('daily-hero', done && 'daily-hero--done')} aria-labelledby="daily-title">
      <div class="daily-hero__body">
        <p class="daily-hero__eyebrow">
          <Icon name="calendar" size={16} />
          Today's forge
        </p>
        <h2 id="daily-title" class="daily-hero__title">
          Daily Forge <span class="daily-hero__num">#{number}</span>
        </h2>
        <p class="daily-hero__meta">{total} questions · about 5 min</p>
        <DailyPips answers={answers} total={total} />
        <div class="daily-hero__actions">
          {answers.length === 0 && (
            <ButtonLink href="#/play/daily" variant="primary" size="lg" iconRight="arrow-right">
              Start
            </ButtonLink>
          )}
          {answers.length > 0 && !done && (
            <ButtonLink href="#/play/daily" variant="primary" size="lg" iconRight="arrow-right">
              Resume {answers.length}/{total}
            </ButtonLink>
          )}
          {done && (
            <>
              <Button variant="primary" size="lg" icon="check" onClick={openSummary}>
                Done {score}/{total}
              </Button>
              <ShareButton dailyNumber={number} outcomes={answers} total={total} size="lg" variant="secondary" />
            </>
          )}
        </div>
        {done && (
          <p class="daily-hero__next">
            <Icon name="clock" size={16} />
            Next forge in {countdown(msUntilMidnight(new Date(now)))}
          </p>
        )}
      </div>
      <div class="daily-hero__art" aria-hidden="true">
        <span class="daily-hero__spark daily-hero__spark--a">
          <Icon name="spark" size={22} />
        </span>
        <span class="daily-hero__spark daily-hero__spark--b">
          <Icon name="spark" size={14} />
        </span>
        <LogoMark size={190} class="daily-hero__mark" />
      </div>
    </section>
  );
}

export function TodayScreen(): JSX.Element {
  const now = useNow(30_000);
  const today = dateKey(now);
  const p = progress.value;
  const streak = currentStreak(p.days, today);
  const weakest = weakestFallacies(bank.fallacies, p, 3);
  const reviewCount = reviewQueue(p.attempts, bankItemIds).length;
  const fotd = fallacyOfTheDay(bank.fallacies, today);
  const practiced = p.attempts.length > 0;

  return (
    <div class="page today">
      <header class="today-head">
        <div>
          <h1 class="today-head__greeting" tabIndex={-1}>
            {greeting(new Date(now))}
          </h1>
          <p class="today-head__date">{longDate(new Date(now))}</p>
        </div>
        <StreakChip days={streak} />
      </header>

      {!p.onboarded && <HowItWorks />}

      <div class="today-grid">
        <DailyHero now={now} />

        <section class="tile tile--practice" aria-labelledby="practice-title">
          <span class="tile__icon" aria-hidden="true">
            <Icon name="target" size={22} />
          </span>
          <h2 id="practice-title" class="tile__title">
            Practice
          </h2>
          <p class="tile__sub">Adaptive · your weak spots first</p>
          {weakest.length > 0 && (
            <div class="tile__chips">
              <p class="tile__chips-label">{practiced ? 'Needs work' : 'Good places to start'}</p>
              <ul class="chip-row">
                {weakest.map((f) => (
                  <li key={f.id}>
                    <a class="chip chip--link" href={`#/library/${f.id}`}>
                      <FamilyDot family={f.family} />
                      {f.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ButtonLink href="#/play/practice" variant="secondary" iconRight="arrow-right" class="tile__cta">
            Start practice
          </ButtonLink>
        </section>

        {reviewCount > 0 && (
          <section class="tile tile--review" aria-labelledby="review-title">
            <span class="tile__icon" aria-hidden="true">
              <Icon name="refresh" size={22} />
            </span>
            <h2 id="review-title" class="tile__title">
              Review mistakes <span class="tile__count">({reviewCount})</span>
            </h2>
            <p class="tile__sub">{plural(reviewCount, 'recent miss', 'recent misses')}, newest first.</p>
            <ButtonLink href="#/play/review" variant="secondary" iconRight="arrow-right" class="tile__cta">
              Review
            </ButtonLink>
          </section>
        )}

        {fotd && (
          <section class="tile tile--fotd" aria-labelledby="fotd-title">
            <p class="eyebrow tile__eyebrow">
              <FamilyDot family={fotd.family} />
              Fallacy of the day
            </p>
            <h2 id="fotd-title" class="tile__title tile__title--big">
              {fotd.name}
            </h2>
            <p class="tile__text">{fotd.shortDef}</p>
            <a class="text-link tile__cta" href={`#/library/${fotd.id}`}>
              Learn it <Icon name="arrow-right" size={18} />
            </a>
          </section>
        )}
      </div>
    </div>
  );
}
