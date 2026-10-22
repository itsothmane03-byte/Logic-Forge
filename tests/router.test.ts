import { describe, expect, it } from 'vitest';
import { hrefFor, matchHash, parseHash, type Route } from '../src/router';

describe('hash router', () => {
  it('parses every route in UI-SPEC', () => {
    expect(parseHash('')).toEqual({ name: 'today' });
    expect(parseHash('#/')).toEqual({ name: 'today' });
    expect(parseHash('#/welcome')).toEqual({ name: 'welcome' });
    expect(parseHash('#/practice')).toEqual({ name: 'practice' });
    expect(parseHash('#/repair')).toEqual({ name: 'repair' });
    expect(parseHash('#/play/daily')).toEqual({ name: 'play', mode: 'daily' });
    expect(parseHash('#/play/practice')).toEqual({ name: 'play', mode: 'practice' });
    expect(parseHash('#/play/review')).toEqual({ name: 'play', mode: 'review' });
    expect(parseHash('#/play/focus/fal_straw_man')).toEqual({ name: 'play', mode: 'focus', fallacyId: 'fal_straw_man' });
    expect(parseHash('#/summary')).toEqual({ name: 'summary' });
    expect(parseHash('#/library')).toEqual({ name: 'library' });
    expect(parseHash('#/library/fal_red_herring')).toEqual({ name: 'fallacy', fallacyId: 'fal_red_herring' });
    expect(parseHash('#/progress')).toEqual({ name: 'progress' });
    expect(parseHash('#/about')).toEqual({ name: 'about' });
  });

  it('sends unknown routes to Today', () => {
    for (const hash of ['#/nope', '#/play', '#/play/blitz', '#/library/a/b', '#main', '#/play/focus/<script>']) {
      expect(matchHash(hash)).toBeNull();
      expect(parseHash(hash)).toEqual({ name: 'today' });
    }
  });

  it('round-trips through hrefFor', () => {
    const routes: Route[] = [
      { name: 'today' },
      { name: 'welcome' },
      { name: 'practice' },
      { name: 'repair' },
      { name: 'play', mode: 'daily' },
      { name: 'play', mode: 'focus', fallacyId: 'fal_sunk_cost' },
      { name: 'summary' },
      { name: 'library' },
      { name: 'fallacy', fallacyId: 'fal_post_hoc' },
      { name: 'progress' },
      { name: 'about' },
    ];
    for (const r of routes) expect(parseHash(hrefFor(r))).toEqual(r);
  });
});
