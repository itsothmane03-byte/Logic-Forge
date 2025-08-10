// app.js
// Minimal loader for fallacies.json
// Usage: loadFallacies().then(({all, byId, aliasIndex}) => console.log(all.length));

async function loadFallacies(url = 'fallacies.json') {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  /** @type {Array<any>} */
  const data = await res.json();

  // Basic shape checks
  if (!Array.isArray(data)) throw new Error('fallacies.json must be an array');
  const idRe = /^fal_[a-z0-9_]+$/;
  const diffs = new Set(['beginner','intermediate','advanced']);

  for (const f of data) {
    for (const k of ['id','name','difficulty','definition']) {
      if (!(k in f)) throw new Error(`Missing required field "${k}" on ${JSON.stringify(f)}`);
    }
    if (!idRe.test(f.id)) throw new Error(`Bad id: ${f.id}`);
    if (!diffs.has(f.difficulty)) throw new Error(`Bad difficulty: ${f.difficulty}`);
    if (f.aliases && !Array.isArray(f.aliases)) throw new Error(`aliases must be array on ${f.id}`);
    if (f.confusableWith && !Array.isArray(f.confusableWith)) throw new Error(`confusableWith must be array on ${f.id}`);
    if (f.rationaleTips && !Array.isArray(f.rationaleTips)) throw new Error(`rationaleTips must be array on ${f.id}`);
  }

  // Indexes
  const byId = Object.fromEntries(data.map(f => [f.id, f]));
  const aliasIndex = {};
  for (const f of data) {
    const names = [f.name, ...(f.aliases ?? [])];
    for (const n of names) {
      const key = String(n).trim().toLowerCase();
      if (!key) continue;
      if (!(key in aliasIndex)) aliasIndex[key] = f.id;
    }
  }

  return { all: data, byId, aliasIndex };
}

// Example bootstrap
// loadFallacies().then(({all}) => console.log('fallacies:', all.length)).catch(console.error);

