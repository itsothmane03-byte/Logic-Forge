import { describe, expect, it } from 'vitest';
import bankJson from '../../src/data/bank.json';
import type { InterestId } from '../../src/engine/interests';
import { rngFrom } from '../../src/engine/rng';
import {
  arrangeNoRepeats,
  BOX_WEIGHTS,
  fallacyWeight,
  pickDemoItem,
  reviewQueue,
  selectAlternativeExample,
  selectFocus,
  selectPractice,
  selectReview,
} from '../../src/engine/select';
import type { Attempt, Bank, Box, Item } from '../../src/engine/types';
import { attempt, fallacyOf, fixtureBank, fullBank, itemOf } from '../helpers';

const bank = fullBank();

function adjacentRepeats(ids: string[], previous: string | null = null): number {
  let count = 0;
  let prev = previous;
  for (const id of ids) {
    const f = fallacyOf(bank, id);
    if (f && f === prev) count++;
    prev = f;
  }
  return count;
}

describe('fallacyWeight', () => {
  const advanced = bank.fallacies.find((f) => f.difficulty === 'advanced')!;
  const beginner = bank.fallacies.find((f) => f.difficulty === 'beginner')!;

  it('uses Leitner box weights 5/3/2/1/0.5, with never-seen fallacies as box 1', () => {
    expect(BOX_WEIGHTS).toEqual({ 1: 5, 2: 3, 3: 2, 4: 1, 5: 0.5 });
    for (const box of [1, 2, 3, 4, 5] as Box[]) {
      expect(fallacyWeight(advanced, { [advanced.id]: box }, 100)).toBe(BOX_WEIGHTS[box]);
    }
    expect(fallacyWeight(advanced, {}, 100)).toBe(5);
  });

  it('boosts beginner fallacies x1.5 only while total attempts are under 30', () => {
    expect(fallacyWeight(beginner, {}, 0)).toBe(7.5);
    expect(fallacyWeight(beginner, {}, 29)).toBe(7.5);
    expect(fallacyWeight(beginner, {}, 30)).toBe(5);
    expect(fallacyWeight(advanced, {}, 0)).toBe(5);
  });
});

describe('selectPractice', () => {
  it('returns 10 unique items, exactly 2 of them sound', () => {
    for (let s = 0; s < 25; s++) {
      const ids = selectPractice({ bank, boxes: {}, attempts: [], rng: rngFrom(`p${s}`) });
      expect(ids).toHaveLength(10);
      expect(new Set(ids).size).toBe(10);
      expect(ids.filter((id) => itemOf(bank, id).isSound)).toHaveLength(2);
    }
  });

  it('never shows the same fallacy twice in a row', () => {
    for (let s = 0; s < 60; s++) {
      const ids = selectPractice({ bank, boxes: {}, attempts: [], rng: rngFrom(`adj${s}`) });
      expect(adjacentRepeats(ids)).toBe(0);
    }
  });

  it('does not start with the fallacy that was answered last', () => {
    for (let s = 0; s < 30; s++) {
      const last = bank.items[s * 8]!;
      const attempts = [attempt(last.id, 'wrong', 1)];
      const boxes: Record<string, Box> = { [last.fallacyId!]: 1 };
      const ids = selectPractice({ bank, boxes, attempts, rng: rngFrom(`prev${s}`) });
      expect(fallacyOf(bank, ids[0]!)).not.toBe(last.fallacyId);
    }
  });

  it('avoids items seen in the last 40 attempts when the pool allows', () => {
    const recent: Attempt[] = bank.items.slice(0, 40).map((item, i) => attempt(item.id, 'correct', i));
    const recentIds = new Set(recent.map((a) => a.itemId));
    for (let s = 0; s < 20; s++) {
      const ids = selectPractice({ bank, boxes: {}, attempts: recent, rng: rngFrom(`fresh${s}`) });
      expect(ids.filter((id) => recentIds.has(id))).toEqual([]);
    }
  });

  it('only looks at the last 40 attempts, not older ones', () => {
    const old = bank.items.slice(0, 8).map((item, i) => attempt(item.id, 'wrong', i));
    const filler = bank.items.slice(100, 140).map((item, i) => attempt(item.id, 'correct', 100 + i));
    const ids = selectPractice({ bank, boxes: {}, attempts: [...old, ...filler], rng: rngFrom('window') });
    const fillerIds = new Set(filler.map((a) => a.itemId));
    expect(ids.some((id) => fillerIds.has(id))).toBe(false);
  });

  it('falls back gracefully when every item was seen recently (small bank)', () => {
    const small = fixtureBank();
    const all = small.items.map((item, i) => attempt(item.id, 'correct', i));
    const ids = selectPractice({ bank: small, boxes: {}, attempts: all, rng: rngFrom('small') });
    expect(ids).toHaveLength(10);
    expect(new Set(ids).size).toBe(10);
  });

  it('shows low-box fallacies far more often than mastered ones', () => {
    const weak = bank.fallacies.find((f) => f.difficulty === 'advanced')!;
    const boxes: Record<string, Box> = Object.fromEntries(bank.fallacies.map((f) => [f.id, 5 as Box]));
    boxes[weak.id] = 1;
    let weakHits = 0;
    for (let s = 0; s < 200; s++) {
      const ids = selectPractice({ bank, boxes, attempts: [], rng: rngFrom(`weight${s}`) });
      if (ids.some((id) => fallacyOf(bank, id) === weak.id)) weakHits++;
    }
    // A box-1 fallacy (weight 5) among 37 box-5 ones (0.5) lands in nearly every set.
    expect(weakHits).toBeGreaterThan(150);
  });

  it('is deterministic for the same seed', () => {
    const a = selectPractice({ bank, boxes: {}, attempts: [], rng: rngFrom('same') });
    const b = selectPractice({ bank, boxes: {}, attempts: [], rng: rngFrom('same') });
    expect(a).toEqual(b);
  });
});

