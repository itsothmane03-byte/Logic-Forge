// rotation.js – very basic rotation skeleton
window.rotation = (() => {
  function pick(pool, state) {
    const lastId = state.lastId;
    const lastFal = state.lastFallacy;
    // Filter out immediate repeat and cap same-fallacy streak at 2
    const candidates = pool.filter(p =>
      p.id !== lastId &&
      !(lastFal && p.fallacyId === lastFal && state.sameStreak >= 2)
    );
    // If no candidates, fall back to full pool
    const list = candidates.length ? candidates : pool;
    return list[Math.floor(Math.random() * list.length)];
  }

  function simulate(pool, turns = 500) {
    const st = { lastId: null, lastFallacy: null, sameStreak: 0 };
    let sound = 0, maxStreak = 0, repeats = 0, prev = null;
    for (let i = 0; i < turns; i++) {
      const p = pick(pool, st);
      if (prev && p.id === prev.id) repeats++;
      if (p.fallacyId && p.fallacyId === st.lastFallacy) {
        st.sameStreak++;
      } else {
        st.sameStreak = 0;
      }
      maxStreak = Math.max(maxStreak, st.sameStreak);
      if (p.isSound) sound++;
      st.lastId = p.id;
      st.lastFallacy = p.fallacyId;
      prev = p;
    }
    const soundRatio = Number((sound / turns).toFixed(2));
    console.log({ soundRatio, maxStreak, immediateRepeats: Number((repeats / turns).toFixed(3)) });
  }

  return { pick, simulate };
})();
