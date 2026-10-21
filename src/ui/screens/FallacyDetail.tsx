// Fallacy detail: hero, reference content, two passages "in the wild", and a
// sticky "Practice this fallacy" call to action.

import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import type { Fallacy, Item } from '../../engine/types';
import { bank, fallacyById, fallacyName, familyById, progress } from '../../state/store';
import { ButtonLink } from '../components/Button';
import { FallacyInfo } from '../components/FallacyInfo';
import { Icon } from '../components/Icon';
import { PassageCard } from '../components/PassageCard';
import { FamilyDot, LevelTag, MasteryBar, Reveal } from '../components/Primitives';
import { cx, plural } from '../util';

/** One flawed example (prefer difficulty 2) and one sound near-miss. */
export function wildExamples(fallacy: Fallacy, items: readonly Item[]): Item[] {
  const flawed = items
    .filter((i) => i.fallacyId === fallacy.id)
    .sort((a, b) => Math.abs(a.difficulty - 2) - Math.abs(b.difficulty - 2) || (a.id < b.id ? -1 : 1))[0];
  const sound = items.filter((i) => i.isSound && i.resembles === fallacy.id).sort((a, b) => (a.id < b.id ? -1 : 1))[0];
  return [flawed, sound].filter((i): i is Item => Boolean(i));
}

function WildExample({ item, index }: { item: Item; index: number }) {
  const [revealed, setRevealed] = useState(false);
  const panelId = `wild-answer-${index}`;
  const nameId = item.isSound ? item.resembles : item.fallacyId;
  return (
    <div class="wild">
      <PassageCard item={item} highlight={revealed} />
      <button
        type="button"
        class={cx('wild__toggle', revealed && 'is-open')}
        aria-expanded={revealed}
        aria-controls={panelId}
        onClick={() => setRevealed(!revealed)}
      >
        <Icon name="eye" size={18} />
        {revealed ? 'Hide answer' : 'Reveal answer'}
      </button>
      {revealed && (
        <div id={panelId} class={cx('wild__answer', item.isSound ? 'is-sound' : 'is-flawed')}>
          <p class="wild__verdict">
            {item.isSound ? (
              <>
                <strong>Sound.</strong> It only looks like {fallacyName(nameId ?? '')}.
              </>
            ) : (
              <>
                <strong>Flawed:</strong> {fallacyName(nameId ?? '')}.
              </>
            )}
          </p>
          <p>{item.explanation}</p>
        </div>
      )}
    </div>
  );
}

export function FallacyDetailScreen({ id }: { id: string }): JSX.Element {
  const fallacy = fallacyById.get(id);
  if (!fallacy) {
    return (
      <div class="page page--narrow empty-state">
        <h1 class="page-title" tabIndex={-1}>
          Fallacy not found
        </h1>
        <p class="lead">That fallacy isn't in the library.</p>
        <ButtonLink href="#/library" variant="primary" icon="arrow-left">
          Back to the library
        </ButtonLink>
      </div>
    );
  }
  const p = progress.value;
  const tally = p.stats[fallacy.id];
  const practiced = (tally?.seen ?? 0) > 0;
  const box = p.boxes[fallacy.id] ?? 1;
  const examples = wildExamples(fallacy, bank.items);
  const family = familyById.get(fallacy.family);
  const practiceHref = `#/play/focus/${fallacy.id}`;

  return (
    <div class="page detail">
      <a class="back-link" href="#/library">
        <Icon name="arrow-left" size={18} />
        Library
      </a>
      <div class="detail__layout">
        <article class="detail__main">
          <header class="detail-hero">
            <div class="detail-hero__tags">
              <span class="tag tag--family">
                <FamilyDot family={fallacy.family} />
                {family?.label}
              </span>
              <LevelTag level={fallacy.difficulty} />
            </div>
            <h1 class="detail-hero__title" tabIndex={-1}>
              {fallacy.name}
            </h1>
            {fallacy.aliases.length > 0 && <p class="detail-hero__aliases">Also called {fallacy.aliases.join(', ')}</p>}
            <p class="detail-hero__short">{fallacy.shortDef}</p>
          </header>

          <FallacyInfo fallacy={fallacy} reveal />

          {examples.length > 0 && (
            <Reveal as="section" class="info-block" aria-labelledby="wild-title">
              <h2 id="wild-title" class="info-block__title">
                In the wild
              </h2>
              <p class="info-block__intro">One of these is flawed and one is a sound near-miss. Decide before you reveal.</p>
              <div class="wild-list">
                {examples.map((item, i) => (
                  <WildExample key={item.id} item={item} index={i} />
                ))}
              </div>
            </Reveal>
          )}
        </article>

        <aside class="detail__aside" aria-label="Your mastery">
          <div class="detail-cta">
            <p class="detail-cta__label">Your mastery</p>
            <MasteryBar box={box} practiced={practiced} label={`${fallacy.name} mastery`} />
            <p class="detail-cta__meta">
              {practiced
                ? `Box ${box} of 5 · ${plural(tally?.seen ?? 0, 'answer')} · ${tally?.correct ?? 0} correct`
                : 'Not practiced yet. Ten focused questions take about five minutes.'}
            </p>
            <ButtonLink href={practiceHref} variant="primary" size="lg" block icon="target">
              Practice this fallacy
            </ButtonLink>
          </div>
        </aside>
      </div>

      <div class="detail-sticky">
        <ButtonLink href={practiceHref} variant="primary" size="lg" block icon="target">
          Practice this fallacy
        </ButtonLink>
      </div>
    </div>
  );
}
