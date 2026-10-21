// Small presentational pieces shared across screens.

import type { ComponentChildren, JSX } from 'preact';
import { masteryPercent } from '../../engine/mastery';
import type { Box, FamilyId, Level } from '../../engine/types';
import { familyById } from '../../state/store';
import { cx, LEVEL_LABELS } from '../util';
import { Icon } from './Icon';

interface RevealProps {
  index?: number;
  as?: 'div' | 'section' | 'li' | 'article';
  class?: string;
  id?: string;
  'aria-labelledby'?: string;
  children?: ComponentChildren;
}

/**
 * Wrapper for scroll reveals. `index` staggers siblings (max 4 steps).
 * The class list stays static so re-renders never drop `.is-revealed`.
 */
export function Reveal({ index = 0, as: Tag = 'div', class: className, children, ...rest }: RevealProps): JSX.Element {
  return (
    <Tag data-reveal="" class={className} style={{ '--reveal-i': String(index) }} {...rest}>
      {children}
    </Tag>
  );
}

export function FamilyDot({ family, label = false }: { family: FamilyId; label?: boolean }): JSX.Element {
  const name = familyById.get(family)?.label ?? family;
  return (
    <span class={cx('family-dot-wrap', label && 'family-dot-wrap--label')}>
      <span class={`family-dot family-dot--${family}`} aria-hidden="true" />
      {label ? <span class="family-dot__label">{name}</span> : <span class="sr-only">{name}</span>}
    </span>
  );
}

export function LevelTag({ level }: { level: Level }): JSX.Element {
  return (
    <span class={`tag tag--level tag--${level}`}>
      <span class="tag__bars" aria-hidden="true">
        <i />
        <i class={level !== 'beginner' ? 'on' : ''} />
        <i class={level === 'advanced' ? 'on' : ''} />
      </span>
      {LEVEL_LABELS[level]}
    </span>
  );
}

/** Mastery bar with its value as text (never conveyed by the bar alone). */
export function MasteryBar({
  box,
  practiced,
  compact = false,
  label,
}: {
  box: Box | undefined;
  practiced: boolean;
  compact?: boolean;
  label?: string;
}): JSX.Element {
  const percent = masteryPercent(box);
  const text = practiced ? `${percent}%` : 'New';
  return (
    <div class={cx('mastery', compact && 'mastery--compact', !practiced && 'mastery--new')}>
      <div
        class="mastery__track"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={practiced ? `${percent}% mastered` : 'Not practiced yet'}
        aria-label={label ?? 'Mastery'}
      >
        <span class="mastery__fill" style={{ width: `${practiced ? Math.max(percent, 4) : 0}%` }} />
      </div>
      <span class="mastery__text" aria-hidden="true">
        {text}
      </span>
    </div>
  );
}

export function StreakChip({ days }: { days: number }): JSX.Element | null {
  if (days <= 0) return null;
  return (
    <span class="streak-chip">
      <Icon name="flame" size={18} />
      <span>{days}-day streak</span>
    </span>
  );
}