describe('arrangeNoRepeats', () => {
  const item = (id: string, fallacyId: string | null): Item => ({ ...bank.items[0]!, id, fallacyId, isSound: fallacyId === null });

  it('separates repeats whenever an arrangement exists', () => {
    const list = [item('a1', 'A'), item('a2', 'A'), item('a3', 'A'), item('b1', 'B'), item('c1', 'C')];
    const out = arrangeNoRepeats(list).map((i) => i.fallacyId);
    for (let i = 1; i < out.length; i++) expect(out[i]).not.toBe(out[i - 1]);
  });

  it('respects the previous fallacy and treats sound items as neutral', () => {
    const list = [item('a1', 'A'), item('s1', null), item('b1', 'B')];
    expect(arrangeNoRepeats(list, 'A')[0]!.fallacyId).not.toBe('A');
  });

  it('keeps every item when no valid arrangement exists', () => {
    const list = [item('a1', 'A'), item('a2', 'A')];
    expect(arrangeNoRepeats(list).map((i) => i.id).sort()).toEqual(['a1', 'a2']);
  });
});

describe('selectFocus', () => {
  const target = bank.fallacies.find((f) => f.id === 'fal_ad_hominem')!;

  it('has 6 flawed of X, 2 flawed from its confusables and 2 sound items resembling X', () => {
    const ids = selectFocus({ bank, fallacyId: target.id, rng: rngFrom('focus') });
    const items = ids.map((id) => itemOf(bank, id));
    expect(ids).toHaveLength(10);
    expect(new Set(ids).size).toBe(10);
    expect(items.filter((i) => i.fallacyId === target.id)).toHaveLength(6);
    const confusable = items.filter((i) => !i.isSound && i.fallacyId !== target.id);
    expect(confusable).toHaveLength(2);
    expect(confusable.map((i) => i.fallacyId).sort()).toEqual([...target.confusableWith.slice(0, 2)].sort());
    const sound = items.filter((i) => i.isSound);
    expect(sound).toHaveLength(2);
    expect(sound.every((i) => i.resembles === target.id)).toBe(true);
  });

  it('is shuffled and deterministic per seed', () => {
    const a = selectFocus({ bank, fallacyId: target.id, rng: rngFrom('f1') });
    expect(selectFocus({ bank, fallacyId: target.id, rng: rngFrom('f1') })).toEqual(a);
    expect(selectFocus({ bank, fallacyId: target.id, rng: rngFrom('f2') })).not.toEqual(a);
  });

  it('tops up from the same family when confusables are missing (partial banks)', () => {
    const small = fixtureBank();
    const ids = selectFocus({ bank: small, fallacyId: 'fal_ad_hominem', rng: rngFrom('fx') });
    const items = ids.map((id) => itemOf(small, id));
    expect(ids).toHaveLength(10);
    expect(items.filter((i) => i.fallacyId === 'fal_ad_hominem')).toHaveLength(6);
    // Ad hominem's confusables are not in the fixtures; straw man shares its family.
    expect(items.filter((i) => i.fallacyId === 'fal_straw_man')).toHaveLength(2);
  });

  it('returns nothing for an unknown fallacy', () => {
    expect(selectFocus({ bank, fallacyId: 'fal_nope', rng: rngFrom('x') })).toEqual([]);
  });
});

