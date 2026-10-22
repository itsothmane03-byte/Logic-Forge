import type { JSX } from 'preact';
import { useEffect, useMemo, useRef } from 'preact/hooks';
import { repairOptions } from '../../engine/repair';
import { checkRepair, nextRepair, repairSession, selectRepairOption, startRepair } from '../../state/repair';
import { fallacyName, storageOk } from '../../state/store';
import { Button, ButtonLink } from '../components/Button';
import { Icon } from '../components/Icon';
import { ProgressSegments } from '../components/SessionParts';
import { isShortcutEvent, useKeydown } from '../hooks';
import { cx } from '../util';

export function RepairScreen(): JSX.Element {
  const state = repairSession.value;
  const item = state?.items[state.index];
  const options = useMemo(() => item && state ? repairOptions(item, state.seed) : [], [item?.id, state?.seed]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const active = repairSession.peek();
    if (!active || active.finished) startRepair();
  }, []);

  useEffect(() => {
    if (!state) return;
    if (state.checked && !state.finished) {
      feedbackRef.current?.focus({ preventScroll: true });
      feedbackRef.current?.scrollIntoView?.({ block: 'nearest' });
    } else {
      headingRef.current?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }, [item?.id, state?.checked, state?.finished]);

  useKeydown((event) => {
    if (!state || !item || state.finished || !isShortcutEvent(event)) return;
    if (!state.checked && /^[1-3]$/.test(event.key)) {
      const option = options[Number(event.key) - 1];
      if (!option) return;
      event.preventDefault();
      selectRepairOption(option.id);
      document.querySelector<HTMLInputElement>(`input[data-repair-index="${event.key}"]`)?.focus();
    } else if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)
      && !(event.target instanceof HTMLAnchorElement)) {
      event.preventDefault();
      if (state.checked) nextRepair();
      else checkRepair();
    }
  });

  if (!state) return <div class="repair-session" aria-busy="true" />;
  const total = state.items.length;
  const score = state.answers.filter((answer) => answer.correct).length;
  if (state.finished || !item) {
    return (
      <div class="page page--narrow repair-result">
        <span class="repair-result__icon" aria-hidden="true"><Icon name="scale" size={40} /></span>
        <p class="eyebrow">Fix the argument</p>
        <h1 class="page-title" ref={headingRef} tabIndex={-1}>{total ? 'A little more thoughtful.' : 'More exercises soon.'}</h1>
        {total > 0 && <p class="repair-result__score">{score}<span> / {total}</span></p>}
        <p class="lead">{total ? 'You practiced choosing evidence, checking assumptions, and making fairer claims.' : 'Visit the library while we prepare the next set.'}</p>
        <p>Your repair scores are saved separately from quiz mastery.</p>
        <div class="repair-result__actions">
          <Button variant="primary" icon="refresh" onClick={() => startRepair()}>Try another set</Button>
          <ButtonLink href="#/practice" variant="secondary">Back to practice</ButtonLink>
        </div>
        <ButtonLink href="#/progress" variant="ghost" iconRight="arrow-right">See your progress</ButtonLink>
      </div>
    );
  }
  const selected = options.find((option) => option.id === state.selected);
  const correct = options.find((option) => option.correct);

  return (
    <div class="repair-session">
      <header class="repair-top">
        <ButtonLink href="#/practice" variant="ghost" icon="arrow-left" size="sm">Practice</ButtonLink>
        <ProgressSegments total={total} outcomes={state.answers.map((answer) => answer.correct ? 'correct' : 'wrong')} index={state.index} />
        <span class="repair-top__count">{state.index + 1} / {total}</span>
      </header>
      <div class="repair-body" data-repair-id={item.id}>
        <p class="eyebrow">Fix the argument</p>
        <h1 class="repair-heading" ref={headingRef} tabIndex={-1}>{item.title}</h1>
        <section class="repair-original" aria-labelledby="original-title">
          <h2 id="original-title">The original argument</h2>
          <p>{item.passage}</p>
          <span class="repair-original__source">Fictional example</span>
        </section>
        <h2 class="step-prompt" id="repair-prompt">Which revision best fixes the reasoning?</h2>
        <p class="repair-hint">Choose one, then check. A stronger argument may still need more evidence.</p>
        <div class={cx('options repair-options', state.checked && 'options--locked')} role="radiogroup" aria-labelledby="repair-prompt">
          {options.map((option, index) => {
            const status = state.checked
              ? option.correct ? 'correct' : option.id === state.selected ? 'wrong' : 'dim'
              : option.id === state.selected ? 'selected' : 'idle';
            return (
              <label class={cx('option', `option--${status}`)} key={option.id}>
                <input class="option__input" type="radio" name="repair-answer" value={option.id}
                  data-repair-index={index + 1} checked={state.selected === option.id} disabled={state.checked}
                  onChange={() => selectRepairOption(option.id)} />
                <span class="option__card">
                  <span class="option__num" aria-hidden="true">{index + 1}</span>
                  <span class="option__body repair-option__text">{option.text}</span>
                  <span class="option__badge" aria-hidden="true"><Icon name={status === 'wrong' ? 'x' : 'check'} size={16} /></span>
                  {state.checked && option.correct && <span class="sr-only"> (best repair)</span>}
                  {state.checked && option.id === state.selected && <span class="sr-only"> (your choice)</span>}
                </span>
              </label>
            );
          })}
        </div>
        {!state.checked && <Button variant="primary" size="lg" block kbd="Enter" disabled={!selected} onClick={checkRepair}>Check my revision</Button>}
        {state.checked && selected && (
          <div class={cx('repair-feedback', selected.correct ? 'repair-feedback--correct' : 'repair-feedback--wrong')}
            role="status" ref={feedbackRef} tabIndex={-1} aria-labelledby="repair-feedback-title">
            <h2 id="repair-feedback-title"><Icon name={selected.correct ? 'check' : 'refresh'} size={22} />{selected.correct ? 'That makes it stronger.' : 'This still leaves a problem.'}</h2>
            <p>{selected.explanation}</p>
            {!selected.correct && correct && <div class="repair-feedback__better"><h3>A stronger revision</h3><p>{correct.text}</p><p>{correct.explanation}</p></div>}
            <p class="repair-feedback__principle">{item.principle}</p>
            <a class="text-link" href={`#/library/${item.fallacyId}`}>Explore {fallacyName(item.fallacyId)} <Icon name="arrow-right" size={16} /></a>
            <Button variant="primary" size="lg" block kbd="Enter" onClick={nextRepair}>{state.index === total - 1 ? 'See results' : 'Next argument'}</Button>
          </div>
        )}
        {!storageOk.value && <p class="repair-save-notice" role="status">You can keep practicing. This browser could not save your latest progress.</p>}
        <p class="repair-footnote">Checked answers save as you go. Use 1–3 to choose and Enter to continue.</p>
      </div>
    </div>
  );
}
