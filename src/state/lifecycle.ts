// Invalidate transient sessions when saved learning data is replaced.
// Kept separate from the stores so reset/import cannot create import cycles.

import { signal } from '@preact/signals';

const invalidators = new Set<() => void>();
export const dataEpoch = signal(0);

export function registerSessionInvalidator(invalidate: () => void): void {
  invalidators.add(invalidate);
}

export function invalidateSessionCaches(): void {
  for (const invalidate of invalidators) invalidate();
  dataEpoch.value += 1;
}