describe('review', () => {
  it('keeps only items whose latest attempt was partial or wrong, most recent first', () => {
    const attempts = [
      attempt('a', 'wrong', 1),
      attempt('b', 'partial', 2),
      attempt('c', 'correct', 3),
      attempt('a', 'correct', 4), // fixed later: drops out
      attempt('d', 'wrong', 5),
      attempt('c', 'partial', 6), // missed later: comes back
    ];
    expect(reviewQueue(attempts)).toEqual(['c', 'd', 'b']);
  });

  it('caps the session at 10 and drops items missing from the bank', () => {
    const attempts = Array.from({ length: 14 }, (_, i) => attempt(`i${i}`, 'wrong', i));
    expect(selectReview(attempts)).toHaveLength(10);
    expect(selectReview(attempts)[0]).toBe('i13');
    expect(reviewQueue(attempts, new Set(['i2', 'i5']))).toEqual(['i5', 'i2']);
  });

  it('is empty (mode disabled) when there are no misses', () => {
    expect(selectReview([])).toEqual([]);
    expect(selectReview([attempt('a', 'correct', 1)])).toEqual([]);
  });
});

describe('pickDemoItem', () => {
  it('picks a flawed difficulty-1 item of a beginner fallacy', () => {
    const demo = pickDemoItem(bank)!;
    expect(demo.isSound).toBe(false);
    expect(demo.difficulty).toBe(1);
    expect(bank.fallacies.find((f) => f.id === demo.fallacyId)?.difficulty).toBe('beginner');
  });
});

const shipped = bankJson as unknown as Bank;
const PREFS: InterestId[][] = [['work'], ['everyday'], ['tech'], ['everyday', 'work', 'tech']];

/** Each same-difficulty pair differs only in topic: odd examples school, even ones workplace. */
function topicBank(): Bank {
  const base = fullBank();
  const topic = (item: Item) => (Number(item.id.slice(-1)) % 2 ? 'school' : 'workplace');
  return { ...base, items: base.items.map((item) => (item.isSound ? item : { ...item, tags: [topic(item)] })) };
}

/** topicBank plus a tech-tagged twin of every sound item, with the same resemblance and difficulty. */
function soundTwinBank(): Bank {
  const base = topicBank();
  const twins = base.items.filter((item) => item.isSound).map((item) => ({ ...item, id: `${item.id}_tech`, tags: ['tech'] }));
  return { ...base, items: [...base.items, ...twins] };
}

/** What a question practices: verdict, skill and reasoning difficulty. */
function slotOf(source: Bank, id: string): string {
  const item = itemOf(source, id);
  return `${item.isSound ? 'sound' : 'flawed'}|${item.isSound ? item.resembles : item.fallacyId}|${item.difficulty}`;
}

function counting(seed: string): { rng: () => number; draws: () => number } {
  const rng = rngFrom(seed);
  let draws = 0;
  return { rng: () => { draws++; return rng(); }, draws: () => draws };
}

