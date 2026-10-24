// Feedback sheet after each answer, plus the fallacy side sheet it can open.

import type { JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import type { AnswerPick } from '../../engine/session';
import type { Fallacy, Item, Outcome } from '../../engine/types';
import { fallacyById, fallacyName } from '../../state/store';
import { cx } from '../util';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { FallacyInfo } from './FallacyInfo';
import { Icon, type IconName } from './Icon';

interface Copy {
  title: string;
  icon: IconName;
  lead: string;
  nameId: string | null;
  after?: string;
}

function copyFor(item: Item, outcome: Outcome, pick: AnswerPick | null): Copy {
  const truth = item.isSound ? item.resembles : item.fallacyId;
  if (item.isSound) {
    return outcome === 'correct'
      ? { title: 'Sound, and sneaky.', icon: 'check', lead: 'It only looks like', nameId: truth }
      : { title: "This one's actually sound.", icon: 'x', lead: 'It resembles', nameId: truth };
  }
  if (outcome === 'correct') return { title: 'Spot on.', icon: 'check', lead: 'The flaw:', nameId: truth };
  if (outcome === 'partial') {
    const picked = pick?.named ? ` You picked ${fallacyName(pick.named)}.` : '';
    return { title: 'Right instinct, wrong name.', icon: 'minus', lead: "It's", nameId: truth, after: picked };
  }
  return { title: "There's a flaw here.", icon: 'x', lead: 'The flaw:', nameId: truth };
}

/** Only compare a fallacy the learner actually chose and we can explain. */
function whyNotFor(item: Item, outcome: Outcome, pick: AnswerPick | null): { id: string; text: string } | null {
  if (outcome !== 'partial' || !pick?.named || pick.spot !== 'flawed') return null;
  const specific = item.whyNot[pick.named];
  if (specific) return { id: pick.named, text: specific };
  const truth = item.fallacyId ? fallacyById.get(item.fallacyId) : undefined;
  const contrast = truth?.contrast[pick.named];
  return contrast ? { id: pick.named, text: contrast } : null;
}

/** One side of the "Why not?" comparison: a label, the fallacy and its short definition. */
function CompareSide({ label, id, actual = false }: { label: string; id: string; actual?: boolean }): JSX.Element {
  const shortDef = fallacyById.get(id)?.shortDef;
  return (
    <div class={cx('sheet__compare-side', actual && 'sheet__compare-side--actual')}>
      <dt>{label}</dt>
      <dd>
        <span class="sheet__compare-name">{fallacyName(id)}</span>
        {shortDef && <span class="sheet__compare-def">{shortDef}</span>}
      </dd>
    </div>
  );
}

interface SheetProps {
  item: Item;
  outcome: Outcome;
  pick: AnswerPick | null;
  isLast: boolean;
  onContinue: () => void;
  onOpenFallacy: (id: string) => void;
  continueLabel?: string;
}

export function FeedbackSheet({ item, outcome, pick, isLast, onContinue, onOpenFallacy, continueLabel }: SheetProps): JSX.Element {
  const actionsRef = useRef<HTMLSpanElement>(null);
  const copy = copyFor(item, outcome, pick);
  const why = whyNotFor(item, outcome, pick);

  useEffect(() => {
    actionsRef.current?.querySelector('button')?.focus({ preventScroll: true });
  }, [item.id]);

  return (
    <section class={cx('sheet', `sheet--${outcome}`)} role="status" aria-labelledby="sheet-title">
      <div class="sheet__inner">
        <div class="sheet__head">
          <span class="sheet__icon" aria-hidden="true">
            <Icon name={copy.icon} size={22} strokeWidth={3} />
          </span>
          <h2 id="sheet-title" class="sheet__title">
            {copy.title}
          </h2>
        </div>
        <p id="sheet-answer" class="sheet__answer">
          <span class="sheet__lead">{copy.lead} </span>
          {copy.nameId && (
            <button type="button" class="answer-link" onClick={() => onOpenFallacy(copy.nameId as string)} aria-haspopup="dialog">
              {fallacyName(copy.nameId)}
              <Icon name="arrow-right" size={16} />
            </button>
          )}
          {copy.after && <span class="sheet__after">{copy.after}</span>}
        </p>
        <p class="sheet__explanation">{item.explanation}</p>
        <p class="sr-only">Key phrase: “{item.cue}”.</p>
        {why && (
          <section class="sheet__why" aria-labelledby="sheet-why-title">
            <h3 id="sheet-why-title" class="sheet__why-q">
              Why not {fallacyName(why.id)}?
            </h3>
            <dl class="sheet__compare">
              {copy.nameId && <CompareSide label="The flaw here" id={copy.nameId} actual />}
              <CompareSide label="Your pick" id={why.id} />
            </dl>
            <p class="sheet__why-text">{why.text}</p>
          </section>
        )}
        <div class="sheet__actions">
          <span class="spark-anchor" ref={actionsRef}>
            {outcome === 'correct' && (
              <span class="spark" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <i key={n} style={{ '--n': String(n) }} />
                ))}
              </span>
            )}
            <Button
              variant="primary"
              size="lg"
              block
              kbd="Enter"
              iconRight="arrow-right"
              aria-describedby="sheet-title sheet-answer"
              onClick={onContinue}
            >
              {continueLabel ?? (isLast ? 'See results' : 'Continue')}
            </Button>
          </span>
        </div>
      </div>
    </section>
  );
}

export function FallacySheet({ fallacy, onClose }: { fallacy: Fallacy | null; onClose: () => void }): JSX.Element {
  return (
    <Dialog open={fallacy !== null} onClose={onClose} title={fallacy?.name ?? 'Fallacy'} variant="side">
      {fallacy && (
        <>
          <p class="sheet-fallacy__short">{fallacy.shortDef}</p>
          <FallacyInfo fallacy={fallacy} level={3} linkConfusables={false} />
        </>
      )}
    </Dialog>
  );
}
