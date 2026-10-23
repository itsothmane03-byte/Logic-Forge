// The core loop: Spot -> (Name) -> Feedback -> next question -> Summary.

import type { JSX } from 'preact';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { dailyNumber } from '../../engine/daily';
import type { SessionState } from '../../engine/session';
import { navigate, replaceRoute, type PlayRoute } from '../../router';
import { check, currentItem, endSession, next, optionsFor, pickOption, session, spot, swapUnfamiliarExample, wouldLoseAnswers } from '../../state/session';
import { fallacyById, fallacyName, progress, showToast } from '../../state/store';
import { Button, IconButton } from '../components/Button';
import { ConfirmDialog } from '../components/Dialog';
import { FallacySheet, FeedbackSheet } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { PassageCard } from '../components/PassageCard';
import { QuestionReview, useQuestionReview } from '../components/QuestionReview';
import { OptionGroup, ProgressSegments, SpotButtons } from '../components/SessionParts';
import { isShortcutEvent, useKeydown } from '../hooks';
import { FORMAT_ICONS, FORMAT_LABELS } from '../util';
import '../styles/interests.css';

export function sessionTitle(state: Pick<SessionState, 'mode' | 'dateKey' | 'focusId'> | null, route?: PlayRoute): string {
  const mode = state?.mode ?? route?.mode;
  switch (mode) {
    case 'daily':
      return `Daily Forge #${dailyNumber(state?.dateKey ?? '')}`;
    case 'focus': {
      const id = state?.focusId ?? (route && route.mode === 'focus' ? route.fallacyId : '');
      return `Focus · ${fallacyName(id ?? '')}`;
    }
    case 'review':
      return 'Review mistakes';
    case 'demo':
      return 'Try one';
    default:
      return 'Practice';
  }
}

const isControl = (target: EventTarget | null) =>
  target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement || target instanceof HTMLTextAreaElement;

