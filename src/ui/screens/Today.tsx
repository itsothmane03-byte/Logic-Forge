// The shared daily challenge. Home reuses DailyHero, including saved states.
import type { JSX } from 'preact';
import { DAILY_SIZE, dailyNumber } from '../../engine/daily';
import { dateKey, msUntilMidnight } from '../../engine/dates';
import { sessionScore } from '../../engine/score';
import { reviewQueue } from '../../engine/select';
import { fallacyOfTheDay } from '../../engine/stats';
import type { Outcome } from '../../engine/types';
import { navigate } from '../../router';
import { dailySummary, summary } from '../../state/session';
import { bank, bankItemIds, progress } from '../../state/store';
import { Button, ButtonLink } from '../components/Button';
import { Icon } from '../components/Icon';
import { ShareButton } from '../components/Share';
import { useNow } from '../hooks';
import { countdown, cx, longDate, plural } from '../util';

function DailyPath({ answers, total }: { answers: readonly Outcome[]; total: number }) {
  return (
    <ol class="daily-path" aria-label={`${answers.length} of ${total} questions answered`}>
      {Array.from({ length: total }, (_, i) => (
        <li key={i} class={cx('daily-path__node', answers[i] && `daily-path__node--${answers[i]}`)}>
          <span aria-hidden="true">{answers[i] === 'correct' ? <Icon name="check" size={13} /> : i + 1}</span>
          <span class="sr-only">Question {i + 1}: {answers[i] === 'partial' ? 'partly correct' : answers[i] ?? 'unanswered'}</span>
        </li>
      ))}
    </ol>
  );
}

export function DailyHero({ now, title = 'Daily Forge' }: { now: number; title?: string }): JSX.Element {
  const today = dateKey(now);
  const record = progress.value.daily[today];
  const total = record?.itemIds.length ?? DAILY_SIZE;
  const answers = record?.answers ?? [];
  const done = record?.done === true;
  const score = sessionScore(answers);
  const openSummary = () => {
    summary.value = dailySummary(today);
    navigate('#/summary');
  };
  return (
    <section class={cx('daily-hero', done && 'daily-hero--done')} aria-labelledby="daily-title">
      <div class="daily-hero__body">
        <h2 id="daily-title" class="daily-hero__title">{title} <span class="daily-hero__num">#{dailyNumber(today)}</span></h2>
        <p class="daily-hero__meta">The same {total} questions for everyone today. About 5 minutes.</p>
        <DailyPath answers={answers} total={total} />
        <p class="daily-hero__status">{done ? `${score} correct out of ${total}.` : answers.length ? `${answers.length} of ${total} answered.` : 'A new set every day.'}</p>
        <div class="daily-hero__actions">
          {!done && <ButtonLink href="#/play/daily" variant="primary" iconRight="arrow-right">{answers.length ? `Resume ${answers.length}/${total}` : 'Start Daily Forge'}</ButtonLink>}
          {done && <>
            <Button variant="primary" icon="check" onClick={openSummary}>Done {score}/{total}</Button>
            <ShareButton dailyNumber={dailyNumber(today)} outcomes={answers} total={total} variant="secondary" />
          </>}
        </div>
        {done && <p class="daily-hero__next">Next set in {countdown(msUntilMidnight(new Date(now)))}</p>}
      </div>
    </section>
  );
}

export function TodayScreen(): JSX.Element {
  const now = useNow(30_000);
  const today = dateKey(now);
  const reviewCount = reviewQueue(progress.value.attempts, bankItemIds).length;
  const fallacy = fallacyOfTheDay(bank.fallacies, today);
  return (
    <div class="page today">
      <header class="today-head">
        <h1 class="page-title" tabIndex={-1}>Daily Forge</h1>
        <p class="today-head__date">{longDate(new Date(now))}</p>
      </header>
      <DailyHero now={now} title="Challenge" />
      {reviewCount > 0 && <section class="daily-review" aria-labelledby="review-title">
        <div><h2 id="review-title">Revisit your mistakes</h2><p>{plural(reviewCount, 'recent miss', 'recent misses')}, newest first.</p></div>
        <ButtonLink href="#/play/review" variant="secondary" iconRight="arrow-right">Review</ButtonLink>
      </section>}
      <div class="daily-explore">
        <section>
          <h2>Work on a specific skill</h2>
          <p>Spot a flaw, strengthen an argument, or work out what follows. Choose your own pace and topics.</p>
          <a class="text-link" href="#/practice">Choose practice <Icon name="arrow-right" size={18} /></a>
        </section>
        {fallacy && <section aria-label="Fallacy of the day">
          <h2><a href={`#/library/${fallacy.id}`}>{fallacy.name}</a></h2>
          <p>{fallacy.shortDef}</p>
          <a class="text-link" href={`#/library/${fallacy.id}`}>Explore today's fallacy <Icon name="arrow-right" size={18} /></a>
        </section>}
      </div>
    </div>
  );
}
