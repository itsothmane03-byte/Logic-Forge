// The strongest revision, shown only after checking. Its authored highlights
// mark the key change; if they don't match the text exactly, it shows unmarked.

import type { JSX } from 'preact';
import type { RepairItem } from '../../engine/repair';

interface Part {
  text: string;
  marked: boolean;
}

/** `text` split around its highlights, or null unless each appears exactly once, in order. */
function split(text: string, highlights: readonly string[]): Part[] | null {
  if (highlights.length === 0) return null;
  const parts: Part[] = [];
  let cursor = 0;
  for (const highlight of highlights) {
    const start = highlight ? text.indexOf(highlight, cursor) : -1;
    if (start < 0 || text.indexOf(highlight) !== text.lastIndexOf(highlight)) return null;
    if (start > cursor) parts.push({ text: text.slice(cursor, start), marked: false });
    parts.push({ text: highlight, marked: true });
    cursor = start + highlight.length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), marked: false });
  return parts;
}

interface RepairRevisionProps {
  /** The complete strongest revision. */
  text: string;
  review?: RepairItem['review'];
  /** The learner chose it, so it appears as a worked example (only when annotated). */
  chosen: boolean;
}

export function RepairRevision({ text, review, chosen }: RepairRevisionProps): JSX.Element | null {
  const parts = review ? split(text, review.highlights) : null;
  if (chosen && !parts) return null;
  const marks = parts?.filter((part) => part.marked) ?? [];
  const title = !chosen ? 'A stronger revision' : marks.length > 1 ? 'Key changes' : 'Key change';
  return (
    <div class="repair-feedback__better">
      <h3>{title}</h3>
      {parts && <p class="repair-revision__legend">Highlighted words show what makes it stronger.</p>}
      <p class="repair-revision__text">
        {parts ? parts.map((part, index) => (part.marked ? <mark key={index}>{part.text}</mark> : part.text)) : text}
      </p>
      {parts && <p class="sr-only">Highlighted: {marks.map((part) => `“${part.text}”`).join('; ')}</p>}
    </div>
  );
}
