// Validates authored teaching notes; no HTML or automatic semantic diffing.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** @param {unknown} items @returns {string[]} */
export function validateRepairReviews(items) {
  const errors = [];
  if (!Array.isArray(items) || items.length === 0) return ['Repair collection must not be empty.'];
  const ids = new Set();
  for (const item of items) {
    const id = item?.id ?? '(missing id)';
    const fail = (message) => errors.push(`${id}: ${message}`);
    if (typeof item?.id !== 'string' || !item.id.trim() || ids.has(id)) fail('Expected a unique exercise id.');
    ids.add(id);
    const options = Array.isArray(item?.options) ? item.options : [];
    const correct = options.filter((option) => option?.correct === true);
    if (correct.length !== 1 || typeof correct[0]?.text !== 'string') {
      fail('Expected exactly one strongest revision with plain text.');
      continue;
    }
    const review = item.review;
    if (!review || !Array.isArray(review.highlights) || review.highlights.length === 0) {
      fail('Expected authored post-answer highlights.');
      continue;
    }
    let end = 0;
    for (const excerpt of review.highlights) {
      if (typeof excerpt !== 'string' || !excerpt.trim()) {
        fail('Highlights must be nonempty text.');
        continue;
      }
      const start = correct[0].text.indexOf(excerpt);
      if (start < 0 || start !== correct[0].text.lastIndexOf(excerpt)) {
        fail(`Highlight must occur exactly once in the strongest revision: ${JSON.stringify(excerpt)}`);
      } else if (start < end) {
        fail('Highlights must be ordered and must not overlap.');
      }
      end = start + excerpt.length;
    }
    if (typeof review.question !== 'string' || !review.question.trim().endsWith('?') || review.question.length > 220) {
      fail('Expected a concise follow-up question ending in ? (maximum 220 characters).');
    }
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // Node 22.22+ supports the type-only import in this authored data file.
  const { repairs } = await import('../src/data/repairs.ts');
  const errors = validateRepairReviews(repairs);
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`Validated post-answer teaching notes for ${repairs.length} repair exercises.`);
  }
}
