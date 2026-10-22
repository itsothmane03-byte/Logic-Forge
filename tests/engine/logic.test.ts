import { describe, expect, it } from 'vitest';
import { logicItems } from '../../src/data/logic';
import { evaluateLogic, logicExamples, logicVerdict, selectLogic, type LogicExpr, type LogicItem, type LogicVerdict } from '../../src/engine/logic';

const atom = (id: string): LogicExpr => ({ kind: 'atom', id });
const not = (value: LogicExpr): LogicExpr => ({ kind: 'not', value });
const binary = (kind: 'and' | 'or' | 'implies', left: LogicExpr, right: LogicExpr): LogicExpr => ({ kind, left, right });

const expected: Record<string, LogicVerdict> = {
  logic_library_locker: 'must', logic_greenhouse_valve: 'must', logic_parcel_receipt: 'must',
  logic_choir_room: 'must', logic_art_equipment: 'must', logic_makerspace_lights: 'must',
  logic_door_pin: 'cannot', logic_bakery_sign: 'cannot', logic_museum_guide: 'cannot',
  logic_bike_ready: 'cannot', logic_rehearsal_email: 'cannot', logic_shuttle_routes: 'cannot',
  logic_studio_code: 'possible', logic_battery_warning: 'possible', logic_seminar_equipment: 'possible',
  logic_garden_soil: 'possible', logic_lunch_packing: 'possible', logic_network_test: 'possible',
};

function idsIn(expr: LogicExpr): string[] {
  if (expr.kind === 'atom') return [expr.id];
  if (expr.kind === 'not') return idsIn(expr.value);
  return [...idsIn(expr.left), ...idsIn(expr.right)];
}

function hasOr(expr: LogicExpr): boolean {
  if (expr.kind === 'or') return true;
  if (expr.kind === 'atom') return false;
  if (expr.kind === 'not') return hasOr(expr.value);
  return hasOr(expr.left) || hasOr(expr.right);
}

const base = (): LogicItem => ({
  id: 'test', title: 'Test', atoms: { a: 'A.', b: 'B.' },
  premises: [{ text: 'If A, B.', expr: binary('implies', atom('a'), atom('b')) }],
  claim: { text: 'B.', expr: atom('b') }, explanation: 'Test.', lesson: 'Test.',
});

describe('propositional semantics', () => {
  it('evaluates all binary truth-table rows, including inclusive or and a false if-condition', () => {
    const rows = [
      { a: false, b: false, and: false, or: false, implies: true },
      { a: false, b: true, and: false, or: true, implies: true },
      { a: true, b: false, and: false, or: true, implies: false },
      { a: true, b: true, and: true, or: true, implies: true },
    ];
    for (const row of rows) {
      for (const kind of ['and', 'or', 'implies'] as const) {
        expect(evaluateLogic(binary(kind, atom('a'), atom('b')), row)).toBe(row[kind]);
      }
      expect(evaluateLogic(not(atom('a')), row)).toBe(!row.a);
    }
  });

  it('does not silently treat a missing truth value as false', () => {
    expect(() => evaluateLogic(atom('missing'), {})).toThrow('Missing truth value');
    expect(() => evaluateLogic(atom('toString'), {})).toThrow('Missing truth value');
  });

  it('distinguishes a required claim, its required opposite, and an undecided claim', () => {
    const item = base();
    expect(logicVerdict(item)).toBe('possible');
    item.premises.push({ text: 'A.', expr: atom('a') });
    expect(logicVerdict(item)).toBe('must');
    item.claim = { text: 'Not B.', expr: not(atom('b')) };
    expect(logicVerdict(item)).toBe('cannot');
  });

  it('rejects contradictory premises instead of awarding a vacuous result', () => {
    const item = base();
    item.premises.push({ text: 'A.', expr: atom('a') }, { text: 'Not B.', expr: not(atom('b')) });
    expect(() => logicVerdict(item)).toThrow('contradictory facts');
  });

  it('rejects undeclared atoms even in a branch that could short-circuit', () => {
    const item = base();
    item.claim.expr = binary('or', atom('a'), atom('missing'));
    expect(() => logicVerdict(item)).toThrow('undefined atom missing');
  });

  it('bounds model enumeration and rejects an empty vocabulary', () => {
    const item = base();
    item.atoms = {};
    expect(() => logicVerdict(item)).toThrow('expected 1–12 atoms');
    item.atoms = Object.fromEntries(Array.from({ length: 13 }, (_, index) => [`p${index}`, 'Statement.']));
    expect(() => logicVerdict(item)).toThrow('expected 1–12 atoms');
  });
});

