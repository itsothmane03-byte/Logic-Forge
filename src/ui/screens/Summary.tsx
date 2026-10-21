// End-of-session summary: score ring, share (Daily), mastery changes, answers.

import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { dateKey } from '../../engine/dates';
import { BAND_MESSAGES, scoreBand, sessionScore } from '../../engine/score';
import type { Item, Outcome } from '../../engine/types';
import { dailySummary, summary, type SummaryData } from '../../state/session';
import { fallacyName, itemById } from '../../state/store';
import { ButtonLink } from '../components/Button';
import { ProgressRing } from '../components/Charts';
import { Icon, type IconName } from '../components/Icon';
import { PassageCard } from '../components/PassageCard';
import { Reveal } from '../components/Primitives';
import { ShareButton } from '../components/Share';
import { cx, FORMAT_ICONS, FORMAT_LABELS, plural } from '../util';
import { sessionTitle } from './Session';

const BADGE: Record<Outcome, { label: string; icon: IconName }> = {
  correct: { label: 'Correct', icon: 'check' },
  partial: { label: 'Right instinct', icon: 'minus' },
  wrong: { label: 'Missed', icon: 'x' },
};

function AnswerRow({ item, outcome, index }: { item: Item; outcome: Outcome; index: number }) {
  const [open, setOpen] = useState(false);
  const panelId = `answer-${index}`;
  const truth = item.isSound ? 'Sound' : fallacyName(item.fallacyId ?? '');
  const sub = item.isSound && item.resembles ? `Looks like ${fallacyName(item.resembles)}` : FORMAT_LABELS[item.format];
  const badge = BADGE[outcome];
  return (
    <Reveal as="li" index={Math.min(index, 4)} class="answer-row">
      <button type="button" class="answer-row__toggle" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
        <span class="answer-row__format" aria-hidden="true">
          <Icon name={FORMAT_ICONS[item.format]} size={18} />
        </span>
        <span class="answer-row__main">
          <span class="answer-row__truth">
            <span class="answer-row__n">{index + 1}.</span> {truth}
          </span>
          <span class="answer-row__meta">
            <span class={`badge badge--${outcome}`}>
              <Icon name={badge.icon} size={14} strokeWidth={3} />
              {badge.label}
            </span>
            <span class="answer-row__sub">{sub}</span>
          </span>
        </span>
        <Icon name="chevron-down" size={18} class={cx('answer-row__chev', open && 'is-open')} />
      </button>
      {open && (
        <div id={panelId} class="answer-row__panel">
          <PassageCard item={item} highlight />
          <p class="answer-row__explanation">{item.explanation}</p>
        </div>
      )}
    </Reveal>
  );
}

function Content({ data }: { data: SummaryData }) {
  const total = data.itemIds.length;
  const correct = sessionScore(data.outcomes);
  const partial = data.outcomes.filter((o) => o === 'partial').length;
  const band = scoreBand(correct, total);
  const title = sessionTitle({ mode: data.mode, dateKey: data.dateKey, focusId: data.focusId });
  const items = data.itemIds.map((id) => itemById.get(id));

  return (
    <div class="page page--narrow summary">
      <section class="summary-hero" aria-labelledby="summary-title">
        <p class="eyebrow">{title} · complete</p>
        <ProgressRing value={correct} total={total} />
        <h1 id="summary-title" class="summary-hero__title" tabIndex={-1}>
          {BAND_MESSAGES[band]}
        </h1>
        <p class="summary-hero__line">
          {plural(correct, 'correct answer')} out of {total}
          {partial > 0 ? `, plus ${plural(partial, 'right instinct')}` : ''}.
        </p>
        {data.mode === 'daily' && data.dailyNumber !== null && (
          <div class="summary-hero__share">
            <ShareButton dailyNumber={data.dailyNumber} outcomes={data.outcomes} total={total} variant="primary" size="lg" />
          </div>
        )}
      </section>

      {data.changes.length > 0 && (
        <Reveal as="section" class="summary-block" aria-labelledby="changes-title">
          <h2 id="changes-title" class="summary-block__title">
            Mastery changes
          </h2>
          <ul class="chip-row">
            {data.changes.map((change) => (
              <li key={change.fallacyId}>
                <a class={cx('chip', 'chip--link', `chip--${change.direction}`)} href={`#/library/${change.fallacyId}`}>
                  {fallacyName(change.fallacyId)}
                  <span aria-hidden="true">{change.direction === 'up' ? '↑' : '↓'}</span>
                  <span class="sr-only">{change.direction === 'up' ? 'improved' : 'slipped'}</span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      )}

      <section class="summary-block" aria-labelledby="answers-title">
        <h2 id="answers-title" class="summary-block__title">
          Your answers
        </h2>
        <ol class="answers">
          {items.map((item, i) => {
            const outcome = data.outcomes[i];
            return item && outcome ? <AnswerRow key={item.id} item={item} outcome={outcome} index={i} /> : null;
          })}
        </ol>
      </section>

      <div class="summary-actions">
        <ButtonLink href="#/play/practice" variant="primary" size="lg" icon="target">
          Practice weak spots
        </ButtonLink>
        <ButtonLink href="#/" variant="secondary" size="lg">
          Back to Today
        </ButtonLink>
      </div>
    </div>
  );
}

export function SummaryScreen(): JSX.Element {
  const data = summary.value ?? dailySummary(dateKey());
  if (!data) {
    return (
      <div class="page page--narrow empty-state">
        <h1 class="page-title" tabIndex={-1}>
          Nothing to summarize yet
        </h1>
        <p class="lead">Finish a set of questions and your results will show up here.</p>
        <ButtonLink href="#/" variant="primary" size="lg">
          Back to Today
        </ButtonLink>
      </div>
    );
  }
  return <Content data={data} />;
}
