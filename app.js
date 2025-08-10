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


async function loadPropositions(url = 'data/propositions.json') {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('propositions.json must be an array');
   idRe = /^prp_[a-z0-9_]+$/;
  const diffs = new Set(['beginner','intermediate','advanced']);
  for (const p of data) {
    for (const k of ['id','text','isSound','difficulty','explanation']) {
      if (!(k in p)) throw new Error(`Missing "${k}" on ${p.id || 'item'}`);
    }
    if (!idRe.test(p.id)) throw new Error(`Bad id: ${p.id}`);
    if (!diffs.has(p.difficulty)) throw new Error(`Bad difficulty: ${p.difficulty}`);
    if (p.isSound && p.fallacyId !== null) throw new Error(`Sound item must have fallacyId=null (${p.id})`);
    if (!p.isSound && !p.fallacyId) throw new Error(`Fallacious item must set fallacyId (${p.id})`);
  }
  return data;
}

Promise.all([loadFallacies(), loadPropositions()])
  .then(([f, p]) => {
    console.log('fallacies:', f.all.length);
    console.log('propositions:', p.length);
  })
  .catch(console.error);

