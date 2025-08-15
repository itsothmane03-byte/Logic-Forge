/* app.js — loaders, validator, arena, gauntlet, library (fixed) */

// ---------- Globals / utils
const ID_RE = /^prp_[a-z0-9_]+$/;
function byIdMap(arr){ return Object.fromEntries(arr.map(x => [x.id, x])); }
function sample(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

// ---------- Loaders
async function loadFallacies(url='data/fallacies.json'){
  const res = await fetch(url, { cache: 'no-store' });
  if(!res.ok) throw new Error('Failed to load '+url+': '+res.status);
  const all = await res.json();
  return { all, byId: byIdMap(all) };
}
async function loadPropositions(url='data/propositions.json'){
  const res = await fetch(url, { cache: 'no-store' });
  if(!res.ok) throw new Error('Failed to load '+url+': '+res.status);
  return res.json();
}

// Simple cache so we don’t reload per section
const Cache = { F: null, P: null };
async function getData(){
  if (!Cache.F || !Cache.P){
    const [F, Praw] = await Promise.all([loadFallacies(), loadPropositions()]);
    const activeFallacies = F.all.filter(f => f.status !== 'deprecated');
    const activeProps = Praw.filter(p => p.status !== 'deprecated');
    Cache.F = { ...F, active: activeFallacies };
    Cache.P = activeProps;
  }
  return Cache;
}

// ---------- Validator
function validatePropositions(props, fallacies){
  const diffs = new Set(['beginner','intermediate','advanced']);
  const fallacyIds = new Set(fallacies.all.map(f => f.id));
  const seen = new Set();
  let errors = 0, sound = 0;
  for (const p of props){
    if (!ID_RE.test(p.id)) { console.warn('Bad id', p.id); errors++; }
    if (seen.has(p.id)) { console.warn('Duplicate id', p.id); errors++; }
    else seen.add(p.id);
    if (!diffs.has(p.difficulty)) { console.warn('Bad diff', p.id); errors++; }
    if (p.isSound && p.fallacyId !== null) { console.warn('Sound needs null fallacyId', p.id); errors++; }
    if (!p.isSound && !fallacyIds.has(p.fallacyId)) { console.warn('Unknown fallacyId', p.id, p.fallacyId); errors++; }
    if (p.isSound) sound++;
  }
  const ratio = sound / (props.length || 1);
  if (ratio < 0.15 || ratio > 0.35) console.warn('Sound ratio out of ~20% target:', ratio.toFixed(2));
  console.log('validate', { errors, soundRatio: Number(ratio.toFixed(2)), total: props.length });
  return { errors, ratio };
}

// Run quick counts + validator at startup
(async()=>{
  try{
    const {F, P} = await getData();
    console.log('fallacies:', F.all.length, '(active:', F.active.length, ')');
    console.log('propositions:', P.length);
    validatePropositions(P, F);
  }catch(e){ console.error(e); }
})();

// ---------- Practice Arena
function similarExamples(current, props){
  const same = current.fallacyId
    ? props.filter(p => !p.isSound && p.fallacyId === current.fallacyId && p.id !== current.id)
    : [];
  const sounds = props.filter(p => p.isSound && p.id !== current.id);
  return {
    similar: same.length ? sample(same).text : null,
    contrast: sounds.length ? sample(sounds).text : null
  };
}

async function initArena(){
  // Guard: only run if arena elements exist
  if (!document.getElementById('prop')) return;
  const {F, P} = await getData();
  const fallacyById = F.byId;
  const sel = document.getElementById('label');
  const options = F.active.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
  sel.innerHTML = `<option value="">Choose…</option>${options}<option value="sound">Sound</option><option value="unclear">Unclear</option>`;

  const propEl = document.getElementById('prop');
  const fb = document.getElementById('fb');
  const simBox = document.getElementById('similar');

  const st = { lastId:null, lastFallacy:null, sameStreak:0 };
  let current = null;

  function next(){
    current = (window.rotation && typeof window.rotation.pick === 'function')
      ? window.rotation.pick(P, st)
      : sample(P);
    propEl.textContent = current.text;
    fb.textContent = '';
    simBox.textContent = '';
    sel.value = '';
  }

  document.getElementById('submit').onclick = () => {
    const v = sel.value;
    const correct = current.isSound ? (v === 'sound') : (v === current.fallacyId);
    fb.textContent = correct
      ? 'Correct'
      : 'Wrong — Correct: ' + (current.isSound ? 'Sound' : (fallacyById[current.fallacyId]?.name || current.fallacyId));
    const ex = similarExamples(current, P);
    const sim = ex.similar ? `Similar: “${ex.similar}”` : '';
    const con = ex.contrast ? `Contrast: “${ex.contrast}”` : '';
    simBox.textContent = [sim, con].filter(Boolean).join('  |  ');
  };
  document.getElementById('next').onclick = next;

  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter') { e.preventDefault(); document.getElementById('submit').click(); }
    if (e.code === 'Space') { e.preventDefault(); document.getElementById('next').click(); }
  });

  next();
}

