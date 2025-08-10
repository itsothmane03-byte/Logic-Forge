/* app.js */
// Minimal loader for fallacies.json and propositions.json
// Pattern for proposition IDs used by loaders
var idre = /^prp_[a-z0-9_]+$/;

// Load fallacies from JSON
async function loadFallacies(url = 'data/fallacies.json') {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load ' + url + ': ' + res.status);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('fallacies.json must be an array');
  const idRe = /^fal_[a-z0-9_]+$/;
  const diffs = new Set(['beginner','intermediate','advanced']);
  for (const f of data) {
    for (const k of ['id','name','difficulty','definition']) {
      if (!(k in f)) throw new Error('Missing required field ' + k + ' on ' + JSON.stringify(f));
    }
    if (!idRe.test(f.id)) throw new Error('Bad id: ' + f.id);
    if (!diffs.has(f.difficulty)) throw new Error('Bad difficulty: ' + f.difficulty);
    if (f.aliases && !Array.isArray(f.aliases)) throw new Error('aliases must be array on ' + f.id);
    if (f.confusableWith && !Array.isArray(f.confusableWith)) throw new Error('confusableWith must be array on ' + f.id);
    if (f.rationaleTips && !Array.isArray(f.rationaleTips)) throw new Error('rationaleTips must be array on ' + f.id);
  }
  const byId = Object.fromEntries(data.map(f => [f.id, f]));
  const aliasIndex = {};
  for (const f of data) {
    const names = [f.name].concat(f.aliases || []);
    for (const n of names) {
      const key = String(n).trim().toLowerCase();
      if (!key) continue;
      if (!(key in aliasIndex)) aliasIndex[key] = f.id;
    }
  }
  return { all: data, byId: byId, aliasIndex: aliasIndex };
}

// Load propositions from JSON
async function loadPropositions(url = 'data/propositions.json') {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load ' + url + ': ' + res.status);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('propositions.json must be an array');
  const idRe = /^prp_[a-z0-9_]+$/;
  const diffs = new Set(['beginner','intermediate','advanced']);
  for (const p of data) {
    for (const k of ['id','text','isSound','difficulty','explanation']) {
      if (!(k in p)) throw new Error('Missing ' + k + ' on ' + (p.id || 'item'));
    }
    if (!idRe.test(p.id)) throw new Error('Bad id: ' + p.id);
    if (!diffs.has(p.difficulty)) throw new Error('Bad difficulty: ' + p.difficulty);
    if (p.isSound && p.fallacyId !== null) throw new Error('Sound item must have fallacyId=null (' + p.id + ')');
    if (!p.isSound && !p.fallacyId) throw new Error('Fallacious item must set fallacyId (' + p.id + ')');
  }
  return data;
}

// Validate propositions with fallacies
function validate(props, fallacies) {
  const idRe = /^prp_[a-z0-9_]+$/;
  const diffs = new Set(['beginner','intermediate','advanced']);
  const fallacyIds = new Set(fallacies.all.map(function(f) { return f.id; }));
  let errors = 0;
  let sound = 0;
  for (const p of props) {
    if (!idRe.test(p.id)) { console.warn('Bad id', p.id); errors++; }
    if (!diffs.has(p.difficulty)) { console.warn('Bad difficulty', p.id); errors++; }
    if (p.isSound && p.fallacyId !== null) { console.warn('Sound needs null fallacyId', p.id); errors++; }
    if (!p.isSound && !fallacyIds.has(p.fallacyId)) { console.warn('Unknown fallacyId', p.id); errors++; }
    if (p.isSound) sound++;
  }
  const ratio = sound / props.length;
  console.log('validate', { errors: errors, soundRatio: Number(ratio.toFixed(2)) });
  return { errors: errors, ratio: ratio };
}

// On load quick test
Promise.all([loadFallacies(), loadPropositions()]).then(function(values) {
  const f = values[0];
  const p = values[1];
  console.log('fallacies:', f.all.length);
  console.log('propositions:', p.length);
  validate(p, f);
}).catch(function(err) {
  console.error(err);
  function validate(props, fallacies) {
  const idRe = /^prp_[a-z0-9_]+$/;
  const diffs = new Set(['beginner','intermediate','advanced']);
  const fallacyIds = new Set(fallacies.all.map(f => f.id));
  let errors = 0, sound = 0;
  for (const p of props) {
    if (!idRe.test(p.id)) { console.warn('Bad id', p.id); errors++; }
    if (!diffs.has(p.difficulty)) { console.warn('Bad difficulty', p.id); errors++; }
    if (p.isSound && p.fallacyId !== null) { console.warn('Sound needs null fallacyId', p.id); errors++; }
    if (!p.isSound && !fallacyIds.has(p.fallacyId)) { console.warn('Unknown fallacyId', p.id); errors++; }
    if (p.isSound) sound++;
  }
  const ratio = sound / props.length;
  console.log('validate', { errors, soundRatio: Number(ratio.toFixed(2)) });
  return { errors, ratio };
}

});
