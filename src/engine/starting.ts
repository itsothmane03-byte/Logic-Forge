// Starting profiles for the five-question first set. A self-reported comfort
// level only shapes that set's difficulty; mastery takes over afterwards.

import type { Difficulty } from './types';

export type StartingExperience = 'new' | 'some' | 'comfortable';
/** A starter profile: the learner's answer, or `auto` when they gave none. */
export type StarterProfileId = StartingExperience | 'auto';

export const STARTING_EXPERIENCES: readonly StartingExperience[] = ['new', 'some', 'comfortable'];

export function isStartingExperience(value: unknown): value is StartingExperience {
  return typeof value === 'string' && (STARTING_EXPERIENCES as readonly string[]).includes(value);
}

export interface StarterProfile {
  /** Difficulty of each flawed question; the set is shuffled afterwards. */
  flawed: readonly Difficulty[];
  /** Difficulty of the one sound near-miss (sound passages start at 2). */
  sound: Difficulty;
  /** Only beginner-level fallacies. */
  beginnerOnly: boolean;
}

export const STARTER_PROFILES: Readonly<Record<StarterProfileId, StarterProfile>> = {
  new: { flawed: [1, 1, 1, 1], sound: 2, beginnerOnly: true },
  auto: { flawed: [1, 1, 2, 2], sound: 2, beginnerOnly: false },
  some: { flawed: [1, 2, 2, 3], sound: 2, beginnerOnly: false },
  comfortable: { flawed: [2, 3, 3, 3], sound: 3, beginnerOnly: false },
};