describe('familiar topics in Practice', () => {
  const topics = topicBank();
  const slots = (ids: string[]) => ids.map((id) => slotOf(topics, id));

  it('keeps the same skills, difficulties, order and random draws for every interest choice', () => {
    for (let s = 0; s < 40; s++) {
      const plainRun = counting(`pref${s}`);
      const plain = selectPractice({ bank: topics, boxes: {}, attempts: [], rng: plainRun.rng });
      for (const interests of PREFS) {
        const run = counting(`pref${s}`);
        const ids = selectPractice({ bank: topics, boxes: {}, attempts: [], rng: run.rng, interests });
        expect(slots(ids)).toEqual(slots(plain));
        expect(run.draws()).toBe(plainRun.draws());
        expect(new Set(ids).size).toBe(10);
      }
    }
  });

  it('prefers a familiar example within each skill and difficulty', () => {
    const flawedTags = (ids: string[]) => ids.map((id) => itemOf(topics, id)).filter((i) => !i.isSound).map((i) => i.tags[0]);
    for (let s = 0; s < 20; s++) {
      const work = selectPractice({ bank: topics, boxes: {}, attempts: [], rng: rngFrom(`fam${s}`), interests: ['work'] });
      const everyday = selectPractice({ bank: topics, boxes: {}, attempts: [], rng: rngFrom(`fam${s}`), interests: ['everyday'] });
      expect(new Set(flawedTags(work))).toEqual(new Set(['workplace']));
      expect(new Set(flawedTags(everyday))).toEqual(new Set(['school']));
    }
  });

  it('never trades freshness for a familiar topic', () => {
    const recentWork = topics.items.filter((i) => !i.isSound && i.tags.includes('workplace')).slice(0, 40);
    const attempts = recentWork.map((item, i) => attempt(item.id, 'correct', i));
    const recentIds = new Set(attempts.map((a) => a.itemId));
    for (let s = 0; s < 20; s++) {
      const plain = selectPractice({ bank: topics, boxes: {}, attempts, rng: rngFrom(`stale${s}`) });
      const ids = selectPractice({ bank: topics, boxes: {}, attempts, rng: rngFrom(`stale${s}`), interests: ['work'] });
      expect(ids.filter((id) => recentIds.has(id))).toEqual([]);
      expect(slots(ids)).toEqual(slots(plain));
    }
  });

  it('falls back to the usual set when no interest is chosen or nothing matches', () => {
    // fullBank tags flawed items "everyday" and sound ones "workplace": nothing is Technology.
    for (let s = 0; s < 10; s++) {
      const plain = selectPractice({ bank, boxes: {}, attempts: [], rng: rngFrom(`none${s}`) });
      expect(selectPractice({ bank, boxes: {}, attempts: [], rng: rngFrom(`none${s}`), interests: [] })).toEqual(plain);
      expect(selectPractice({ bank, boxes: {}, attempts: [], rng: rngFrom(`none${s}`), interests: ['tech'] })).toEqual(plain);
    }
  });

  it("keeps a sound pick's resemblance and difficulty while preferring its topic", () => {
    const twins = soundTwinBank();
    for (let s = 0; s < 20; s++) {
      const plain = selectPractice({ bank: twins, boxes: {}, attempts: [], rng: rngFrom(`snd${s}`) });
      const ids = selectPractice({ bank: twins, boxes: {}, attempts: [], rng: rngFrom(`snd${s}`), interests: ['tech'] });
      expect(ids.map((id) => slotOf(twins, id))).toEqual(plain.map((id) => slotOf(twins, id)));
      const sound = ids.filter((id) => itemOf(twins, id).isSound);
      expect(sound).toHaveLength(2);
      // Familiar unless its tech twin is already in the set.
      for (const id of sound) expect(id.endsWith('_tech') || ids.includes(`${id}_tech`)).toBe(true);
    }
  });
});