describe('logic examples', () => {
  it('returns situations satisfying every fact and the promised claim value', () => {
    for (const item of logicItems) {
      const examples = logicExamples(item);
      for (const [claimValue, assignment] of [[true, examples.whenTrue], [false, examples.whenFalse]] as const) {
        if (!assignment) continue;
        expect(Object.keys(assignment).sort(), item.id).toEqual(Object.keys(item.atoms).sort());
        expect(item.premises.every((premise) => evaluateLogic(premise.expr, assignment)), item.id).toBe(true);
        expect(evaluateLogic(item.claim.expr, assignment), item.id).toBe(claimValue);
      }
      if (expected[item.id] === 'must') {
        expect(examples.whenTrue, item.id).not.toBeNull();
        expect(examples.whenFalse, item.id).toBeNull();
      } else if (expected[item.id] === 'cannot') {
        expect(examples.whenTrue, item.id).toBeNull();
        expect(examples.whenFalse, item.id).not.toBeNull();
      } else {
        expect(examples.whenTrue, item.id).not.toBeNull();
        expect(examples.whenFalse, item.id).not.toBeNull();
      }
    }
  });

  it('rejects contradictory facts and undeclared references just like the verdict function', () => {
    const contradictory = base();
    contradictory.premises.push({ text: 'A.', expr: atom('a') }, { text: 'Not B.', expr: not(atom('b')) });
    expect(() => logicExamples(contradictory)).toThrow('contradictory facts');
    const undeclared = base();
    undeclared.claim.expr = binary('or', atom('a'), atom('missing'));
    expect(() => logicExamples(undeclared)).toThrow('undefined atom missing');
  });

  it('returns fresh examples so displaying or changing one cannot corrupt later verdicts', () => {
    const item = logicItems.find((candidate) => candidate.id === 'logic_library_locker')!;
    const example = logicExamples(item).whenTrue!;
    example.code = false;
    expect(logicExamples(item).whenTrue!.code).toBe(true);
    expect(logicVerdict(item)).toBe('must');
  });
});

describe('the authored logic exercises', () => {
  it('has 18 distinct, balanced exercises whose intended verdicts follow from their models', () => {
    expect(logicItems).toHaveLength(18);
    expect(new Set(logicItems.map((item) => item.id)).size).toBe(18);
    expect(logicItems.map((item) => item.id).sort()).toEqual(Object.keys(expected).sort());
    const counts = { must: 0, cannot: 0, possible: 0 };
    for (const item of logicItems) {
      const result = logicVerdict(item);
      expect(result, item.id).toBe(expected[item.id]);
      counts[result] += 1;
    }
    expect(counts).toEqual({ must: 6, cannot: 6, possible: 6 });
  });

  it('uses short, self-contained statements with two to four premises and a small vocabulary', () => {
    for (const item of logicItems) {
      expect(item.id).toMatch(/^logic_[a-z0-9_]+$/);
      expect(item.premises.length, item.id).toBeGreaterThanOrEqual(2);
      expect(item.premises.length, item.id).toBeLessThanOrEqual(4);
      expect(Object.keys(item.atoms).length, item.id).toBeGreaterThanOrEqual(2);
      expect(Object.keys(item.atoms).length, item.id).toBeLessThanOrEqual(5);
      expect(item.title.length).toBeLessThanOrEqual(45);
      expect(item.claim.text.length).toBeLessThanOrEqual(120);
      expect(item.explanation.length).toBeLessThanOrEqual(220);
      expect(item.lesson.length).toBeLessThanOrEqual(100);
      const texts = [item.title, item.claim.text, item.explanation, item.lesson, ...Object.values(item.atoms), ...item.premises.map((p) => p.text)];
      for (const text of texts) expect(text.trim().length, item.id).toBeGreaterThan(0);
      for (const premise of item.premises) expect(premise.text.length, item.id).toBeLessThanOrEqual(125);
      const referenced = new Set([...item.premises.flatMap((p) => idsIn(p.expr)), ...idsIn(item.claim.expr)]);
      expect([...referenced].sort(), item.id).toEqual(Object.keys(item.atoms).sort());
    }
  });

  it('makes the inclusive meaning of or explicit wherever an or-expression is shown', () => {
    for (const item of logicItems) {
      for (const statement of [...item.premises, item.claim]) {
        if (!hasOr(statement.expr)) continue;
        expect(statement.text.toLowerCase(), item.id).toContain('at least one');
        expect(statement.text.toLowerCase(), item.id).toContain('possibly both');
      }
    }
  });

  it('has real witnesses for both cases in every could-be-either exercise', () => {
    // Explicit examples of both cases give an independent check on the
    // intended reading of each scenario, not another copy of the solver loop.
    const witnesses: Record<string, [Record<string, boolean>, Record<string, boolean>]> = {
      logic_studio_code: [{ reserved: true, code: true }, { reserved: false, code: true }],
      logic_battery_warning: [{ low: false, warning: true }, { low: false, warning: false }],
      logic_seminar_equipment: [{ board: true, projector: true }, { board: false, projector: true }],
      logic_garden_soil: [{ rain: true, sprinkler: false, wet: true }, { rain: false, sprinkler: true, wet: true }],
      logic_lunch_packing: [{ soup: true, rice: true, salad: true }, { soup: true, rice: false, salad: false }],
      logic_network_test: [{ passed: true, network: true, power: true }, { passed: false, network: false, power: true }],
    };
    const possible = logicItems.filter((item) => expected[item.id] === 'possible');
    expect(Object.keys(witnesses).sort()).toEqual(possible.map((item) => item.id).sort());
    for (const item of possible) {
      const cases = witnesses[item.id]!;
      for (const assignment of cases) {
        expect(item.premises.every((p) => evaluateLogic(p.expr, assignment)), item.id).toBe(true);
      }
      expect(evaluateLogic(item.claim.expr, cases[0]), item.id).toBe(true);
      expect(evaluateLogic(item.claim.expr, cases[1]), item.id).toBe(false);
    }
  });
});

