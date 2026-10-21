// Session building blocks: progress segments, Spot buttons, Name options.

import type { JSX } from 'preact';
import type { Outcome } from '../../engine/types';
import { fallacyById, fallacyName } from '../../state/store';
import { cx } from '../util';
import { Icon } from './Icon';

const OUTCOME_LABEL: Record<Outcome, string> = { correct: 'correct', partial: 'partly right', wrong: 'missed' };

export function ProgressSegments({ total, outcomes, index }: { total: number; outcomes: readonly Outcome[]; index: number }): JSX.Element {
  return (
    <ol class="segments" aria-label="Session progress">
      {Array.from({ length: total }, (_, i) => {
        const outcome = outcomes[i];
        const current = !outcome && i === index;
        const label = outcome ? OUTCOME_LABEL[outcome] : current ? 'current' : 'not answered yet';
        return (
          <li key={i} class={cx('segment', outcome && `segment--${outcome}`, current && 'segment--current')}>
            <span class="sr-only">
              Question {i + 1}: {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function SpotButtons({ onSpot, disabled }: { onSpot: (choice: 'sound' | 'flawed') => void; disabled?: boolean }): JSX.Element {
  return (
    <div class="spot" role="group" aria-labelledby="spot-prompt">
      <button type="button" class="spot__btn spot__btn--sound" disabled={disabled} onClick={() => onSpot('sound')}>
        <span class="spot__icon">
          <Icon name="check" size={24} strokeWidth={2.5} />
        </span>
        <span class="spot__label">Sound</span>
        <kbd class="spot__kbd" aria-hidden="true">
          S
        </kbd>
      </button>
      <button type="button" class="spot__btn spot__btn--flawed" disabled={disabled} onClick={() => onSpot('flawed')}>
        <span class="spot__icon">
          <Icon name="crack" size={24} strokeWidth={2.2} />
        </span>
        <span class="spot__label">Flawed</span>
        <kbd class="spot__kbd" aria-hidden="true">
          F
        </kbd>
      </button>
    </div>
  );
}

export type OptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dim';

interface OptionGroupProps {
  options: readonly string[];
  selected: string | null;
  /** After checking: the true answer and the learner's pick. */
  answer?: { correctId: string; pickedId: string | null } | null;
  showDefinitions: boolean;
  labelledBy: string;
  onSelect: (id: string) => void;
}

function stateOf(id: string, selected: string | null, answer: OptionGroupProps['answer']): OptionState {
  if (answer) {
    if (id === answer.correctId) return 'correct';
    if (id === answer.pickedId) return 'wrong';
    return 'dim';
  }
  return id === selected ? 'selected' : 'idle';
}

export function OptionGroup({ options, selected, answer, showDefinitions, labelledBy, onSelect }: OptionGroupProps): JSX.Element {
  const locked = Boolean(answer);
  return (
    <div class={cx('options', locked && 'options--locked')} role="radiogroup" aria-labelledby={labelledBy}>
      {options.map((id, i) => {
        const state = stateOf(id, selected, answer);
        const fallacy = fallacyById.get(id);
        return (
          <label key={id} class={cx('option', `option--${state}`)}>
            <input
              class="option__input"
              type="radio"
              name="answer"
              value={id}
              data-index={i + 1}
              checked={selected === id}
              disabled={locked}
              onChange={() => onSelect(id)}
            />
            <span class="option__card">
              <span class="option__num" aria-hidden="true">
                {i + 1}
              </span>
              <span class="option__body">
                <span class="option__name">{fallacyName(id)}</span>
                {showDefinitions && fallacy && <span class="option__def">{fallacy.shortDef}</span>}
              </span>
              <span class="option__badge" aria-hidden="true">
                <Icon name={state === 'wrong' ? 'x' : 'check'} size={16} strokeWidth={3} />
              </span>
              {state === 'correct' && <span class="sr-only"> (correct answer)</span>}
              {state === 'wrong' && <span class="sr-only"> (your pick)</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}