describe('familiar topics in Focus', () => {
  const topics = topicBank();
  const target = topics.fallacies.find((f) => f.id === 'fal_ad_hominem')!;
  const slots = (ids: string[]) => ids.map((id) => slotOf(topics, id));

  it('keeps quotas, skills, difficulties and random draws while preferring familiar examples', () => {
    for (let s = 0; s < 20; s++) {
      const plainRun = counting(`fx${s}`);
      const plain = selectFocus({ bank: topics, fallacyId: target.id, rng: plainRun.rng });
      for (const interests of PREFS) {
        const run = counting(`fx${s}`);
        const ids = selectFocus({ bank: topics, fallacyId: target.id, rng: run.rng, interests });
        expect(slots(ids)).toEqual(slots(plain));
        expect(run.draws()).toBe(plainRun.draws());
        expect(new Set(ids).size).toBe(10);
      }
      const work = selectFocus({ bank: topics, fallacyId: target.id, rng: rngFrom(`fx${s}`), interests: ['work'] }).map((id) => itemOf(topics, id));
      const confusables = work.filter((i) => !i.isSound && i.fallacyId !== target.id);
      expect(work.filter((i) => i.fallacyId === target.id)).toHaveLength(6);
      expect(work.filter((i) => i.isSound && i.resembles === target.id)).toHaveLength(2);
      expect(confusables).toHaveLength(2);
      expect(confusables.every((i) => i.tags.includes('workplace'))).toBe(true);
    }
  });
});

describe('specialist passages', () => {
  it('stay out of Practice and Focus, even when they are the only familiar match', () => {
    const topics = topicBank();
    const marked: Bank = {
      ...topics,
      items: topics.items.map((i) => (!i.isSound && i.tags.includes('workplace') ? { ...i, backgroundKnowledge: 'specialist' as const } : i)),
    };
    const specialist = new Set(marked.items.filter((i) => i.backgroundKnowledge === 'specialist').map((i) => i.id));
    for (let s = 0; s < 20; s++) {
      for (const interests of [[], ['work']] as InterestId[][]) {
        const practice = selectPractice({ bank: marked, boxes: {}, attempts: [], rng: rngFrom(`sp${s}`), interests });
        const focus = selectFocus({ bank: marked, fallacyId: 'fal_ad_hominem', rng: rngFrom(`sp${s}`), interests });
        expect(practice).toHaveLength(10);
        expect(focus).toHaveLength(10);
        expect([...practice, ...focus].filter((id) => specialist.has(id))).toEqual([]);
      }
    }
  });
});

