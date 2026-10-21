// Small hand-rolled charts: score ring, practice heatmap, accuracy sparkline.

import type { JSX } from 'preact';
import type { HeatCell } from '../../engine/stats';
import { shortDate } from '../../engine/dates';
import { cx } from '../util';

export function ProgressRing({ value, total, size = 168 }: { value: number; total: number; size?: number }): JSX.Element {
  const r = 52;
  const c = 2 * Math.PI * r;
  const fraction = total > 0 ? value / total : 0;
  return (
    <div class="ring" style={{ width: `${size}px`, height: `${size}px` }} role="img" aria-label={`Score: ${value} out of ${total}`}>
      <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
        <circle class="ring__track" cx="60" cy="60" r={r} />
        <circle
          class="ring__value"
          cx="60"
          cy="60"
          r={r}
          stroke-dasharray={`${c} ${c}`}
          stroke-dashoffset={c * (1 - fraction)}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <span class="ring__label" aria-hidden="true">
        <span class="ring__value-text">{value}</span>
        <span class="ring__total"> / {total}</span>
      </span>
    </div>
  );
}

export function Heatmap({ columns }: { columns: HeatCell[][] }): JSX.Element {
  const months: Array<{ col: number; label: string }> = [];
  columns.forEach((column, i) => {
    const first = column[0];
    if (!first) return;
    const label = shortDate(first.key).split(' ')[0] ?? '';
    const prev = months[months.length - 1];
    if (!prev || prev.label !== label) months.push({ col: i, label });
  });
  return (
    <div class="heatmap">
      <div class="heatmap__months" aria-hidden="true" style={{ '--cols': String(columns.length) }}>
        {months
          .filter((m, i) => i > 0 || m.col < columns.length - 2)
          .map((m) => (
            <span key={`${m.col}-${m.label}`} style={{ gridColumnStart: String(m.col + 1) }}>
              {m.label}
            </span>
          ))}
      </div>
      <div class="heatmap__grid" role="group" aria-label={`Practice days, last ${columns.length} weeks`} style={{ '--cols': String(columns.length) }}>
        {columns.map((column, ci) => (
          <div class="heatmap__col" key={ci}>
            {column.map((cell) =>
              cell.future ? (
                <span key={cell.key} class="heat heat--future" aria-hidden="true" />
              ) : (
                <span key={cell.key} class={cx('heat', `heat--${cell.level}`)} role="img" aria-label={cell.label} title={cell.label} />
              ),
            )}
          </div>
        ))}
      </div>
      <div class="heatmap__legend" aria-hidden="true">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span key={level} class={`heat heat--${level}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

export function Sparkline({ values }: { values: readonly number[] }): JSX.Element {
  const w = 320;
  const h = 72;
  const pad = 6;
  if (values.length === 0) {
    return (
      <svg class="sparkline sparkline--empty" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <line x1={pad} x2={w - pad} y1={h / 2} y2={h / 2} />
      </svg>
    );
  }
  const step = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0;
  const y = (v: number) => pad + (h - pad * 2) * (1 - v / 100);
  const points = values.map((v, i) => [values.length > 1 ? pad + i * step : w / 2, y(v)] as const);
  const line = points.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
  const first = points[0];
  const last = points[points.length - 1];
  const area = first && last ? `M${first[0]},${h - pad} L${line.replace(/ /g, ' L')} L${last[0]},${h - pad} Z` : '';
  return (
    <svg class="sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <line class="sparkline__mid" x1={pad} x2={w - pad} y1={y(50)} y2={y(50)} />
      {values.length > 1 && <path class="sparkline__area" d={area} />}
      {values.length > 1 && <polyline class="sparkline__line" points={line} />}
      {last && <circle class="sparkline__dot" cx={last[0]} cy={last[1]} r="4.5" />}
    </svg>
  );
}
