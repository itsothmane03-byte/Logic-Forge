/* app.js */
// Minimal loader for fallacies.json and propositions.json plus UI initialisers for arena and gauntlet
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

// Validate propositions using fallacies definitions
function validate(props, fallacies) {
  const idRe = /^prp_[a-z0-9_]+$/;
  const diffs = new Set(['beginner','intermediate','advanced']);
  const fallacyIds = new Set(fallacies.all.map(f => f.id));
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

// Quick log for counts and validation
Promise.all([loadFallacies(), loadPropositions()]).then(([f,p]) => {
  console.log('fallacies:', f.all.length);
  console.log('propositions:', p.length);
  validate(p, f);
}).catch(console.error);

// --- helpers for UI and rotation ---
function byIdMap(arr) {
  return Object.fromEntries(arr.map(x => [x.id, x]));
}
function sample(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}
function similarExamples(current, props) {
  const same = current.fallacyId
    ? props.filter(p => !p.isSound && p.fallacyId === current.fallacyId && p.id !== current.id)
    : [];
  const sounds = props.filter(p => p.isSound && p.id !== current.id);
  return {
    similar: same.length ? sample(same).text : null,
    contrast: sounds.length ? sample(sounds).text : null
  };
}

// Practice Arena initialiser
async function initArena(){
  const [F, P] = await Promise.all([loadFallacies(), loadPropositions()]);
  const fallacyById = byIdMap(F.all);
  const sel = document.getElementById('label');
  sel.innerHTML =
    `<option value="">Choose…</option>` +
    F.all.map(f => `<option value="${f.id}">${f.name}</option>`).join('') +
    `<option value="sound">Sound</option><option value="unclear">Unclear</option>`;
  const propEl = document.getElementById('prop');
  const fb = document.getElementById('fb');
  const simBox = document.getElementById('similar');
  const st = { lastId:null, lastFallacy:null, sameStreak:0 };
  let current = null;
  function show(p){
    propEl.textContent = p.text;
    fb.textContent = '';
    simBox.textContent = '';
    sel.value = '';
  }
  function next(){
    current = (window.rotation ? window.rotation.pick(P, st) : sample(P));
    show(current);
  }
  document.getElementById('submit').onclick = () => {
    const v = sel.value;
    const correct = current.isSound ? (v === 'sound') : (v === current.fallacyId);
    fb.textContent = correct ? 'Correct' :
      'Wrong — Correct: ' + (current.isSound ? 'Sound' : fallacyById[current.fallacyId].name);
    const ex = similarExamples(current, P);
    const sim = ex.similar ? `Similar: “${ex.similar}”` : '';
    const con = ex.contrast ? `Contrast: “${ex.contrast}”` : '';
    simBox.textContent = [sim, con].filter(Boolean).join('  |  ');
  };
  document.getElementById('next').onclick = next;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); document.getElementById('submit').click(); }
    if (e.code === 'Space') { e.preventDefault(); document.getElementById('next').click(); }
  });
  next();
}

// Seeded RNG for Gauntlet
function mulberry32(a){ return function(){ a|=0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a>>>15, 1 | a); t = t + Math.imul(t ^ t>>>7, 61 | t) ^ t; return ((t ^ t>>>14) >>> 0) / 4294967296; }; }
function seededPick(pool, st, rng){
  const lastId = st.lastId, lastFal = st.lastFallacy;
  const cands = pool.filter(p =>
    p.id !== lastId &&
    !(lastFal && p.fallacyId === lastFal && st.sameStreak >= 2)
  );
  const list = cands.length ? cands : pool;
  return list[Math.floor(rng() * list.length)];
}

// Gauntlet initialiser (10 items, seedable)
async function initGauntlet(){
  const [F, P] = await Promise.all([loadFallacies(), loadPropositions()]);
  const fallacyById = byIdMap(F.all);
  const sel = document.getElementById('g-label');
  sel.innerHTML =
    `<option value="">Choose…</option>` +
    F.all.map(f => `<option value="${f.id}">${f.name}</option>`).join('') +
    `<option value="sound">Sound</option><option value="unclear">Unclear</option>`;
  const startBtn = document.getElementById('g-start');
  const seedEl = document.getElementById('g-seed');
  const run = document.getElementById('g-run');
  const propEl = document.getElementById('g-prop');
  const prog = document.getElementById('g-progress');
  const results = document.getElementById('g-results');
  const submitBtn = document.getElementById('g-submit');
  startBtn.onclick = () => {
    const seedStr = seedEl.value.trim() || String(Date.now());
    const rng = mulberry32(Array.from(seedStr).reduce((a,c)=>a+c.charCodeAt(0),0));
    const st = { lastId:null, lastFallacy:null, sameStreak:0 };
    const seq = [];
    for (let i=0;i<10;i++) seq.push(seededPick(P, st, rng));
    let idx = 0;
    const answers = [];
    function show(i){
      const p = seq[i];
      propEl.textContent = p.text;
      sel.value = '';
      prog.textContent = `Item ${i+1} / 10`;
    }
    run.style.display = '';
    results.style.display = 'none';
    show(idx);
    submitBtn.onclick = () => {
      const p = seq[idx];
      const v = sel.value;
      const correct = p.isSound ? (v==='sound') : (v===p.fallacyId);
      answers.push({ id:p.id, your:v||'(blank)', correct: p.isSound ? 'sound' : p.fallacyId, ok: !!correct });
      idx++;
      if (idx < 10) show(idx);
      else {
        const score = answers.filter(a=>a.ok).length;
        const acc = Math.round(100*score/10);
        if (acc >= 80) localStorage.setItem('ff_unlock_intermediate','1');
        let html = `<p>Accuracy: <b>${acc}%</b></p><table border="1" cellpadding="4"><tr><th>#</th><th>Prop</th><th>Your</th><th>Correct</th></tr>`;
        let n=0;
        for (const a of answers){
          const pObj = P.find(x=>x.id===a.id);
          const yourName = a.your==='sound' ? 'Sound' : (fallacyById[a.your]?.name || a.your);
          const correctName = a.correct==='sound' ? 'Sound' : (fallacyById[a.correct]?.name || a.correct);
          html += `<tr><td>${++n}</td><td>${pObj.text}</td><td>${yourName}</td><td>${correctName}</td></tr>`;
        }
        html += `</table>`;
        results.innerHTML = html;
        results.style.display = '';
        run.style.display = 'none';
      }
    };
  };
}

// Kick off the application
initArena().catch(console.error);
initGauntlet().catch(console.error);
