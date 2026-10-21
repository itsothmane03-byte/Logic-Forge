// One renderer per passage `format`. All decoration is aria-hidden; the cue
// is wrapped in <mark> only when `highlight` is on (after answering).

import type { ComponentChildren, JSX } from 'preact';
import type { Item } from '../../engine/types';
import { cx, hueFrom, initials, numberFrom, splitSource } from '../util';
import { Icon } from './Icon';

type Range = readonly [number, number] | null;

export function cueRange(passage: string, cue: string): Range {
  const start = passage.indexOf(cue);
  return start === -1 ? null : [start, start + cue.length];
}

/** Renders `text` (which starts at `offset` in the passage) with the cue marked. */
export function marked(text: string, offset: number, range: Range): ComponentChildren {
  if (!range) return text;
  const start = Math.max(range[0] - offset, 0);
  const end = Math.min(range[1] - offset, text.length);
  if (end <= 0 || start >= text.length || start >= end) return text;
  return (
    <>
      {text.slice(0, start)}
      <mark class="cue">{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}

/** Splits a passage into lines with their offsets. */
function lines(passage: string): Array<{ text: string; offset: number }> {
  const out: Array<{ text: string; offset: number }> = [];
  let offset = 0;
  for (const text of passage.split('\n')) {
    out.push({ text, offset });
    offset += text.length + 1;
  }
  return out;
}

function Paragraphs({ item, range, class: className }: { item: Item; range: Range; class?: string }) {
  return (
    <div class={cx('passage__text', className)}>
      {lines(item.passage)
        .filter((l) => l.text.trim() !== '')
        .map((l) => (
          <p key={l.offset}>{marked(l.text, l.offset, range)}</p>
        ))}
    </div>
  );
}

function Avatar({ name, small }: { name: string; small?: boolean }) {
  return (
    <span class={cx('avatar', small && 'avatar--sm')} style={{ '--avatar-h': String(hueFrom(name)) }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

function Post({ item, range }: RendererProps) {
  const { name, detail } = splitSource(item.source);
  const likes = numberFrom(item.id, 18, 940);
  return (
    <figure class="passage passage--post" aria-label={`Social post by ${name}`}>
      <div class="post__head">
        <Avatar name={name} />
        <div class="post__who">
          <span class="post__name">{name}</span>
          {detail && <span class="post__handle">{detail}</span>}
        </div>
        <span class="post__time" aria-hidden="true">
          {numberFrom(item.id, 1, 11)}h
        </span>
      </div>
      <Paragraphs item={item} range={range} />
      <div class="post__actions" aria-hidden="true">
        <span>
          <Icon name="reply" size={16} /> {numberFrom(item.id, 2, 60)}
        </span>
        <span>
          <Icon name="repeat" size={16} /> {numberFrom(`${item.id}r`, 1, 90)}
        </span>
        <span>
          <Icon name="heart" size={16} /> {likes}
        </span>
      </div>
    </figure>
  );
}

function Email({ item, range }: RendererProps) {
  return (
    <figure class="passage passage--email" aria-label="Email">
      <div class="email__bar" aria-hidden="true">
        <span class="email__dots">
          <i />
          <i />
          <i />
        </span>
        <span class="email__folder">Inbox</span>
      </div>
      <div class="email__head">
        <p class="email__subject">
          <span class="sr-only">Subject: </span>
          {item.title}
        </p>
        <div class="email__from">
          <Avatar name={item.source} small />
          <p class="email__meta">
            <span class="email__label">From</span> <strong>{item.source}</strong>
            <span class="email__to" aria-hidden="true">
              to me
            </span>
          </p>
          <span class="email__time" aria-hidden="true">
            {numberFrom(item.id, 7, 11)}:{String(numberFrom(`${item.id}m`, 0, 59)).padStart(2, '0')} AM
          </span>
        </div>
      </div>
      <Paragraphs item={item} range={range} class="email__body" />
    </figure>
  );
}

function Chat({ item, range }: RendererProps) {
  const speakers: string[] = [];
  const rows = lines(item.passage).map((line) => {
    const split = line.text.indexOf(': ');
    const name = split > 0 ? line.text.slice(0, split) : '';
    const text = split > 0 ? line.text.slice(split + 2) : line.text;
    if (name && !speakers.includes(name)) speakers.push(name);
    return { ...line, name, text, textOffset: line.offset + (split > 0 ? split + 2 : 0) };
  });
  return (
    <figure class="passage passage--chat" aria-label={`Group chat: ${item.source}`}>
      <div class="chat__head">
        <span class="chat__icon" aria-hidden="true">
          <Icon name="chat" size={16} />
        </span>
        <span class="chat__channel">{item.source}</span>
        <span class="chat__people" aria-hidden="true">
          {speakers.slice(0, 3).map((s) => (
            <Avatar key={s} name={s} small />
          ))}
        </span>
      </div>
      <ol class="chat__list">
        {rows.map((row) => {
          const side = speakers.indexOf(row.name) % 2 === 1 ? 'right' : 'left';
          return (
            <li key={row.offset} class={`chat__row chat__row--${side}`}>
              {row.name && <span class="chat__name">{marked(row.name, row.offset, range)}</span>}
              <p class="chat__bubble">{marked(row.text, row.textOffset, range)}</p>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

function Headline({ item, range }: RendererProps) {
  return (
    <figure class="passage passage--headline" aria-label={`Headline from ${item.source}`}>
      <p class="headline__outlet">{item.source}</p>
      <p class="headline__title">{item.title}</p>
      <Paragraphs item={item} range={range} class="headline__standfirst" />
      <p class="headline__meta" aria-hidden="true">
        {numberFrom(item.id, 2, 7)} min read
      </p>
    </figure>
  );
}

function Ad({ item, range }: RendererProps) {
  return (
    <figure class="passage passage--ad" aria-label={`Ad from ${item.source}`}>
      <div class="ad__top">
        <span class="ad__brand">
          <span class="ad__logo" aria-hidden="true">
            {initials(item.source).slice(0, 1)}
          </span>
          {item.source}
        </span>
        <span class="ad__sponsored">Sponsored</span>
      </div>
      <p class="ad__title">{item.title}</p>
      <Paragraphs item={item} range={range} />
      <span class="ad__cta" aria-hidden="true">
        Learn more
      </span>
    </figure>
  );
}

function Review({ item, range }: RendererProps) {
  const stars = numberFrom(item.id, 4, 5);
  return (
    <figure class="passage passage--review" aria-label={`Review by ${item.source}`}>
      <div class="review__head">
        <Avatar name={item.source} small />
        <span class="review__name">{item.source}</span>
        <span class="review__stars" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <Icon key={n} name="star" size={15} class={n <= stars ? 'on' : 'off'} />
          ))}
        </span>
      </div>
      <p class="review__title">{item.title}</p>
      <Paragraphs item={item} range={range} />
    </figure>
  );
}

function Speech({ item, range }: RendererProps) {
  const { name, detail } = splitSource(item.source);
  return (
    <figure class={`passage passage--speech passage--${item.format}`}>
      <span class="speech__mark" aria-hidden="true">
        “
      </span>
      <blockquote class="speech__quote">
        <Paragraphs item={item} range={range} />
      </blockquote>
      <figcaption class="speech__by">
        <span class="speech__dash" aria-hidden="true">
          <Icon name={item.format === 'speech' ? 'mic' : 'quote'} size={16} />
        </span>
        <span>
          <strong>{name}</strong>
          {detail && <span class="speech__where"> · {detail}</span>}
        </span>
      </figcaption>
    </figure>
  );
}

interface RendererProps {
  item: Item;
  range: Range;
}

const RENDERERS: Record<Item['format'], (props: RendererProps) => JSX.Element> = {
  post: Post,
  email: Email,
  chat: Chat,
  headline: Headline,
  ad: Ad,
  review: Review,
  speech: Speech,
  quote: Speech,
};

export function PassageCard({ item, highlight = false }: { item: Item; highlight?: boolean }): JSX.Element {
  const Renderer = RENDERERS[item.format] ?? Post;
  const range = highlight ? cueRange(item.passage, item.cue) : null;
  return (
    <div class={cx('passage-wrap', highlight && 'is-highlighted')}>
      <Renderer item={item} range={range} />
    </div>
  );
}