describe('logic selection', () => {
  const ids = (items: readonly LogicItem[]) => items.map((item) => item.id);

  it('selects five unique exercises deterministically and varies the set with the seed', () => {
    const first = selectLogic(logicItems, [], 'one');
    expect(first).toHaveLength(5);
    expect(new Set(ids(first)).size).toBe(5);
    expect(selectLogic(logicItems, [], 'one')).toEqual(first);
    const sets = new Set(Array.from({ length: 10 }, (_, index) => ids(selectLogic(logicItems, [], `seed-${index}`)).sort().join()));
    expect(sets.size).toBeGreaterThan(1);
  });

  it('uses all unseen items before recycling the least recently answered items', () => {
    const pool = logicItems.slice(0, 8);
    const history = ids(pool.slice(0, 5));
    expect(ids(selectLogic(pool, history, 'seed')).sort()).toEqual(ids([...pool.slice(5), ...pool.slice(0, 2)]).sort());
    const repeated = [...history, pool[0]!.id];
    expect(ids(selectLogic(pool.slice(0, 3), repeated, 'seed', 2)).sort()).toEqual(ids(pool.slice(1, 3)).sort());
  });

  it('gets through the full bank across sets while avoiding the preceding set', () => {
    const recent: string[] = [];
    let previous: string[] = [];
    for (let round = 0; round < 6; round += 1) {
      const picked = ids(selectLogic(logicItems, recent, `round-${round}`));
      expect(picked.filter((id) => previous.includes(id))).toEqual([]);
      if (round === 3) expect(new Set([...recent, ...picked]).size).toBe(logicItems.length);
      recent.push(...picked);
      previous = picked;
    }
  });

  it('handles small pools, duplicates, unknown history and invalid sizes without mutating inputs', () => {
    const pool = Object.freeze([logicItems[0]!, logicItems[1]!, logicItems[0]!]);
    const history = Object.freeze(['logic_removed', logicItems[0]!.id]);
    expect(ids(selectLogic(pool, history, 'seed', 10)).sort()).toEqual(ids(logicItems.slice(0, 2)).sort());
    expect(selectLogic(pool, history, 'seed', 1)).toEqual([logicItems[1]]);
    for (const size of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) expect(selectLogic(pool, history, 'seed', size)).toEqual([]);
    expect(pool).toHaveLength(3);
    expect(history).toEqual(['logic_removed', logicItems[0]!.id]);
  });
});
