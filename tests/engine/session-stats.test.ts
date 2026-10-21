import { describe, expect, it } from 'vitest';
import { advance, checkAnswer, chooseSpot, createSession, recordAnswer, recordSession, selectOption } from '../../src/engine/session';
import {
  accuracy,
  accuracyTrend,
  fallacyOfTheDay,
  familyMastery,
  heatLevel,
  heatmap,
  masteredCount,
  totalAnswered,
  trendSummary,
  weakestFallacies,
} from '../../src/engine/stats';
import { defaultProgress } from '../../src/engine/storage';
import { fullBank } from '../helpers';

const bank = fullBank();
const flawed = bank.items.find((i) => !i.isSound)!;
const sound = bank.items.find((i) => i.isSound)!;
const wrongName = bank.fallacies.find((f) => f.id !== flawed.fallacyId)!.id;

const fresh = (itemIds = [flawed.id, sound.id]) =>
  createSession({ key: 'practice', mode: 'practice', itemIds, seed: 's', boxes: {} });

describe('session state machine', () => {
  it('Flawed on a flawed item goes to the Name step, then Check settles it', () => {
    let { state, outcome } = chooseSpot(fresh(), flawed, 'flawed');
    expect(state.phase).toBe('name');
    expect(outcome).toBeNull();
    expect(checkAnswer(state, flawed).outcome).toBeNull(); // nothing selected yet
    state = selectOption(state, flawed.fallacyId!);
    ({ state, outcome } = checkAnswer(state, flawed));
    expect(outcome).toBe('correct');
    expect(state.phase).toBe('feedback');
    expect(state.picks[0]).toEqual({ spot: 'flawed', named: flawed.fallacyId });
  });

  it('a wrong name is partial; Sound on a flawed item is wrong', () => {
    const named = selectOption(chooseSpot(fresh(), flawed, 'flawed').state, wrongName);
    expect(checkAnswer(named, flawed).outcome).toBe('partial');
    expect(chooseSpot(fresh(), flawed, 'sound').outcome).toBe('wrong');
  });

  it('sound items settle immediately on either button', () => {
    const start = fresh([sound.id]);
    expect(chooseSpot(start, sound, 'sound').outcome).toBe('correct');
    const wrong = chooseSpot(start, sound, 'flawed');
    expect(wrong.outcome).toBe('wrong');
    expect(wrong.state.phase).toBe('feedback');
  });

  it('Continue moves to the next question and finishes after the last one', () => {
    let state = chooseSpot(fresh(), flawed, 'sound').state;
    state = advance(state);
    expect(state.index).toBe(1);
    expect(state.phase).toBe('spot');
    expect(state.finished).toBe(false);
    state = advance(chooseSpot(state, sound, 'sound').state);
    expect(state.finished).toBe(true);
    expect(state.outcomes).toEqual(['wrong', 'correct']);
  });

  it('resumes a Daily from saved answers', () => {
    const resumed = createSession({ key: 'daily:x', mode: 'daily', itemIds: ['a', 'b', 'c'], seed: 's', boxes: {}, outcomes: ['correct'] });
    expect(resumed.index).toBe(1);
    expect(resumed.finished).toBe(false);
  });

  it('records attempts, days, the Daily resume record and sessions', () => {
    const at = new Date(2026, 9, 20, 18).getTime();
    let p = recordAnswer(defaultProgress(), flawed, 'correct', {
      mode: 'daily',
      at,
      daily: { key: '2026-10-20', itemIds: [flawed.id, sound.id], outcomes: ['correct'] },
    });
    expect(p.attempts).toEqual([{ itemId: flawed.id, outcome: 'correct', at, mode: 'daily' }]);
    expect(p.days).toEqual({ '2026-10-20': 1 });
    expect(p.daily['2026-10-20']).toEqual({ itemIds: [flawed.id, sound.id], answers: ['correct'], done: false });
    p = recordAnswer(p, sound, 'wrong', { mode: 'daily', at, daily: { key: '2026-10-20', itemIds: [flawed.id, sound.id], outcomes: ['correct', 'wrong'] } });
    expect(p.daily['2026-10-20']!.done).toBe(true);
    expect(p.soundStats).toEqual({ seen: 1, correct: 0 });
    for (let i = 0; i < 70; i++) p = recordSession(p, { mode: 'practice', at: i, total: 10, correct: 5 });
    expect(p.sessions).toHaveLength(60);
  });
});

