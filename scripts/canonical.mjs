// Canonical content rules for Fallacy Forge (CONTENT-SPEC section 1 and 2).
// This file is the single source of truth for the content pipeline:
// fallacy ids, families, difficulty levels, confusables, formats, tags and limits.

/** @typedef {'distraction' | 'emotion' | 'appeals' | 'evidence' | 'framing' | 'language'} FamilyId */
/** @typedef {'beginner' | 'intermediate' | 'advanced'} Level */

/** @type {ReadonlyArray<{ id: FamilyId, label: string, order: number }>} */
export const FAMILIES = Object.freeze([
  { id: 'distraction', label: 'Attacks & distractions', order: 1 },
  { id: 'emotion', label: 'Emotional appeals', order: 2 },
  { id: 'appeals', label: 'Crowds, authority & tradition', order: 3 },
  { id: 'evidence', label: 'Cause & evidence', order: 4 },
  { id: 'framing', label: 'Framing & assumptions', order: 5 },
  { id: 'language', label: 'Language & parts', order: 6 },
]);

/**
 * The 38 canonical fallacies, in table order.
 * `confusableWith` is ordered: the first entry is the closest look-alike.
 * @type {ReadonlyArray<{ id: string, family: FamilyId, difficulty: Level, confusableWith: string[] }>}
 */
export const FALLACIES = Object.freeze([
  // Attacks & distractions
  { id: 'fal_ad_hominem', family: 'distraction', difficulty: 'beginner', confusableWith: ['fal_tu_quoque', 'fal_guilt_by_association', 'fal_genetic_fallacy'] },
  { id: 'fal_tu_quoque', family: 'distraction', difficulty: 'intermediate', confusableWith: ['fal_ad_hominem', 'fal_red_herring'] },
  { id: 'fal_guilt_by_association', family: 'distraction', difficulty: 'intermediate', confusableWith: ['fal_ad_hominem', 'fal_genetic_fallacy'] },
  { id: 'fal_genetic_fallacy', family: 'distraction', difficulty: 'intermediate', confusableWith: ['fal_ad_hominem', 'fal_guilt_by_association'] },
  { id: 'fal_red_herring', family: 'distraction', difficulty: 'beginner', confusableWith: ['fal_straw_man', 'fal_tu_quoque'] },
  { id: 'fal_straw_man', family: 'distraction', difficulty: 'beginner', confusableWith: ['fal_red_herring', 'fal_false_dichotomy'] },
  // Emotional appeals
  { id: 'fal_appeal_to_emotion', family: 'emotion', difficulty: 'beginner', confusableWith: ['fal_appeal_to_pity', 'fal_appeal_to_fear'] },
  { id: 'fal_appeal_to_pity', family: 'emotion', difficulty: 'intermediate', confusableWith: ['fal_appeal_to_emotion', 'fal_red_herring'] },
  { id: 'fal_appeal_to_fear', family: 'emotion', difficulty: 'beginner', confusableWith: ['fal_slippery_slope', 'fal_appeal_to_emotion'] },
  { id: 'fal_appeal_to_consequences', family: 'emotion', difficulty: 'advanced', confusableWith: ['fal_appeal_to_emotion', 'fal_slippery_slope'] },
  // Crowds, authority & tradition
  { id: 'fal_appeal_to_authority', family: 'appeals', difficulty: 'beginner', confusableWith: ['fal_bandwagon', 'fal_genetic_fallacy'] },
  { id: 'fal_bandwagon', family: 'appeals', difficulty: 'beginner', confusableWith: ['fal_appeal_to_authority', 'fal_appeal_to_tradition'] },
  { id: 'fal_appeal_to_tradition', family: 'appeals', difficulty: 'intermediate', confusableWith: ['fal_appeal_to_nature', 'fal_bandwagon'] },
  { id: 'fal_appeal_to_nature', family: 'appeals', difficulty: 'intermediate', confusableWith: ['fal_appeal_to_tradition', 'fal_is_ought'] },
  // Cause & evidence
  { id: 'fal_false_cause', family: 'evidence', difficulty: 'intermediate', confusableWith: ['fal_post_hoc', 'fal_texas_sharpshooter'] },
  { id: 'fal_post_hoc', family: 'evidence', difficulty: 'intermediate', confusableWith: ['fal_false_cause', 'fal_anecdotal_evidence'] },
  { id: 'fal_slippery_slope', family: 'evidence', difficulty: 'beginner', confusableWith: ['fal_appeal_to_fear', 'fal_false_cause'] },
  { id: 'fal_hasty_generalization', family: 'evidence', difficulty: 'beginner', confusableWith: ['fal_anecdotal_evidence', 'fal_composition'] },
  { id: 'fal_anecdotal_evidence', family: 'evidence', difficulty: 'beginner', confusableWith: ['fal_hasty_generalization', 'fal_cherry_picking'] },
  { id: 'fal_cherry_picking', family: 'evidence', difficulty: 'intermediate', confusableWith: ['fal_texas_sharpshooter', 'fal_hasty_generalization'] },
  { id: 'fal_texas_sharpshooter', family: 'evidence', difficulty: 'advanced', confusableWith: ['fal_cherry_picking', 'fal_false_cause'] },
  { id: 'fal_gamblers_fallacy', family: 'evidence', difficulty: 'intermediate', confusableWith: ['fal_false_cause', 'fal_hasty_generalization'] },
  // Framing & assumptions
  { id: 'fal_false_dichotomy', family: 'framing', difficulty: 'beginner', confusableWith: ['fal_middle_ground', 'fal_loaded_question'] },
  { id: 'fal_loaded_question', family: 'framing', difficulty: 'intermediate', confusableWith: ['fal_false_dichotomy', 'fal_circular_reasoning'] },
  { id: 'fal_circular_reasoning', family: 'framing', difficulty: 'intermediate', confusableWith: ['fal_loaded_question', 'fal_no_true_scotsman'] },
  { id: 'fal_middle_ground', family: 'framing', difficulty: 'intermediate', confusableWith: ['fal_false_dichotomy', 'fal_false_equivalence'] },
  { id: 'fal_false_equivalence', family: 'framing', difficulty: 'intermediate', confusableWith: ['fal_false_analogy', 'fal_middle_ground'] },
  { id: 'fal_false_analogy', family: 'framing', difficulty: 'intermediate', confusableWith: ['fal_false_equivalence', 'fal_composition'] },
  { id: 'fal_special_pleading', family: 'framing', difficulty: 'advanced', confusableWith: ['fal_no_true_scotsman', 'fal_moving_the_goalposts'] },
  { id: 'fal_no_true_scotsman', family: 'framing', difficulty: 'advanced', confusableWith: ['fal_special_pleading', 'fal_moving_the_goalposts'] },
  { id: 'fal_moving_the_goalposts', family: 'framing', difficulty: 'intermediate', confusableWith: ['fal_no_true_scotsman', 'fal_special_pleading'] },
  { id: 'fal_burden_of_proof', family: 'framing', difficulty: 'advanced', confusableWith: ['fal_appeal_to_ignorance', 'fal_moving_the_goalposts'] },
  { id: 'fal_appeal_to_ignorance', family: 'framing', difficulty: 'intermediate', confusableWith: ['fal_burden_of_proof', 'fal_false_dichotomy'] },
  { id: 'fal_sunk_cost', family: 'framing', difficulty: 'intermediate', confusableWith: ['fal_appeal_to_tradition', 'fal_appeal_to_consequences'] },
  // Language & parts
  { id: 'fal_equivocation', family: 'language', difficulty: 'advanced', confusableWith: ['fal_straw_man', 'fal_false_analogy'] },
  { id: 'fal_composition', family: 'language', difficulty: 'intermediate', confusableWith: ['fal_division', 'fal_hasty_generalization'] },
  { id: 'fal_division', family: 'language', difficulty: 'advanced', confusableWith: ['fal_composition', 'fal_hasty_generalization'] },
  { id: 'fal_is_ought', family: 'language', difficulty: 'advanced', confusableWith: ['fal_appeal_to_nature', 'fal_appeal_to_tradition'] },
]);