/** Keeps --dock-h in sync with the fixed bottom bar / feedback sheet height. */
function useDockHeight(ref: { current: HTMLElement | null }, deps: unknown[]): void {
  useLayoutEffect(() => {
    const el = ref.current;
    const root = document.documentElement;
    if (!el) return undefined;
    const apply = () => root.style.setProperty('--dock-h', `${Math.ceil(el.getBoundingClientRect().height)}px`);
    apply();
    if (typeof ResizeObserver !== 'function') return undefined;
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, deps);
  useEffect(() => () => document.documentElement.style.removeProperty('--dock-h'), []);
}

export function SessionScreen({ route }: { route: PlayRoute }): JSX.Element {
  const live = session.value;
  const review = useQuestionReview(live?.index ?? 0, live?.itemIds);
  const reviewedPick = live?.picks[review.index];
  const state: SessionState | null = live && review.reviewing ? {
    ...live, index: review.index, phase: 'feedback',
    spot: reviewedPick?.spot ?? null, selected: reviewedPick?.named ?? null,
  } : live;
  const settings = progress.value.settings;
  const [swapHelpOpen, setSwapHelpOpen] = useState(false);
  const item = currentItem(state);
  const [sheetFallacyId, setSheetFallacyId] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const namePromptRef = useRef<HTMLHeadingElement>(null);
  const nameStepRef = useRef<HTMLElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const phase = state?.phase ?? 'spot';
  const options = useMemo(() => (state && item && !item.isSound ? optionsFor(state, item) : []), [state?.seed, item?.id]);
  useDockHeight(dockRef, [phase, item?.id]);

  // New question: announce it by focusing the (visually hidden) heading.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (phase === 'spot' || review.reviewing) headingRef.current?.focus({ preventScroll: true });
  }, [item?.id]);

  useEffect(() => {
    if (review.reviewing) {
      window.scrollTo(0, 0);
      return;
    }
    if (phase === 'name') {
      namePromptRef.current?.focus({ preventScroll: true });
      // On small screens the options start below the fold: bring them up.
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      nameStepRef.current?.scrollIntoView?.({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }
    if (phase === 'feedback') {
      const mark = bodyRef.current?.querySelector('mark.cue');
      if (mark && typeof mark.scrollIntoView === 'function') mark.scrollIntoView({ block: 'nearest' });
    }
    if (phase === 'spot' && state && state.index > 0) window.scrollTo(0, 0);
  }, [phase, item?.id]);

  const onContinue = () => {
    if (review.reviewing) {
      review.returnToCurrent();
      return;
    }
    const mode = state?.mode;
    const result = next();
    if (result !== 'finished') return;
    if (mode === 'demo') {
      endSession();
      showToast("That's the whole loop. Today's forge is ready when you are.", 4200);
      replaceRoute('#/');
    } else {
      replaceRoute('#/summary');
    }
  };

  const leave = () => {
    const focusId = state?.focusId;
    setConfirmLeave(false);
    endSession();
    replaceRoute(focusId ? `#/library/${focusId}` : '#/');
  };

  const requestClose = () => {
    if (wouldLoseAnswers()) setConfirmLeave(true);
    else leave();
  };

  useKeydown((event) => {
    if (!state || !item || sheetFallacyId || confirmLeave || !isShortcutEvent(event)) return;
    const key = event.key.toLowerCase();
    if (phase === 'spot' && (key === 's' || key === 'f')) {
      event.preventDefault();
      spot(key === 's' ? 'sound' : 'flawed');
    } else if (phase === 'name' && /^[1-4]$/.test(event.key)) {
      const id = options[Number(event.key) - 1];
      if (!id) return;
      event.preventDefault();
      pickOption(id);
      requestAnimationFrame(() => {
        bodyRef.current?.querySelector<HTMLInputElement>(`input[data-index="${event.key}"]`)?.focus();
      });
    } else if (phase === 'name' && event.key === 'Enter' && !isControl(event.target)) {
      if (!state.selected) return;
      event.preventDefault();
      check();
    } else if (phase === 'feedback' && event.key === 'Enter' && !isControl(event.target)) {
      event.preventDefault();
      onContinue();
    }
  });

  if (!state || state.finished || !item) {
    return <div class="session session--empty" aria-busy="true" />;
  }

  const total = state.itemIds.length;
  const number = Math.min(state.index + 1, total);
  const title = sessionTitle(state, route);
  const outcome = phase === 'feedback' ? state.outcomes[state.index] : undefined;
  const pick = phase === 'feedback' ? (state.picks[state.index] ?? null) : null;
  const showOptions = !item.isSound && (phase === 'name' || (phase === 'feedback' && pick?.spot === 'flawed'));
  const answer = phase === 'feedback' && item.fallacyId ? { correctId: item.fallacyId, pickedId: pick?.named ?? null } : null;
  const closeLabel = state.mode === 'daily' ? 'Close (your progress is saved)' : 'Close session';

  return (
    <div class={`session session--${phase}`}>
      <header class="session-top">
        <div class="session-top__inner">
          <IconButton icon="x" label={closeLabel} class="session-top__close" onClick={requestClose} />
          <ProgressSegments total={total} outcomes={state.outcomes} index={live?.index ?? state.index} />
          <span class="session-top__count" aria-hidden="true">
            {number} / {total}
          </span>
        </div>
      </header>

      <div class="session-body" ref={bodyRef} data-item-id={item.id}>
        <h1 class="sr-only" ref={headingRef} tabIndex={-1}>
          {title}: question {number} of {total}
        </h1>
        <QuestionReview review={review} currentIndex={live?.index ?? 0} total={total} />
        {review.reviewing && <p class="question-review__answer">{pick
          ? `Your answer: ${pick.spot === 'sound' ? 'Sound' : 'Flawed'}${pick.named ? ` · ${fallacyName(pick.named)}` : ''}.`
          : 'Your result is saved; the original choice is unavailable after reopening this set.'}</p>}
        <p class="session-eyebrow">
          <span class="session-eyebrow__mode">{title}</span>
          <span class="session-eyebrow__format">
            <Icon name={FORMAT_ICONS[item.format]} size={16} />
            {FORMAT_LABELS[item.format]}
          </span>
        </p>

        <PassageCard item={item} highlight={phase === 'feedback'} />

        {phase === 'spot' && (state.mode === 'practice' || state.mode === 'focus') && (
          <details class="unfamiliar-topic" open={swapHelpOpen} onToggle={(event) => setSwapHelpOpen(event.currentTarget.open)}>
            <summary>Unfamiliar topic?</summary>
            <p>Your score stays the same.</p>
            <Button variant="ghost" size="sm" onClick={() => {
              const result = swapUnfamiliarExample();
              setSwapHelpOpen(false);
              if (result === 'changed') showToast('Another example. Your score is unchanged.');
              else if (result === 'unavailable') showToast('No more examples are available in this set. You can leave and start another.');
            }}>Show another</Button>
          </details>
        )}

        {showOptions && (
          <section class="name-step" aria-labelledby="name-prompt" ref={nameStepRef}>
            <h2 id="name-prompt" class="step-prompt" ref={namePromptRef} tabIndex={-1}>
              {phase === 'name' ? 'Which fallacy?' : 'Your answer'}
            </h2>
            <OptionGroup
              options={options}
              selected={state.selected}
              answer={answer}
              showDefinitions={settings.showDefinitions}
              labelledBy="name-prompt"
              onSelect={pickOption}
            />
          </section>
        )}
      </div>

      <div class="dock" ref={dockRef}>
        {phase === 'spot' && (
          <div class="action-bar">
            <div class="action-bar__inner">
              <p id="spot-prompt" class="step-prompt step-prompt--bar">
                Is the reasoning sound?
              </p>
              <SpotButtons onSpot={spot} />
            </div>
          </div>
        )}
        {phase === 'name' && (
          <div class="action-bar">
            <div class="action-bar__inner action-bar__inner--check">
              <p class="action-bar__hint" aria-hidden="true">
                Pick one, then check.
              </p>
              <Button variant="primary" size="lg" block disabled={!state.selected} kbd="Enter" onClick={check}>
                Check
              </Button>
            </div>
          </div>
        )}
        {phase === 'feedback' && outcome && (
          <FeedbackSheet
            item={item}
            outcome={outcome}
            pick={pick}
            isLast={state.index >= total - 1}
            onContinue={review.reviewing ? review.returnToCurrent : onContinue}
            continueLabel={review.reviewing ? 'Return to current' : undefined}
            onOpenFallacy={setSheetFallacyId}
          />
        )}
      </div>

      <FallacySheet fallacy={sheetFallacyId ? (fallacyById.get(sheetFallacyId) ?? null) : null} onClose={() => setSheetFallacyId(null)} />
      <ConfirmDialog
        open={confirmLeave}
        title="Leave this set?"
        message="Your answers so far still count toward mastery, but this set of questions will end."
        confirmLabel="Leave set"
        cancelLabel="Keep going"
        onConfirm={leave}
        onCancel={() => setConfirmLeave(false)}
      />
    </div>
  );
}

/** Where to send people when a play route can't start. */
export function playFallback(status: string, focusId?: string): void {
  if (status === 'review-empty') {
    showToast('No mistakes to review right now. Nice work.');
    replaceRoute('#/');
  } else if (status === 'unknown-fallacy') {
    replaceRoute('#/library');
  } else if (status === 'no-items') {
    showToast('No questions are available yet.');
    replaceRoute(focusId ? `#/library/${focusId}` : '#/');
  } else {
    navigate('#/');
  }
}