describe('selectAlternativeExample', () => {
  const topics = topicBank();
  const current = itemOf(topics, 'itm_ad_hominem_01');
  const alternative = (input: Partial<Parameters<typeof selectAlternativeExample>[0]>) =>
    selectAlternativeExample({ bank: topics, current, excludeIds: [], attempts: [], rng: rngFrom('alt'), ...input });

  it('offers the unused example with the same verdict, skill and difficulty first', () => {
    expect(alternative({})?.id).toBe('itm_ad_hominem_02');
  });

  it('falls back to another skill but keeps the verdict and difficulty', () => {
    for (let s = 0; s < 20; s++) {
      const alt = alternative({ excludeIds: ['itm_ad_hominem_02'], rng: rngFrom(`other${s}`) })!;
      expect(alt.isSound).toBe(false);
      expect(alt.difficulty).toBe(1);
      expect(alt.fallacyId).not.toBe('fal_ad_hominem');
    }
  });

  it('prefers fresh passages, then familiar topics', () => {
    const work = topics.items.filter((i) => !i.isSound && i.difficulty === 1 && i.fallacyId !== current.fallacyId && i.tags.includes('workplace'));
    const seenAll = work.map((item, i) => attempt(item.id, 'correct', i));
    for (let s = 0; s < 10; s++) {
      // Only one Work passage is still fresh: it wins over fresh School ones.
      const familiar = alternative({ excludeIds: ['itm_ad_hominem_02'], attempts: seenAll.slice(1), interests: ['work'], rng: rngFrom(`fresh${s}`) });
      expect(familiar?.id).toBe(work[0]!.id);
      // Every Work passage is recent: freshness wins over the topic.
      const stale = alternative({ excludeIds: ['itm_ad_hominem_02'], attempts: seenAll, interests: ['work'], rng: rngFrom(`stale${s}`) })!;
      expect(stale.tags).toEqual(['school']);
    }
  });

  it('lets every shipped question swap without changing its verdict or difficulty', () => {
    for (const item of shipped.items.filter((i) => i.isSound)) {
      const alt = selectAlternativeExample({ bank: shipped, current: item, excludeIds: [], attempts: [], rng: rngFrom(item.id) });
      expect(alt?.isSound).toBe(true);
      expect(alt?.difficulty).toBe(item.difficulty);
    }
    for (let s = 0; s < 10; s++) {
      const ids = selectPractice({ bank: shipped, boxes: {}, attempts: [], rng: rngFrom(`real${s}`) });
      for (const id of ids) {
        const item = itemOf(shipped, id);
        const alt = selectAlternativeExample({ bank: shipped, current: item, excludeIds: ids, attempts: [], rng: rngFrom(`real${s}:${id}`) })!;
        expect(ids).not.toContain(alt.id);
        expect([alt.isSound, alt.difficulty]).toEqual([item.isSound, item.difficulty]);
      }
    }
  });

  it('returns undefined once a tiny pool is exhausted, without repeats or specialist passages', () => {
    const tiny: Bank = {
      ...topics,
      items: [
        current,
        { ...current, id: 'itm_tiny_same' },
        { ...current, id: 'itm_tiny_other', fallacyId: 'fal_straw_man' },
        { ...current, id: 'itm_tiny_specialist', backgroundKnowledge: 'specialist' },
        { ...current, id: 'itm_tiny_harder', difficulty: 2 },
        { ...current, id: 'itm_tiny_sound', isSound: true, fallacyId: null, resembles: current.fallacyId },
      ],
    };
    const skipped: string[] = [];
    let shown = current;
    for (let step = 0; step < 6; step++) {
      const alt = selectAlternativeExample({ bank: tiny, current: shown, excludeIds: skipped, attempts: [], rng: rngFrom(`tiny${step}`) });
      if (!alt) break;
      skipped.push(shown.id);
      shown = alt;
    }
    expect([...skipped.slice(1), shown.id]).toEqual(['itm_tiny_same', 'itm_tiny_other']);
    expect(selectAlternativeExample({ bank: tiny, current: shown, excludeIds: skipped, attempts: [], rng: rngFrom('end') })).toBeUndefined();
  });
});

describe('starter sets with topics and background knowledge', () => {
  const topics = topicBank();
  const slots = (ids: string[]) => ids.map((id) => slotOf(topics, id));
  const profiles = ['new', 'auto', 'some', 'comfortable'] as const;

  it('prefer familiar topics without changing skills, difficulties or random draws', () => {
    for (const starter of profiles) {
      for (let s = 0; s < 20; s++) {
        const plainRun = counting(`st${starter}${s}`);
        const plain = selectPractice({ bank: topics, boxes: {}, attempts: [], rng: plainRun.rng, starter });
        const run = counting(`st${starter}${s}`);
        const ids = selectPractice({ bank: topics, boxes: {}, attempts: [], rng: run.rng, starter, interests: ['work'] });
        expect(slots(ids)).toEqual(slots(plain));
        expect(run.draws()).toBe(plainRun.draws());
        expect(ids.map((id) => itemOf(topics, id)).filter((i) => !i.isSound).every((i) => i.tags.includes('workplace'))).toBe(true);
      }
    }
  });

  it('leave specialist passages out, even when they are the only familiar match', () => {
    const marked: Bank = {
      ...topics,
      items: topics.items.map((i) => (!i.isSound && i.tags.includes('workplace') ? { ...i, backgroundKnowledge: 'specialist' as const } : i)),
    };
    for (const starter of profiles) {
      for (let s = 0; s < 10; s++) {
        const ids = selectPractice({ bank: marked, boxes: {}, attempts: [], rng: rngFrom(`ss${s}`), starter, interests: ['work'] });
        expect(ids).toHaveLength(5);
        expect(ids.some((id) => itemOf(marked, id).backgroundKnowledge === 'specialist')).toBe(false);
      }
    }
  });
});