// ---------- Gauntlet (seeded 10)
function mulberry32(a){
  return function(){
    a|=0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a>>>15, 1 | a);
    t = t + Math.imul(t ^ t>>>7, 61 | t) ^ t;
    return ((t ^ t>>>14) >>> 0) / 4294967296;
  };
}
function seededPick(pool, st, rng){
  const lastId = st.lastId, lastFal = st.lastFallacy;
  const cands = pool.filter(p => p.id !== lastId && !(lastFal && p.fallacyId === lastFal && st.sameStreak >= 2));
  const list = cands.length ? cands : pool;
  const p = list[Math.floor(rng() * list.length)];
  if (p.fallacyId && p.fallacyId === st.lastFallacy) st.sameStreak++; else st.sameStreak = 0;
  st.lastId = p.id; st.lastFallacy = p.fallacyId;
  return p;
}

async function initGauntlet(){
  // Guard: only run if gauntlet elements exist
  if (!document.getElementById('g-start')) return;
  const {F, P} = await getData();
  const fallacyById = byIdMap(F.all);
  const sel = document.getElementById('g-label');
  sel.innerHTML =
    `<option value="">Choose…</option>`+
    F.active.map(f => `<option value="${f.id}">${f.name}</option>`).join('')+
    `<option value="sound">Sound</option><option value="unclear">Unclear</option>`;

  const startBtn = document.getElementById('g-start');
  const seedEl = document.getElementById('g-seed');
  const run = document.getElementById('g-run');
  const propEl = document.getElementById('g-prop');
  const prog = document.getElementById('g-progress');
  const results = document.getElementById('g-results');
  const submitBtn = document.getElementById('g-submit');

  startBtn.onclick = () => {
    const seedStr = (seedEl.value || '').trim() || String(Date.now());
    const rng = mulberry32(Array.from(seedStr).reduce((a,c)=>a+c.charCodeAt(0),0));
    const st = { lastId:null, lastFallacy:null, sameStreak:0 };
    const seq = Array.from({length:10}, ()=> seededPick(P, st, rng));

    let idx = 0; const answers = [];
    function show(i){ const p = seq[i]; propEl.textContent = p.text; sel.value = ''; prog.textContent = `Item ${i+1} / 10`; }

    run.style.display = '';
    results.style.display = 'none';
    show(idx);

    submitBtn.onclick = () => {
      const p = seq[idx];
      const v = sel.value;
      const correct = p.isSound ? (v==='sound') : (v===p.fallacyId);
      answers.push({ id:p.id, your:v||'(blank)', correct: p.isSound ? 'sound' : p.fallacyId, ok: !!correct });
      idx++;
      if (idx < 10) { show(idx); }
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

// ---------- Reference Library
async function initLibrary(){
  // Guard: only run if library container exists
  if (!document.getElementById('lib-list')) return;
  const {F} = await getData();
  const q = document.getElementById('lib-q');
  const d = document.getElementById('lib-diff');
  const list = document.getElementById('lib-list');

  function render(items){
    list.innerHTML = items.map(f => {
      const conf = (f.confusableWith||[])
        .map(id => `<button class="chip" data-go="${id}" title="Open ${id}">${F.byId[id]?.name||id}</button>`)
        .join(' ') || '—';
      return `
        <article class="card" data-id="${f.id}" id="${f.id}" style="border:1px solid #ddd;padding:8px;margin:6px 0">
          <h3 style="margin:0 0 4px 0">${f.name}</h3>
          <div><b>Aliases:</b> ${(f.aliases||[]).join(', ')||'—'}</div>
          <div><b>Definition:</b> ${f.definition}</div>
          <div><b>Confusables:</b> ${conf}</div>
        </article>
      `;
    }).join('');
  }

  // delegate clicks on chips
  list.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-go]');
    if (!btn) return;
    const id = btn.getAttribute('data-go');
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({behavior:'smooth', block:'start'}); el.style.outline = '2px solid #333'; setTimeout(()=> el.style.outline = '', 1200); }
  });

  function apply(){
    const term = (q.value||'').toLowerCase();
    const diff = d.value;
    const filtered = F.all.filter(f => {
      const diffOk = diff==='all' || f.difficulty===diff;
      const hay = [f.name, ...(f.aliases||[])].join(' ').toLowerCase();
      return diffOk && hay.includes(term);
    }).filter(f => f.status !== 'deprecated');
    render(filtered);
  }

  q.addEventListener('input', apply);
  d.addEventListener('change', apply);
  render(F.active);
}

// ---------- Boot
initArena().catch(console.error);
initGauntlet().catch(console.error);
initLibrary().catch(console.error);
