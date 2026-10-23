import { describe, expect, it } from 'vitest';
import bankJson from '../../src/data/bank.json';
import { rngFrom } from '../../src/engine/rng';
import { selectPractice, type PracticeInput } from '../../src/engine/select';
import { isStartingExperience, STARTER_PROFILES, STARTING_EXPERIENCES, type StarterProfileId } from '../../src/engine/starting';
import type { Bank, Box, Item } from '../../src/engine/types';
import { attempt, fullBank, itemOf } from '../helpers';

const synthetic = fullBank();
const shipped = bankJson as unknown as Bank;
const PROFILE_IDS = Object.keys(STARTER_PROFILES) as StarterProfileId[];

function starterItems(bank: Bank, starter: StarterProfileId, seed: string, extra: Partial<PracticeInput> = {}): Item[] {
  return selectPractice({ bank, boxes: {}, attempts: [], rng: rngFrom(seed), starter, ...extra }).map((id) => itemOf(bank, id));
}

describe('starting experience', () => {
  it('recognizes only the three self-reported answers', () => {
    expect(STARTING_EXPERIENCES).toEqual(['new', 'some', 'comfortable']);
    expect(STARTING_EXPERIENCES.every(isStartingExperience)).toBe(true);
    for (const value of ['auto', 'New', 'expert', '', null, 1, {}]) expect(isStartingExperience(value)).toBe(false);
  });

  it('uses four flawed difficulties and one sound difficulty per profile', () => {
    expect(STARTER_PROFILES).toEqual({
      new: { flawed: [1, 1, 1, 1], sound: 2, beginnerOnly: true },
      auto: { flawed: [1, 1, 2, 2], sound: 2, beginnerOnly: false },
      some: { flawed: [1, 2, 2, 3], sound: 2, beginnerOnly: false },
      comfortable: { flawed: [2, 3, 3, 3], sound: 3, beginnerOnly: false },
    });
  });
});

describe('starter sets', () => {
  for (const [name, bank] of [['synthetic', synthetic], ['shipped', shipped]] as const) {
    it(`match every profile in the ${name} bank`, () => {
      const beginner = new Set(bank.fallacies.filter((f) => f.difficulty === 'beginner').map((f) => f.id));
      for (const id of PROFILE_IDS) {
        const profile = STARTER_PROFILES[id];
        for (let s = 0; s < 30; s++) {
          const items = starterItems(bank, id, `${id}${s}`);
          const flawed = items.filter((i) => !i.isSound);
          const sound = items.filter((i) => i.isSound);
          expect(new Set(items.map((i) => i.id)).size).toBe(5);
          expect(flawed.map((i) => i.difficulty).sort()).toEqual([...profile.flawed].sort());
          expect(new Set(flawed.map((i) => i.fallacyId)).size).toBe(4);
          expect(sound.map((i) => i.difficulty)).toEqual([profile.sound]);
          // The near-miss resembles one of the skills in the set.
          expect(flawed.map((i) => i.fallacyId)).toContain(sound[0]!.resembles);
          if (profile.beginnerOnly) expect(flawed.every((i) => beginner.has(i.fallacyId!))).toBe(true);
          expect(items.some((i) => i.backgroundKnowledge === 'specialist')).toBe(false);
        }
      }
    });
  }

  it('shuffles the sound question instead of fixing its position', () => {
    const positions = new Set<number>();
    for (let s = 0; s < 40; s++) positions.add(starterItems(synthetic, 'auto', `pos${s}`).findIndex((i) => i.isSound));
    expect(positions.size).toBeGreaterThanOrEqual(4);
  });

  it('is deterministic for the same seed', () => {
    for (const id of PROFILE_IDS) expect(starterItems(synthetic, id, 'same')).toEqual(starterItems(synthetic, id, 'same'));
  });

  it('weights skills by actual mastery and never changes it', () => {
    const weak = synthetic.fallacies.find((f) => f.difficulty === 'beginner')!;
    const boxes: Record<string, Box> = Object.fromEntries(synthetic.fallacies.map((f) => [f.id, 5 as Box]));
    boxes[weak.id] = 1;
    Object.freeze(boxes);
    let hits = 0;
    for (let s = 0; s < 200; s++) {
      if (starterItems(synthetic, 'new', `weak${s}`, { boxes }).some((i) => i.fallacyId === weak.id)) hits++;
    }
    expect(hits).toBeGreaterThan(120);
  });

  it('keeps recently seen passages out while fresh ones exist', () => {
    const seen = synthetic.items.filter((i) => !i.isSound && i.difficulty === 1).slice(0, 40);
    const attempts = seen.map((item, i) => attempt(item.id, 'correct', i));
    const seenIds = new Set(seen.map((i) => i.id));
    for (let s = 0; s < 20; s++) {
      const items = starterItems(synthetic, 'auto', `seen${s}`, { attempts });
      expect(items.filter((i) => seenIds.has(i.id))).toEqual([]);
    }
  });

  it('does not open with the fallacy answered last', () => {
    const last = synthetic.items.find((i) => i.fallacyId === 'fal_straw_man' && i.difficulty === 1)!;
    const boxes: Record<string, Box> = Object.fromEntries(synthetic.fallacies.map((f) => [f.id, 5 as Box]));
    boxes.fal_straw_man = 1;
    for (let s = 0; s < 30; s++) {
      const items = starterItems(synthetic, 'auto', `last${s}`, { boxes, attempts: [attempt(last.id, 'wrong', 1)] });
      expect(items[0]!.fallacyId).not.toBe('fal_straw_man');
    }
  });

  it('falls back to normal Practice when a profile cannot be filled', () => {
    const noBeginners: Bank = { ...synthetic, fallacies: synthetic.fallacies.map((f) => ({ ...f, difficulty: 'intermediate' as const })) };
    for (let s = 0; s < 10; s++) {
      const plain = selectPractice({ bank: noBeginners, boxes: {}, attempts: [], rng: rngFrom(`fb${s}`) });
      expect(selectPractice({ bank: noBeginners, boxes: {}, attempts: [], rng: rngFrom(`fb${s}`), starter: 'new' })).toEqual(plain);
    }
    // Comfortable needs a difficulty-3 sound passage.
    const noHardSound: Bank = { ...synthetic, items: synthetic.items.filter((i) => !(i.isSound && i.difficulty === 3)) };
    const ids = selectPractice({ bank: noHardSound, boxes: {}, attempts: [], rng: rngFrom('hard'), starter: 'comfortable' });
    expect(new Set(ids).size).toBe(10);
    expect(ids.filter((id) => itemOf(noHardSound, id).isSound)).toHaveLength(2);
  });

  it('leaves normal Practice unchanged when no starter is given', () => {
    for (let s = 0; s < 10; s++) {
      const plain = selectPractice({ bank: synthetic, boxes: {}, attempts: [], rng: rngFrom(`plain${s}`) });
      expect(selectPractice({ bank: synthetic, boxes: {}, attempts: [], rng: rngFrom(`plain${s}`), starter: undefined })).toEqual(plain);
      expect(plain).toHaveLength(10);
    }
  });
});