/** Lookup by id. */
export const FALLACY_BY_ID = new Map(FALLACIES.map((f) => [f.id, f]));

export const FORMATS = Object.freeze(['post', 'email', 'chat', 'headline', 'ad', 'review', 'speech', 'quote']);

/** Formats that require a non-null `title`. */
export const TITLE_FORMATS = Object.freeze(['email', 'headline', 'ad', 'review']);

export const TAGS = Object.freeze([
  'everyday', 'workplace', 'school', 'health', 'fitness', 'food', 'money', 'tech', 'science',
  'sports', 'parenting', 'local-news', 'shopping', 'travel', 'media', 'environment', 'housing',
]);

export const LEVELS = Object.freeze(['beginner', 'intermediate', 'advanced']);

/** Character and count limits from CONTENT-SPEC section 2. */
export const LIMITS = Object.freeze({
  shortDef: 80,
  definition: 260,
  howToSpotCount: 3,
  howToSpotTip: 90,
  classicExample: 160,
  legitimateVersion: 220,
  contrast: 160,
  title: 70,
  passageMin: 140,
  passageMax: 420,
  chatLinesMin: 2,
  chatLinesMax: 4,
  cueWordsMin: 3,
  cueWordsMax: 20,
  explanation: 240,
  whyNot: 180,
  tagsMin: 1,
  tagsMax: 3,
  itemsPerFallacy: 8,
  flawedPerFallacy: 6,
  soundPerFallacy: 2,
  flawedPerDifficulty: 2,
});

/** `fal_ad_hominem` -> `ad_hominem` (used in item ids). */
export function slugOf(fallacyId) {
  return fallacyId.replace(/^fal_/, '');
}