describe('derived stats', () => {
  it('totals and accuracy include sound items', () => {
    expect(totalAnswered({ '2026-10-19': 10, '2026-10-20': 4 })).toBe(14);
    expect(accuracy({ stats: { a: { seen: 8, correct: 6 } }, soundStats: { seen: 2, correct: 2 } })).toBe(0.8);
    expect(accuracy({ stats: {}, soundStats: { seen: 0, correct: 0 } })).toBeNull();
    expect(masteredCount({ a: 5, b: 4, c: 5 }, ['a', 'b', 'c', 'd'])).toBe(2);
  });

  it('heat levels: 0, 1-4, 5-9, 10-19, 20+', () => {
    expect([0, 1, 4, 5, 9, 10, 19, 20, 60].map(heatLevel)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });

  it('heatmap: 20 weeks x 7 days, Sunday first, ends with the current week', () => {
    const cols = heatmap({ '2026-10-20': 10, '2026-10-12': 3 }, '2026-10-20', 20);
    expect(cols).toHaveLength(20);
    expect(cols.every((c) => c.length === 7)).toBe(true);
    const last = cols[19]!;
    expect(last[0]!.key).toBe('2026-10-18'); // Sunday
    expect(last[2]).toMatchObject({ key: '2026-10-20', count: 10, level: 3, future: false, label: 'Oct 20: 10 questions' });
    expect(last[3]!.future).toBe(true);
    expect(cols.flat().find((c) => c.key === '2026-10-12')!.label).toBe('Oct 12: 3 questions');
  });

  it('accuracy trend and its text summary', () => {
    const sessions = [3, 4, 5, 6, 7, 8].map((correct, i) => ({ mode: 'practice', at: i, total: 10, correct }));
    expect(accuracyTrend(sessions, 4)).toEqual([50, 60, 70, 80]);
    expect(trendSummary([])).toMatch(/Finish a session/);
    expect(trendSummary([50, 60, 70, 80])).toBe('Last 4 sessions: average 65%, up 20 points from the earlier half.');
    expect(trendSummary([70])).toBe('Your first session: average 70%.');
  });

  it('weakest fallacies: lowest box first, then fresh beginners', () => {
    const [a, b] = bank.fallacies.filter((f) => f.difficulty === 'advanced');
    const weakest = weakestFallacies(bank.fallacies, {
      boxes: { [a!.id]: 3, [b!.id]: 1 },
      stats: { [a!.id]: { seen: 4, correct: 2 }, [b!.id]: { seen: 4, correct: 1 } },
    });
    expect(weakest.map((f) => f.id).slice(0, 2)).toEqual([b!.id, a!.id]);
    expect(weakest[2]!.difficulty).toBe('beginner');
  });

  it('fallacy of the day is seeded by date', () => {
    expect(fallacyOfTheDay(bank.fallacies, '2026-10-20')).toEqual(fallacyOfTheDay(bank.fallacies, '2026-10-20'));
    const picks = new Set(Array.from({ length: 20 }, (_, i) => fallacyOfTheDay(bank.fallacies, `2026-11-${String(i + 1).padStart(2, '0')}`)!.id));
    expect(picks.size).toBeGreaterThan(8);
  });

  it('groups mastery by family in family order', () => {
    const groups = familyMastery(bank.families, bank.fallacies, { boxes: { fal_straw_man: 5 }, stats: { fal_straw_man: { seen: 3, correct: 3 } } });
    expect(groups.map((g) => g.family.id)).toEqual(['distraction', 'emotion', 'appeals', 'evidence', 'framing', 'language']);
    const strawMan = groups[0]!.rows.find((r) => r.fallacy.id === 'fal_straw_man')!;
    expect(strawMan).toMatchObject({ box: 5, percent: 100, practiced: true });
  });
});
