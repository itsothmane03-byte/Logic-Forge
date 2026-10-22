import { describe, expect, it } from 'vitest';
import { defaultProgress, MAX_REPAIR_RECENT, parseImport, sanitizeProgress, serializeExport } from '../../src/engine/storage';

describe('repair progress compatibility', () => {
  it('loads an old save/export with empty repair history and preserves quiz mastery', () => {
    const { repair: _repair, ...legacy } = defaultProgress();
    legacy.boxes = { fal_ad_hominem: 4 };
    legacy.attempts = [{ itemId: 'itm_ad_hominem_01', at: 123, outcome: 'correct', mode: 'daily' }];
    const imported = parseImport(JSON.stringify(legacy));
    expect(imported.ok).toBe(true);
    if (!imported.ok) throw new Error(imported.error);
    expect(imported.progress.boxes).toEqual(legacy.boxes);
    expect(imported.progress.attempts).toEqual(legacy.attempts);
    expect(imported.progress.repair).toEqual(defaultProgress().repair);
  });

  it('exports and imports repair history together with the existing quiz progress', () => {
    const p = { ...defaultProgress(), repair: { recent: ['repair_one', 'repair_two'], answered: 2, correct: 1, sets: 0 } };
    const imported = parseImport(serializeExport(p));
    expect(imported).toEqual({ ok: true, progress: p });
    expect(defaultProgress().repair).toEqual({ recent: [], answered: 0, correct: 0, sets: 0 });
  });

  it('drops corrupt history entries, caps history, and clamps impossible scores', () => {
    const p = sanitizeProgress({ ...defaultProgress(), repair: {
      recent: [null, {}, '<script>', ...Array.from({ length: 120 }, (_, index) => `repair_${index}`)],
      answered: 3, correct: 99, sets: -1,
    } })!;
    expect(p.repair.recent).toHaveLength(MAX_REPAIR_RECENT);
    expect(p.repair.recent[0]).toBe('repair_20');
    expect(p.repair.correct).toBe(3);
    expect(p.repair.sets).toBe(0);
    expect(sanitizeProgress({ ...p, repair: 'corrupt' })!.repair).toEqual(defaultProgress().repair);
  });
});
