// Hand-written 24x24 stroke icons. Decorative by default (aria-hidden).

import type { JSX } from 'preact';

const STROKE: Record<string, string> = {
  check: 'M4.5 12.5l5 5L19.5 7',
  x: 'M6 6l12 12M18 6 6 18',
  crack: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM13.2 3.1 10.4 9l3.6 2.6-3.1 4.1 1.4 5.2',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4',
  moon: 'M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6z',
  monitor: 'M4 4.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1zM8.5 20h7M12 16v4',
  home: 'M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 11.5v1',
  book: 'M12 6.6C10.4 5.3 8.4 4.5 6 4.5H3v14h3c2.4 0 4.4.8 6 2 1.6-1.2 3.6-2 6-2h3v-14h-3c-2.4 0-4.4.8-6 2.1zM12 6.6v13.9',
  chart: 'M3.5 20h17M6.5 20v-7M12 20V5M17.5 20v-10',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5.5M12 7.6v.4',
  search: 'M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4.3-4.3',
  'arrow-right': 'M5 12h14M13 6l6 6-6 6',
  'arrow-left': 'M19 12H5M11 6l-6 6 6 6',
  'chevron-down': 'M6 9l6 6 6-6',
  'chevron-right': 'M9 6l6 6-6 6',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  share: 'M12 3.5v11M7.5 8 12 3.5 16.5 8M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6',
  copy: 'M9 8h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3',
  download: 'M12 4v11M7 10.5l5 5 5-5M5 20h14',
  upload: 'M12 15.5V4.5M7 9l5-5 5 5M5 20h14',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  refresh: 'M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4',
  at: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.6 7.2',
  mail: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3.5 6.5 12 13l8.5-6.5',
  chat: 'M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-5 4v-4H5A1.5 1.5 0 0 1 3.5 15V6A1.5 1.5 0 0 1 5 4.5z',
  news: 'M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M7.5 9h6M7.5 12.5h6M7.5 16h4',
  megaphone: 'M3.5 9.5v5h3l7 4v-13l-7 4zM17 9a4 4 0 0 1 0 6M19.5 6.5a7.5 7.5 0 0 1 0 11',
  mic: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7',
  quote: 'M9.5 7H6a1.5 1.5 0 0 0-1.5 1.5v3A1.5 1.5 0 0 0 6 13h2.5v.5A2.5 2.5 0 0 1 6 16M19.5 7H16a1.5 1.5 0 0 0-1.5 1.5v3A1.5 1.5 0 0 0 16 13h2.5v.5A2.5 2.5 0 0 1 16 16',
  heart: 'M12 19.5s-7-4.3-7-9.7A3.8 3.8 0 0 1 12 7.6a3.8 3.8 0 0 1 7 2.2c0 5.4-7 9.7-7 9.7z',
  repeat: 'M17 3.5 20 6.5l-3 3M4 11.5v-2a3 3 0 0 1 3-3h13M7 20.5l-3-3 3-3M20 12.5v2a3 3 0 0 1-3 3H4',
  reply: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 6 6v4',
  shield: 'M12 3l7.5 3v5.5c0 4.4-3.1 8.2-7.5 9.5-4.4-1.3-7.5-5.1-7.5-9.5V6zM8.8 12.2l2.2 2.2 4.3-4.6',
  phone: 'M8 2.5h8a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V4A1.5 1.5 0 0 1 8 2.5zM12 7.5v6M9.5 11l2.5 2.5 2.5-2.5M11 18h2',
  code: 'M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15',
  layers: 'M12 3.5 3 8l9 4.5L21 8zM3 12.5 12 17l9-4.5M3 16.5 12 21l9-4.5',
  calendar: 'M4 5.5h16a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1zM3 10h18M8 3v4M16 3v4',
  keyboard: 'M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M7.5 14h9',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z',
  scale: 'M12 4v16M8 20h8M5 7.5h14M5 7.5 2.5 13a2.5 2.5 0 0 0 5 0zM19 7.5 16.5 13a2.5 2.5 0 0 0 5 0zM12 4l-1 1.5h2z',
  swap: 'M7 7.5h13M16.5 4 20 7.5 16.5 11M17 16.5H4M7.5 13 4 16.5 7.5 20',
  sparkle: 'M12 3.5 13.6 9 19 10.5 13.6 12 12 17.5 10.4 12 5 10.5 10.4 9z',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5V12l3 2',
  dash: 'M6 12h12',
  minus: 'M5 12h14',
  plus: 'M12 5v14M5 12h14',
};

const FILLED: Record<string, string> = {
  flame: 'M12.3 2.5c.4 2.7 2.1 4.2 3.6 6 1.4 1.6 2.6 3.4 2.6 6A6.5 6.5 0 0 1 12 21a6.5 6.5 0 0 1-6.5-6.5c0-2.4 1.2-4.1 2.4-5.4.2 1.4.8 2.4 1.8 3 .2-3.6 1.2-6.6 2.6-9.6zm-.2 10.6c-1.2 1.2-2.1 2.4-2.1 3.9a2 2 0 0 0 4 0c0-1.5-.8-2.7-1.9-3.9z',
  star: 'M12 3.4l2.6 5.4 5.9.8-4.3 4.2 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.2 5.9-.8z',
  spark: 'M12 2l1.9 6.6L20.5 10.5l-6.6 1.9L12 19l-1.9-6.6L3.5 10.5l6.6-1.9z',
  dot: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
};

export type IconName = keyof typeof STROKE | keyof typeof FILLED;

interface IconProps {
  name: IconName;
  size?: number;
  class?: string;
  /** When set, the icon is announced with this label instead of hidden. */
  label?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, class: className, label, strokeWidth = 2 }: IconProps): JSX.Element {
  const filled = name in FILLED;
  const d = filled ? FILLED[name] : STROKE[name];
  const a11y = label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': 'true' as const, focusable: 'false' };
  return (
    <svg
      class={className ? `icon ${className}` : 'icon'}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      stroke-width={strokeWidth}
      stroke-linecap="round"
      stroke-linejoin="round"
      {...a11y}
    >
      <path d={d} />
    </svg>
  );
}
