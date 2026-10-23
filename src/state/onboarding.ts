// Optional practice preferences: drafts save only after an explicit action.
import { batch } from '@preact/signals';
import { INTEREST_IDS, type InterestId } from '../engine/interests';
import { isStartingExperience, type StartingExperience } from '../engine/starting';
import { rngFrom } from '../engine/rng';
import { selectPractice } from '../engine/select';
import { replaceRoute } from '../router';
import { logicSession } from './logic';
import { repairSession } from './repair';
import { session, startCustomSession } from './session';
import { bank, progress, showToast, storageOk, updateProgress, welcomeShown } from './store';

export interface SetupChoices {
  interests: readonly InterestId[];
  experience: StartingExperience | null;
}

/** Even an unanswered set or a Daily Name-step draft must survive setup. */
export function hasActivePractice(): boolean {
  return Boolean((session.value && !session.value.finished)
    || (repairSession.value && !repairSession.value.finished)
    || (logicSession.value && !logicSession.value.finished));
}

function applyChoices(choices: SetupChoices): void {
  const interests = INTEREST_IDS.filter((id) => choices.interests.includes(id));
  const experience = isStartingExperience(choices.experience) ? choices.experience : undefined;
  batch(() => {
    updateProgress((p) => {
      const { startingExperience: _old, ...settings } = p.settings;
      return { ...p, onboarded: true, settings: { ...settings, interests,
        ...(experience ? { startingExperience: experience } : {}) } };
    });
    welcomeShown.value = true;
  });
  if (!storageOk.peek()) showToast('You can continue, but this browser could not save your choices.', 6000);
}

/** Saving a preference never starts or replaces an exercise. */
export function saveSetup(choices: SetupChoices): void {
  applyChoices(choices);
  replaceRoute('#/practice');
}

/** A short set is an explicit choice; any existing work still takes priority. */
export function finishSetup(choices: SetupChoices): void {
  const preserve = hasActivePractice();
  applyChoices(choices);
  if (preserve) {
    replaceRoute('#/practice');
    return;
  }
  const p = progress.peek();
  const seed = `starter:${Date.now()}:${Math.random()}`;
  const itemIds = selectPractice({ bank, boxes: p.boxes, attempts: p.attempts,
    interests: p.settings.interests, starter: p.settings.startingExperience ?? 'auto', rng: rngFrom(seed) });
  startCustomSession({ key: 'practice', mode: 'practice', itemIds, seed });
  replaceRoute('#/play/practice');
}

/** Leave without changing a saved preference. */
export function cancelSetup(): void {
  replaceRoute('#/practice');
}
