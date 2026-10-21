// Generated "spot the flaw" identity, redrawn as crisp vector geometry.
// Speech brackets form an eye; the diamond pupil follows the theme.

import type { JSX } from 'preact';

interface MarkProps {
  size?: number;
  class?: string;
  title?: string;
}

export function LogoMark({ size = 40, class: className, title }: MarkProps): JSX.Element {
  const a11y = title ? { role: 'img' as const, 'aria-label': title } : { 'aria-hidden': 'true' as const, focusable: 'false' };
  return (
    <svg
      class={className ? `logomark ${className}` : 'logomark'}
      width={size}
      height={size * (104 / 128)}
      viewBox="0 0 128 104"
      {...a11y}
    >
      <path d="M56 4Q60 1 60 7V29Q60 33 57 35L28 52L53 67H61Q63 67 65 69L73 78H48Q45 78 42 76L8 57Q5 55 5 51V46Q5 43 8 41Z" fill="#FF6B3D" />
      <path d="M65 26H88Q91 26 94 28L120 45Q123 47 123 51V57Q123 60 120 62L82 99Q78 103 78 97V77Q78 73 81 71L103 53L74 36Z" fill="#FF6B3D" />
      <rect x="55" y="44" width="18" height="18" rx="2" transform="rotate(45 64 53)" fill="currentColor" />
    </svg>
  );
}
