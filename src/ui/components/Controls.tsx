// Form controls: segmented control (native radios) and a switch (checkbox).

import type { JSX } from 'preact';
import { useId } from 'preact/hooks';
import { Icon, type IconName } from './Icon';

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string; icon?: IconName }>;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ label, value, options, onChange }: SegmentedProps<T>): JSX.Element {
  const name = useId();
  return (
    <fieldset class="segmented">
      <legend class="sr-only">{label}</legend>
      {options.map((option) => (
        <label key={option.value} class="segmented__option">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <span class="segmented__pill">
            {option.icon && <Icon name={option.icon} size={18} />}
            {option.label}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

interface SwitchProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Switch({ label, hint, checked, onChange }: SwitchProps): JSX.Element {
  const id = useId();
  return (
    <div class="switch-row">
      <label class="switch-row__text" for={id}>
        <span class="switch-row__label">{label}</span>
        {hint && <span class="switch-row__hint">{hint}</span>}
      </label>
      <input
        id={id}
        class="switch"
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange((event.currentTarget as HTMLInputElement).checked)}
      />
    </div>
  );
}
