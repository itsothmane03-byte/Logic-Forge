console.log("app.js loaded");

// Expose globally so you can call it from the console
window.loadFallacies = async function loadFallacies(url = "fallacies.json") {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  const data = await res.json();

  if (!Array.isArray(data)) throw new Error("fallacies.json must be an array");
  const idRe = /^fal_[a-z0-9_]+$/;
  const diffs = new Set(["beginner","intermediate","advanced"]);
  for (const f of data) {
    for (const k of ["id","name","difficulty","definition"]) {
      if (!(k in f)) throw new Error(`Missing "${k}" on ${JSON.stringify(f)}`);
    }
    if (!idRe.test(f.id)) throw new Error(`Bad id: ${f.id}`);
    if (!diffs.has(f.difficulty)) throw new Error(`Bad difficulty: ${f.difficulty}`);
  }

  const byId = Object.fromEntries(data.map(f => [f.id, f]));
  const aliasIndex = {};
  for (const f of data) {
    for (const n of [f.name, ...(f.aliases ?? [])]) {
      const key = String(n).trim().toLowerCase();
      if (key) aliasIndex[key] = f.id;
    }
  }
  return { all: data, byId, aliasIndex };
};

