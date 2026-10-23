import { describe, expect, it, vi } from 'vitest';
import {
  defaultProgress,
  loadProgress,
  MAX_ACTIVITY_RECENT,
  MAX_ATTEMPTS,
  MAX_SESSIONS,
  parseImport,
  sanitizeProgress,
  saveProgress,
  serializeExport,
  STORAGE_KEY,
} from '../../src/engine/storage';
import type { Progress } from '../../src/engine/types';

function memoryStorage(initial?: string) {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(STORAGE_KEY, initial);
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

function sample(): Progress {
  return {
    ...defaultProgress(),
    settings: { theme: 'dark', showDefinitions: false, interests: ['work'] },
    onboarded: true,
    boxes: { fal_straw_man: 3, fal_ad_hominem: 5 },
    stats: { fal_straw_man: { seen: 6, correct: 4 } },
    soundStats: { seen: 3, correct: 2 },
    attempts: [{ itemId: 'itm_straw_man_01', outcome: 'partial', at: 1_760_000_000_000, mode: 'daily' }],
    days: { '2026-10-20': 10 },
    daily: { '2026-10-20': { itemIds: ['a', 'b'], answers: ['correct'], done: false } },
    sessions: [{ mode: 'daily', at: 1_760_000_000_000, total: 10, correct: 7 }],
    bestStreak: 4,
  };
}

describe('loadProgress', () => {
  it('returns defaults when storage is missing, empty or unreadable', () => {
    expect(loadProgress(null)).toEqual(defaultProgress());
    expect(loadProgress(undefined)).toEqual(defaultProgress());
    expect(loadProgress(memoryStorage())).toEqual(defaultProgress());
    const throwing = { getItem: () => { throw new Error('SecurityError'); } };
    expect(loadProgress(throwing)).toEqual(defaultProgress());
  });

  it('falls back to defaults on corrupt JSON without crashing', () => {
    expect(loadProgress(memoryStorage('{not json'))).toEqual(defaultProgress());
    expect(loadProgress(memoryStorage('"just a string"'))).toEqual(defaultProgress());
    expect(loadProgress(memoryStorage('[1,2,3]'))).toEqual(defaultProgress());
    expect(loadProgress(memoryStorage('null'))).toEqual(defaultProgress());
  });

  it('falls back to defaults for an unknown version', () => {
    expect(loadProgress(memoryStorage(JSON.stringify({ ...sample(), version: 2 })))).toEqual(defaultProgress());
  });

  it('round-trips a valid save', () => {
    const storage = memoryStorage();
    expect(saveProgress(storage, sample())).toBe(true);
    expect(loadProgress(storage)).toEqual(sample());
  });

  it('drops invalid entries but keeps the valid ones', () => {
    const raw = {
      ...sample(),
      settings: { theme: 'neon', showDefinitions: 'yes' },
      boxes: { fal_straw_man: 3, fal_bad: 9, __proto__: 1, 'not a key': 2 },
      stats: { fal_straw_man: { seen: 2, correct: 5 }, fal_x: { seen: -1, correct: 0 } },
      attempts: [
        { itemId: 'ok', outcome: 'correct', at: 1, mode: 'daily' },
        { itemId: 'bad', outcome: 'meh', at: 2, mode: 'daily' },
        'garbage',
      ],
      days: { '2026-10-20': 3, '2026-13-40': 2, '2026-10-21': -4 },
      daily: { '2026-10-20': { itemIds: ['a'], answers: ['correct', 'wrong'], done: true } },
      sessions: [{ mode: 'daily', at: 1, total: 10, correct: 11 }],
      bestStreak: 'lots',
    };
    const clean = sanitizeProgress(JSON.parse(JSON.stringify(raw)))!;
    expect(clean.settings).toEqual({ theme: 'system', showDefinitions: true, interests: [] });
    expect(clean.boxes).toEqual({ fal_straw_man: 3 });
    expect(Object.getPrototypeOf(clean.boxes)).toBe(Object.prototype);
    expect(clean.stats).toEqual({ fal_straw_man: { seen: 2, correct: 2 } });
    expect(clean.attempts).toEqual([{ itemId: 'ok', outcome: 'correct', at: 1, mode: 'daily' }]);
    expect(clean.days).toEqual({ '2026-10-20': 3 });
    expect(clean.daily).toEqual({});
    expect(clean.sessions).toEqual([]);
    expect(clean.bestStreak).toBe(0);
  });

  it('keeps only the last 500 attempts and 60 sessions', () => {
    const many = {
      ...sample(),
      attempts: Array.from({ length: 620 }, (_, i) => ({ itemId: `i${i}`, outcome: 'correct', at: i, mode: 'practice' })),
      sessions: Array.from({ length: 75 }, (_, i) => ({ mode: 'practice', at: i, total: 10, correct: 5 })),
    };
    const clean = sanitizeProgress(many)!;
    expect(clean.attempts).toHaveLength(MAX_ATTEMPTS);
    expect(clean.attempts[0]!.itemId).toBe('i120');
    expect(clean.sessions).toHaveLength(MAX_SESSIONS);
    expect(clean.sessions[0]!.at).toBe(15);
  });
});

describe('saveProgress', () => {
  it('returns false instead of throwing when storage is full or blocked', () => {
    const full = { getItem: () => null, setItem: vi.fn(() => { throw new Error('QuotaExceededError'); }) };
    expect(saveProgress(full, sample())).toBe(false);
    expect(saveProgress(null, sample())).toBe(false);
  });
});

describe('import / export', () => {
  it('accepts its own export', () => {
    const result = parseImport(serializeExport(sample()));
    expect(result).toEqual({ ok: true, progress: sample() });
  });

  it('rejects files that are not JSON or not an object', () => {
    expect(parseImport('hello')).toMatchObject({ ok: false });
    expect(parseImport('[]')).toMatchObject({ ok: false });
    expect(parseImport('42')).toMatchObject({ ok: false });
  });

  it('rejects the wrong version with a clear message', () => {
    const result = parseImport(JSON.stringify({ ...sample(), version: 3 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/version/i);
  });

  it('rejects missing or mistyped fields before replacing anything', () => {
    const { attempts: _a, days: _d, ...missing } = sample();
    const result = parseImport(JSON.stringify(missing));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('attempts');
    const wrong = parseImport(JSON.stringify({ ...sample(), boxes: [], bestStreak: -2 }));
    expect(wrong.ok).toBe(false);
    if (!wrong.ok) {
      expect(wrong.error).toContain('boxes');
      expect(wrong.error).toContain('bestStreak');
    }
  });
});

describe('familiar topic preferences', () => {
  const withSettings = (settings: unknown) => ({ ...sample(), settings });

  it('loads saves and imports from before interests with "Mix everything"', () => {
    const legacy = withSettings({ theme: 'dark', showDefinitions: false });
    const expected = { ...sample(), settings: { theme: 'dark', showDefinitions: false, interests: [] } };
    expect(loadProgress(memoryStorage(JSON.stringify(legacy)))).toEqual(expected);
    expect(parseImport(JSON.stringify(legacy))).toEqual({ ok: true, progress: expected });
    expect(defaultProgress().settings.interests).toEqual([]);
  });

  it('drops unknown, repeated and malformed interests and keeps a stable order', () => {
    const messy = withSettings({ theme: 'light', showDefinitions: true, interests: ['tech', 'Work', 'work', 'tech', 3, null, 'everyday'] });
    expect(sanitizeProgress(messy)!.settings).toEqual({ theme: 'light', showDefinitions: true, interests: ['everyday', 'work', 'tech'] });
    for (const interests of ['work', { work: true }, null, 7]) {
      expect(sanitizeProgress(withSettings({ theme: 'light', showDefinitions: true, interests }))!.settings.interests).toEqual([]);
    }
  });

  it('includes interests in the export and restores them on import', () => {
    const chosen: Progress = { ...sample(), settings: { ...sample().settings, interests: ['everyday', 'tech'] } };
    const text = serializeExport(chosen);
    expect(JSON.parse(text).settings.interests).toEqual(['everyday', 'tech']);
    expect(parseImport(text)).toEqual({ ok: true, progress: chosen });
  });
});

describe('starting experience', () => {
  const withExperience = (startingExperience: unknown) => ({ ...sample(), settings: { ...sample().settings, startingExperience } });

  it('stays absent by default, in older saves and in their exports', () => {
    expect(defaultProgress().settings).not.toHaveProperty('startingExperience');
    expect(loadProgress(memoryStorage(JSON.stringify(sample()))).settings).not.toHaveProperty('startingExperience');
    expect(JSON.parse(serializeExport(loadProgress(memoryStorage(JSON.stringify(sample()))))).settings).not.toHaveProperty('startingExperience');
  });

  it('keeps the three answers through save, export and import', () => {
    for (const value of ['new', 'some', 'comfortable'] as const) {
      const chosen: Progress = { ...sample(), settings: { ...sample().settings, startingExperience: value } };
      expect(loadProgress(memoryStorage(JSON.stringify(chosen))).settings.startingExperience).toBe(value);
      expect(parseImport(serializeExport(chosen))).toEqual({ ok: true, progress: chosen });
    }
  });

  it('drops invalid answers instead of guessing a level', () => {
    for (const value of ['auto', 'expert', 'New', '', null, 2, {}]) {
      const clean = sanitizeProgress(withExperience(value))!;
      expect(clean.settings).not.toHaveProperty('startingExperience');
      expect(clean.settings).toEqual(sample().settings);
    }
  });
});

describe('activity progress compatibility', () => {
  it('loads pre-activity saves and exports without losing any existing quiz progress', () => {
    const { repair: _repair, logic: _logic, ...legacy } = sample();
    const expected = { ...legacy, repair: defaultProgress().repair, logic: defaultProgress().logic };
    expect(loadProgress(memoryStorage(JSON.stringify(legacy)))).toEqual(expected);
    expect(parseImport(JSON.stringify(legacy))).toEqual({ ok: true, progress: expected });
  });

  it('round-trips distinct activity histories and counters alongside quiz data', () => {
    const current: Progress = {
      ...sample(),
      repair: { recent: ['repair_one', 'repair_two'], answered: 12, correct: 8, sets: 2 },
      logic: { recent: ['logic_ten', 'logic_eleven', 'logic_twelve'], answered: 27, correct: 19, sets: 5 },
    };
    const imported = parseImport(serializeExport(current));
    expect(imported).toEqual({ ok: true, progress: current });
    const storage = memoryStorage();
    expect(saveProgress(storage, current)).toBe(true);
    expect(loadProgress(storage)).toEqual(current);
  });

  it('filters invalid logic IDs, keeps the latest 100, and clamps impossible scores', () => {
    const ids = Array.from({ length: 130 }, (_, index) => `logic_${index}`);
    const raw = {
      ...sample(),
      repair: { recent: ['repair_kept'], answered: 15, correct: 10, sets: 3 },
      logic: {
        recent: [null, {}, 4, ...ids, '', '<script>', 'HAS CAPITALS', 'a'.repeat(101)],
        answered: 3,
        correct: 99,
        sets: -1,
      },
    };
    const imported = parseImport(JSON.stringify(raw));
    expect(imported.ok).toBe(true);
    if (!imported.ok) throw new Error(imported.error);
    expect(imported.progress.logic).toEqual({ recent: ids.slice(-100), answered: 3, correct: 3, sets: 0 });
    expect(imported.progress.logic.recent).toHaveLength(MAX_ACTIVITY_RECENT);
    expect(imported.progress.repair).toEqual(raw.repair);
    expect(imported.progress.boxes).toEqual(raw.boxes);
    expect(imported.progress.attempts).toEqual(raw.attempts);
  });

  it('defaults malformed logic data and invalid counts without replacing valid quiz data', () => {
    for (const logic of ['corrupt', null, [], { recent: 'bad', answered: -2, correct: 1.5, sets: 'many' }]) {
      const clean = sanitizeProgress({ ...sample(), logic })!;
      expect(clean).toEqual(sample());
    }
    const clean = sanitizeProgress({ ...sample(), logic: { recent: ['logic_kept'], answered: 1.5, correct: 4, sets: 2 } })!;
    expect(clean.logic).toEqual({ recent: ['logic_kept'], answered: 0, correct: 0, sets: 2 });
    expect(clean.daily).toEqual(sample().daily);
  });
});
