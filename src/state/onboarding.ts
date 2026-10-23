// First-visit setup: draft choices live in the screen; only finish saves them.
import { batch } from '@preact/signals';
import { INTEREST_IDS, type InterestId } from '../engine/interests';
import { isStartingExperience, type StartingExperience } from '../engine/starting';
import { rngFrom } from '../engine/rng';
import { selectPractice } from '../engine/select';
import type { Progress } from '../engine/types';
import { replaceRoute } from '../router';
import { logicSession } from './logic';
import { repairSession } from './repair';
import { session, startCustomSession } from './session';
import { bank, progress, showToast, storageOk, updateProgress, welcomeShown } from './store';

export interface SetupChoices {
  interests: readonly InterestId[];
  experience: StartingExperience | null;
}

/** Old saves may have real practice even though the old demo flag is false. */
export function shouldOfferSetup(p: Progress): boolean {
  return !p.onboarded && p.attempts.length === 0 && p.sessions.length === 0
    && Object.keys(p.daily).length === 0 && Object.keys(p.days).length === 0
    && Object.keys(p.boxes).length === 0 && Object.keys(p.stats).length === 0
    && p.bestStreak === 0 && p.soundStats.seen === 0 && p.repair.answered === 0 && p.repair.sets === 0 && p.repair.recent.length === 0
    && p.logic.answered === 0 && p.logic.sets === 0 && p.logic.recent.length === 0;
}

/** Even an unanswered set or a Daily Name-step draft must survive setup. */
export function hasActivePractice(): boolean {
  return Boolean((session.value && !session.value.finished)
    || (repairSession.value && !repairSession.value.finished)
    || (logicSession.value && !logicSession.value.finished));
}

export function finishSetup(choices: SetupChoices): void {
  const preserve = hasActivePractice();
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
  if (preserve) {
    replaceRoute('#/practice');
    return;
  }
  const p = progress.peek();
  const seed = `starter:${Date.now()}:${Math.random()}`;
  const itemIds = selectPractice({ bank, boxes: p.boxes, attempts: p.attempts,
    interests: p.settings.interests, starter: experience ?? 'auto', rng: rngFrom(seed) });
  startCustomSession({ key: 'practice', mode: 'practice', itemIds, seed });
  replaceRoute('#/play/practice');
}

/** Discard this setup's drafts and remember the first visitor's choice to skip. */
export function skipSetup(): void {
  updateProgress((p) => ({ ...p, onboarded: true }));
  welcomeShown.value = true;
  if (!storageOk.peek()) showToast('Setup skipped for this visit. This browser could not save that choice.', 6000);
  replaceRoute('#/');
}

/** Returning learners can leave without changing a saved preference. */
export function cancelSetup(): void {
  replaceRoute('#/practice');
}
