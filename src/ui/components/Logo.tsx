// Brand mark. LogoMark redraws the brand anvil (public/brand/logomark_*.svg)
// inline, same geometry, so the check stroke follows the theme (the dark
// variant in dark mode) and the wordmark can use the display font.

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
      height={size * (228 / 340)}
      viewBox="92 160 340 228"
      {...a11y}
    >
      <rect x="107" y="174" width="298" height="62" rx="28" fill="#FF6B3D" />
      <polygon points="372,186 418,207 372,224" fill="#FF6B3D" />
      <rect x="206" y="238" width="100" height="38" rx="14" fill="#FF6B3D" />
      <polygon points="151,278 361,278 324,328 188,328" fill="#FF6B3D" />
      <polygon points="182,346 330,346 310,374 202,374" fill="#FF6B3D" />
      <path
        d="M 270 282 L 200 352 L 340 190"
        fill="none"
        stroke="currentColor"
        stroke-width="30"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}
