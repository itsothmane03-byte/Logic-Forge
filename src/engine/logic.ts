// Small propositional models for “What follows?”. Every permitted assignment
// is checked, so answers follow from the stated facts rather than an AI label.

import { rngFrom, shuffle } from './rng';

export type LogicVerdict = 'must' | 'cannot' | 'possible';

export type LogicExpr =
  | { kind: 'atom'; id: string }
  | { kind: 'not'; value: LogicExpr }
  | { kind: 'and' | 'or' | 'implies'; left: LogicExpr; right: LogicExpr };

export interface LogicItem {
  id: string;
  title: string;
  atoms: Record<string, string>;
  premises: Array<{ text: string; expr: LogicExpr }>;
  claim: { text: string; expr: LogicExpr };
  explanation: string;
  lesson: string;
}

export const LOGIC_SESSION_SIZE = 5;
const MAX_ATOMS = 12;

/** “Or” is inclusive: at least one side holds, and both may hold. */
export function evaluateLogic(expr: LogicExpr, assignment: Record<string, boolean>): boolean {
  switch (expr.kind) {
    case 'atom': {
      if (!Object.hasOwn(assignment, expr.id) || typeof assignment[expr.id] !== 'boolean') {
        throw new Error(`Missing truth value for ${expr.id}.`);
      }
      return assignment[expr.id]!;
    }
    case 'not': return !evaluateLogic(expr.value, assignment);
    case 'and': return evaluateLogic(expr.left, assignment) && evaluateLogic(expr.right, assignment);
    case 'or': return evaluateLogic(expr.left, assignment) || evaluateLogic(expr.right, assignment);
    case 'implies': return !evaluateLogic(expr.left, assignment) || evaluateLogic(expr.right, assignment);
  }
}

function atomIds(expr: LogicExpr): string[] {
  if (expr.kind === 'atom') return [expr.id];
  if (expr.kind === 'not') return atomIds(expr.value);
  return [...atomIds(expr.left), ...atomIds(expr.right)];
}

/**
 * Find one permitted situation for each claim value, checking every model.
 * A returned situation illustrates possibility; one example alone does not
 * establish that a claim must hold. Null means no such situation exists.
 * Contradictory facts and undefined atoms are authoring errors.
 */
export function logicExamples(item: LogicItem): {
  whenTrue: Record<string, boolean> | null;
  whenFalse: Record<string, boolean> | null;
} {
  const ids = Object.keys(item.atoms);
  if (ids.length === 0 || ids.length > MAX_ATOMS) {
    throw new Error(`${item.id}: expected 1–${MAX_ATOMS} atoms.`);
  }
  const used = [...item.premises.flatMap((premise) => atomIds(premise.expr)), ...atomIds(item.claim.expr)];
  for (const id of used) {
    if (!Object.hasOwn(item.atoms, id)) throw new Error(`${item.id}: undefined atom ${id}.`);
  }
  let whenTrue: Record<string, boolean> | null = null;
  let whenFalse: Record<string, boolean> | null = null;
  for (let mask = 0; mask < 2 ** ids.length; mask += 1) {
    const assignment = Object.fromEntries(ids.map((id, index) => [id, Boolean(mask & (1 << index))]));
    if (!item.premises.every((premise) => evaluateLogic(premise.expr, assignment))) continue;
    if (evaluateLogic(item.claim.expr, assignment)) whenTrue ??= assignment;
    else whenFalse ??= assignment;
  }
  if (!whenTrue && !whenFalse) throw new Error(`${item.id}: contradictory facts have no model.`);
  return { whenTrue, whenFalse };
}

/** Classify a claim across every situation allowed by the given facts. */
export function logicVerdict(item: LogicItem): LogicVerdict {
  const { whenTrue, whenFalse } = logicExamples(item);
  if (!whenFalse) return 'must';
  if (!whenTrue) return 'cannot';
  return 'possible';
}

/** Prefer unseen exercises, then the least recently answered; shuffle the set. */
export function selectLogic(
  items: readonly LogicItem[],
  recent: readonly string[],
  seed: string,
  size = LOGIC_SESSION_SIZE,
): LogicItem[] {
  const seen = new Map<string, number>();
  recent.forEach((id, index) => seen.set(id, index));
  const unique = new Map<string, LogicItem>();
  for (const item of items) if (!unique.has(item.id)) unique.set(item.id, item);
  const rng = rngFrom(`logic:${seed}`);
  const pool = shuffle([...unique.values()], rng);
  const fresh = pool.filter((item) => !seen.has(item.id));
  const recycled = pool.filter((item) => seen.has(item.id))
    .sort((a, b) => seen.get(a.id)! - seen.get(b.id)!);
  const count = Number.isFinite(size) ? Math.max(0, Math.min(pool.length, Math.floor(size))) : 0;
  return shuffle([...fresh, ...recycled].slice(0, count), rng);
}
