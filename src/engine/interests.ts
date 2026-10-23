// Optional familiar topics. They only nudge which example of a skill appears;
// they never decide the skill, its difficulty or whether a passage is sound.

import type { Item } from './types';

export type InterestId = 'everyday' | 'work' | 'tech';

export interface Interest {
  id: InterestId;
  label: string;
  tags: readonly string[];
}

export const INTERESTS: readonly Interest[] = [
  {
    id: 'everyday',
    label: 'Everyday life',
    tags: [
      'everyday', 'school', 'health', 'fitness', 'food', 'money', 'sports', 'parenting',
      'local-news', 'shopping', 'travel', 'media', 'environment', 'housing',
    ],
  },
  { id: 'work', label: 'Work', tags: ['workplace'] },
  { id: 'tech', label: 'Technology', tags: ['tech', 'science'] },
];

export const INTEREST_IDS: readonly InterestId[] = INTERESTS.map((interest) => interest.id);

export function isInterestId(value: unknown): value is InterestId {
  return typeof value === 'string' && (INTEREST_IDS as readonly string[]).includes(value);
}

/** True when an item touches a chosen interest. No interests means "Mix everything". */
export function matchesInterests(item: Pick<Item, 'tags'>, interests: readonly InterestId[]): boolean {
  if (interests.length === 0) return true;
  return INTERESTS.some((interest) => interests.includes(interest.id) && interest.tags.some((tag) => item.tags.includes(tag)));
}

/** Adaptive sets skip passages that need specialist knowledge; unannotated items count as general. */
export function isAdaptiveEligible(item: Pick<Item, 'backgroundKnowledge'>): boolean {
  return item.backgroundKnowledge !== 'specialist';
}
