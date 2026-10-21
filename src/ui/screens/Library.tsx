// Library: search ("/" focuses it), family + difficulty filters, grouped cards.

import { signal } from '@preact/signals';
import type { JSX } from 'preact';
import { useRef } from 'preact/hooks';
import type { Fallacy, FamilyId, Level } from '../../engine/types';
import { bank, progress } from '../../state/store';
import { FamilyDot, LevelTag, MasteryBar } from '../components/Primitives';
import { Icon } from '../components/Icon';
import { isShortcutEvent, useKeydown } from '../hooks';
import { cx, LEVEL_LABELS, normalize, plural } from '../util';

// Module-level so filters survive a trip to a detail page and back.
const query = signal('');
const familyFilter = signal<FamilyId | 'all'>('all');
const levelFilter = signal<Level | null>(null);

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];

export function matchesQuery(fallacy: Fallacy, q: string): boolean {
  const needle = normalize(q);
  if (!needle) return true;
  return [fallacy.name, ...fallacy.aliases].some((name) => normalize(name).includes(needle));
}

function FallacyCard({ fallacy }: { fallacy: Fallacy }) {
  const p = progress.value;
  const practiced = (p.stats[fallacy.id]?.seen ?? 0) > 0;
  return (
    <li class="lib-card-wrap">
      <a class="lib-card" href={`#/library/${fallacy.id}`}>
        <span class="lib-card__top">
          <FamilyDot family={fallacy.family} />
          <LevelTag level={fallacy.difficulty} />
        </span>
        <span class="lib-card__name">{fallacy.name}</span>
        <span class="lib-card__def">{fallacy.shortDef}</span>
        <span class="lib-card__foot">
          {practiced ? (
            <MasteryBar box={p.boxes[fallacy.id]} practiced compact label={`${fallacy.name} mastery`} />
          ) : (
            <span class="lib-card__new">Not practiced yet</span>
          )}
          <Icon name="arrow-right" size={18} class="lib-card__arrow" />
        </span>
      </a>
    </li>
  );
}

export function LibraryScreen(): JSX.Element {
  const searchRef = useRef<HTMLInputElement>(null);
  useKeydown((event) => {
    if (event.key === '/' && isShortcutEvent(event)) {
      event.preventDefault();
      searchRef.current?.focus();
    }
  });

  const q = query.value;
  const family = familyFilter.value;
  const level = levelFilter.value;
  const results = bank.fallacies.filter(
    (f) => (family === 'all' || f.family === family) && (level === null || f.difficulty === level) && matchesQuery(f, q),
  );
  const groups = [...bank.families]
    .sort((a, b) => a.order - b.order)
    .map((fam) => ({ family: fam, fallacies: results.filter((f) => f.family === fam.id) }))
    .filter((g) => g.fallacies.length > 0);
  const filtered = family !== 'all' || level !== null;

  return (
    <div class="page library">
      <header class="library-head">
        <div class="library-head__title">
          <h1 class="page-title" tabIndex={-1}>
            Library
          </h1>
          <p class="library-head__count">{plural(bank.fallacies.length, 'fallacy', 'fallacies')}</p>
        </div>
        <div class="search">
          <Icon name="search" size={20} class="search__icon" />
          <label class="sr-only" for="library-search">
            Search fallacies by name or alias
          </label>
          <input
            id="library-search"
            ref={searchRef}
            class="search__input"
            type="search"
            placeholder="Search names and aliases"
            autocomplete="off"
            spellcheck={false}
            value={q}
            onInput={(event) => (query.value = (event.currentTarget as HTMLInputElement).value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && query.value) {
                event.preventDefault();
                query.value = '';
              }
            }}
          />
          <kbd class="search__kbd" aria-hidden="true">
            /
          </kbd>
        </div>
      </header>

      <div class="filters">
        <div class="filters__group" role="group" aria-label="Filter by family">
          <button
            type="button"
            class={cx('chip', 'chip--filter', family === 'all' && 'is-on')}
            aria-pressed={family === 'all'}
            onClick={() => (familyFilter.value = 'all')}
          >
            All
          </button>
          {bank.families.map((fam) => (
            <button
              key={fam.id}
              type="button"
              class={cx('chip', 'chip--filter', family === fam.id && 'is-on')}
              aria-pressed={family === fam.id}
              onClick={() => (familyFilter.value = family === fam.id ? 'all' : fam.id)}
            >
              <span class={`family-dot family-dot--${fam.id}`} aria-hidden="true" />
              {fam.label}
            </button>
          ))}
        </div>
        <div class="filters__group" role="group" aria-label="Filter by difficulty">
          {LEVELS.map((lv) => (
            <button
              key={lv}
              type="button"
              class={cx('chip', 'chip--filter', level === lv && 'is-on')}
              aria-pressed={level === lv}
              onClick={() => (levelFilter.value = level === lv ? null : lv)}
            >
              {LEVEL_LABELS[lv]}
            </button>
          ))}
        </div>
      </div>

      <p class="sr-only" aria-live="polite">
        {plural(results.length, 'fallacy', 'fallacies')} shown
      </p>

      {results.length === 0 ? (
        <div class="library-empty">
          <Icon name="search" size={28} />
          {q.trim() ? (
            <p>
              No fallacy matches “{q.trim()}”. Try an alias like “whataboutism”.
            </p>
          ) : (
            <p>No fallacies match these filters.</p>
          )}
          {(filtered || q) && (
            <button
              type="button"
              class="text-link"
              onClick={() => {
                query.value = '';
                familyFilter.value = 'all';
                levelFilter.value = null;
              }}
            >
              Clear search and filters
            </button>
          )}
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.family.id} class="lib-group" aria-labelledby={`fam-${group.family.id}`}>
            <h2 id={`fam-${group.family.id}`} class="lib-group__title">
              <span class={`family-dot family-dot--${group.family.id}`} aria-hidden="true" />
              {group.family.label}
              <span class="lib-group__count">{group.fallacies.length}</span>
            </h2>
            <ul class="lib-grid">
              {group.fallacies.map((f) => (
                <FallacyCard key={f.id} fallacy={f} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
