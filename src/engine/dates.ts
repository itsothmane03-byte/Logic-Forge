// Local-calendar date helpers. Keys are local `YYYY-MM-DD` strings so that
// "a day" always means the learner's own calendar day, not UTC.

const pad = (n: number): string => String(n).padStart(2, '0');

/** Local `YYYY-MM-DD` for a Date or epoch milliseconds. */
export function dateKey(at: Date | number = new Date()): string {
  const d = typeof at === 'number' ? new Date(at) : at;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parses a `YYYY-MM-DD` key. Returns null when invalid. */
export function parseKey(key: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) return null;
  return { y, m, d };
}

export function isDateKey(key: unknown): key is string {
  return typeof key === 'string' && parseKey(key) !== null;
}

/** Whole calendar days from `a` to `b` (positive when b is later). DST-safe. */
export function daysBetween(a: string, b: string): number {
  const pa = parseKey(a);
  const pb = parseKey(b);
  if (!pa || !pb) return Number.NaN;
  const ua = Date.UTC(pa.y, pa.m - 1, pa.d);
  const ub = Date.UTC(pb.y, pb.m - 1, pb.d);
  return Math.round((ub - ua) / 86_400_000);
}

/** Shifts a key by whole days. */
export function addDays(key: string, delta: number): string {
  const p = parseKey(key);
  if (!p) return key;
  const t = new Date(Date.UTC(p.y, p.m - 1, p.d + delta));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Weekday of a key, 0 = Sunday. */
export function weekdayOf(key: string): number {
  const p = parseKey(key);
  if (!p) return 0;
  return new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Oct 12" */
export function shortDate(key: string): string {
  const p = parseKey(key);
  if (!p) return key;
  return `${MONTHS[p.m - 1]} ${p.d}`;
}

/** Milliseconds until the next local midnight. */
export function msUntilMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return Math.max(0, next.getTime() - now.getTime());
}
