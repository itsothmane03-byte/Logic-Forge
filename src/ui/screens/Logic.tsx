import type { JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { logicExamples, logicVerdict, type LogicItem, type LogicVerdict } from '../../engine/logic';
import { checkLogic, logicSession, nextLogic, retryLogicMisses, selectLogicVerdict, startLogic } from '../../state/logic';
import { storageOk } from '../../state/store';
import { Button, ButtonLink } from '../components/Button';
import { Icon } from '../components/Icon';
import { ProgressSegments } from '../components/SessionParts';
import { isShortcutEvent, useKeydown } from '../hooks';
import { cx } from '../util';

const choices: Array<{ value: LogicVerdict; label: string }> = [
  { value: 'must', label: 'Must be true' },
  { value: 'cannot', label: 'Must be false' },
  { value: 'possible', label: 'Could be either' },
];

function labelFor(value: LogicVerdict): string {
  return choices.find((choice) => choice.value === value)!.label;
}

function Examples({ item }: { item: LogicItem }): JSX.Element {
  const examples = logicExamples(item);
  return (
    <details class="activity-details logic-examples">
      <summary>{examples.whenTrue && examples.whenFalse ? 'See two situations that fit' : 'See a situation that fits'}</summary>
      <p>Every given fact holds in each example below.</p>
      <div class="logic-examples__grid">
        {([['Claim true', examples.whenTrue], ['Claim false', examples.whenFalse]] as const).map(([title, values]) => values && (
          <section key={title} class="logic-example" aria-label={title}>
            <h3>{title}</h3>
            <dl>{Object.entries(item.atoms).map(([id, text]) => (
              <div key={id}><dt>{text}</dt><dd>{values[id] ? 'True' : 'False'}</dd></div>
            ))}</dl>
          </section>
        ))}
      </div>
      <p class="logic-lesson">{item.lesson}</p>
    </details>
  );
}

export function LogicScreen(): JSX.Element {
  const state = logicSession.value;
  const item = state?.items[state.index];
  const headingRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const active = logicSession.peek();
    if (!active || active.finished) startLogic();
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
      event.preventDefault();
      selectLogicVerdict(choices[Number(event.key) - 1]!.value);
      document.querySelector<HTMLInputElement>(`input[data-logic-index="${event.key}"]`)?.focus();
    } else if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)
      && !(event.target instanceof HTMLAnchorElement) && !(event.target instanceof HTMLElement && event.target.closest('summary'))) {
      event.preventDefault();
      if (state.checked) nextLogic();
      else checkLogic();
    }
  });

  if (!state) return <div class="repair-session" aria-busy="true" />;
  const total = state.items.length;
  const score = state.answers.filter((answer) => answer.correct).length;
  if (state.finished || !item) {
    return (
      <div class="page page--narrow repair-result">
        <span class="repair-result__icon" aria-hidden="true"><Icon name="layers" size={40} /></span>
        <p class="eyebrow">What follows?</p>
        <h1 class="page-title" ref={headingRef} tabIndex={-1}>Set complete.</h1>
        <p class="repair-result__score">{score}<span> / {total}</span></p>
        <p class="lead">You practiced separating what is certain from what is only possible.</p>
        <div class="repair-result__actions">
          {score < total && <Button variant="primary" icon="repeat" onClick={retryLogicMisses}>Retry missed puzzles</Button>}
          <Button variant={score < total ? 'secondary' : 'primary'} icon="refresh" onClick={() => startLogic()}>Try another set</Button>
          <ButtonLink href="#/practice" variant="secondary">Back to practice</ButtonLink>
        </div>
        <ButtonLink href="#/progress" variant="ghost" iconRight="arrow-right">See your progress</ButtonLink>
      </div>
    );
  }
  const answer = state.checked ? logicVerdict(item) : null;
  const correct = answer === state.selected;

  return (
    <div class="repair-session logic-session">
      <header class="repair-top">
        <ButtonLink href="#/practice" variant="ghost" icon="arrow-left" size="sm">Practice</ButtonLink>
        <ProgressSegments total={total} outcomes={state.answers.map((outcome) => outcome.correct ? 'correct' : 'wrong')} index={state.index} />
        <span class="repair-top__count">{state.index + 1} / {total}</span>
      </header>
      <div class="repair-body" data-logic-id={item.id}>
        <p class="eyebrow">What follows?</p>
        <h1 class="repair-heading" ref={headingRef} tabIndex={-1}>{item.title}</h1>
        <p class="logic-rule">Treat the facts as true. Use only those facts.</p>
        <section class="logic-facts" aria-labelledby="logic-facts-title">
          <h2 id="logic-facts-title">Given facts</h2>
          <ol>{item.premises.map((premise, index) => <li key={index}>{premise.text}</li>)}</ol>
        </section>
        <section class="logic-claim" aria-labelledby="logic-claim-title">
          <h2 id="logic-claim-title">The claim</h2>
          <p>{item.claim.text}</p>
        </section>
        <h2 class="step-prompt" id="logic-prompt">What can you conclude?</h2>
        <details class="activity-details logic-help" key={item.id}>
          <summary>How to answer</summary>
          <ul>
            <li><strong>Must be true:</strong> true in every situation that fits the facts.</li>
            <li><strong>Must be false:</strong> false in every situation that fits the facts.</li>
            <li><strong>Could be either:</strong> the facts allow it to be true or false.</li>
          </ul>
          <p>“Could be either” does not mean both are equally likely.</p>
        </details>
        <div class={cx('options repair-options logic-options', state.checked && 'options--locked')} role="radiogroup" aria-labelledby="logic-prompt">
          {choices.map((choice, index) => {
            const status = state.checked
              ? choice.value === answer ? 'correct' : choice.value === state.selected ? 'wrong' : 'dim'
              : choice.value === state.selected ? 'selected' : 'idle';
            return (
              <label class={cx('option', `option--${status}`)} key={choice.value}>
                <input class="option__input" type="radio" name="logic-answer" value={choice.value}
                  data-logic-index={index + 1} checked={state.selected === choice.value} disabled={state.checked}
                  onChange={() => selectLogicVerdict(choice.value)} />
                <span class="option__card">
                  <span class="option__num" aria-hidden="true">{index + 1}</span>
                  <span class="option__body repair-option__text">{choice.label}</span>
                  <span class="option__badge" aria-hidden="true"><Icon name={status === 'wrong' ? 'x' : 'check'} size={16} /></span>
                  {state.checked && choice.value === answer && <span class="sr-only"> (correct answer)</span>}
                  {state.checked && choice.value === state.selected && <span class="sr-only"> (your choice)</span>}
                </span>
              </label>
            );
          })}
        </div>
        {!state.checked && <Button variant="primary" size="lg" block kbd="Enter" disabled={!state.selected} onClick={checkLogic}>Check my answer</Button>}
        {state.checked && answer && state.selected && (
          <div class={cx('repair-feedback', correct ? 'repair-feedback--correct' : 'repair-feedback--wrong')}
            role="status" ref={feedbackRef} tabIndex={-1} aria-labelledby="logic-feedback-title">
            <h2 id="logic-feedback-title"><Icon name={correct ? 'check' : 'refresh'} size={22} />{correct ? 'That’s right.' : labelFor(answer)}</h2>
            {!correct && <p class="logic-choice">Your choice: {labelFor(state.selected)}.</p>}
            <p>{item.explanation}</p>
            <Examples key={item.id} item={item} />
            <Button variant="primary" size="lg" block kbd="Enter" onClick={nextLogic}>{state.index === total - 1 ? 'See results' : 'Next puzzle'}</Button>
          </div>
        )}
        {!storageOk.value && <p class="repair-save-notice" role="status">You can keep practicing. This browser could not save your latest progress.</p>}
        <p class="repair-footnote">Checked answers save as you go. Use 1–3 to choose and Enter to continue.</p>
      </div>
    </div>
  );
}
