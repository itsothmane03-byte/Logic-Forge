// Answer options for the Name step: the correct fallacy plus its closest
// look-alikes, so the wrong options are the most confusable ones.

import { rngFrom, shuffle } from './rng';
import type { Fallacy } from './types';

export const OPTION_COUNT = 4;
const MAX_CONFUSABLES = 2;

/**
 * Builds 4 unique options: the correct fallacy, up to 2 from its
 * `confusableWith` (in order), then random fallacies from the same family,
 * then any family. Shuffled with a seed from (sessionSeed, itemId).
 */
export function buildOptions(
  fallacies: readonly Fallacy[],
  correctId: string,
  sessionSeed: string,
  itemId: string,
  count = OPTION_COUNT,
): string[] {
  const rng = rngFrom(`${sessionSeed}:${itemId}`);
  const byId = new Map(fallacies.map((f) => [f.id, f]));
  const correct = byId.get(correctId);
  const options: string[] = [correctId];
  const add = (id: string): void => {
    if (options.length < count && byId.has(id) && !options.includes(id)) options.push(id);
  };

  if (correct) {
    let added = 0;
    for (const id of correct.confusableWith) {
      if (added >= MAX_CONFUSABLES) break;
      const before = options.length;
      add(id);
      if (options.length > before) added++;
    }
    for (const f of shuffle(fallacies.filter((f) => f.family === correct.family), rng)) add(f.id);
  }
  for (const f of shuffle(fallacies, rng)) add(f.id);
  return shuffle(options, rng);
}
