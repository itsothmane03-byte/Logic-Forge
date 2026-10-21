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

/** "Why not X?": the picked look-alike when we have a contrast for it, else the item's whyNot. */
function whyNotFor(item: Item, outcome: Outcome, pick: AnswerPick | null): { id: string; text: string } | null {
  const truth = item.fallacyId ? fallacyById.get(item.fallacyId) : undefined;
  if (outcome === 'partial' && pick?.named && truth) {
    if (item.whyNot[pick.named]) return { id: pick.named, text: item.whyNot[pick.named] ?? '' };
    const contrast = truth.contrast[pick.named];
    if (contrast) return { id: pick.named, text: contrast };
  }
  const [id] = Object.keys(item.whyNot);
  return id ? { id, text: item.whyNot[id] ?? '' } : null;
}

interface SheetProps {
  item: Item;
  outcome: Outcome;
  pick: AnswerPick | null;
  isLast: boolean;
  onContinue: () => void;
  onOpenFallacy: (id: string) => void;
}

export function FeedbackSheet({ item, outcome, pick, isLast, onContinue, onOpenFallacy }: SheetProps): JSX.Element {
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
          <p class="sheet__why">
            <span class="sheet__why-q">
              Why not <strong>{fallacyName(why.id)}</strong>?
            </span>{' '}
            {why.text}
          </p>
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
              {isLast ? 'See results' : 'Continue'}
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
