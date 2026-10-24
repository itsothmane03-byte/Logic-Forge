// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { hrefFor, matchHash, parseHash, route, startRouter, type Route } from '../src/router';

describe('hash router', () => {
  it('parses every supported route', () => {
    expect(parseHash('')).toEqual({ name: 'welcome' });
    expect(parseHash('#/')).toEqual({ name: 'welcome' });
    expect(parseHash('#/welcome')).toEqual({ name: 'welcome' });
    expect(parseHash('#/today')).toEqual({ name: 'today' });
    expect(parseHash('#/setup')).toEqual({ name: 'setup' });
    expect(parseHash('#/practice')).toEqual({ name: 'practice' });
    expect(parseHash('#/repair')).toEqual({ name: 'repair' });
    expect(parseHash('#/logic')).toEqual({ name: 'logic' });
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

  it('sends unknown routes to Home', () => {
    for (const hash of ['#/nope', '#/play', '#/play/blitz', '#/library/a/b', '#main', '#/play/focus/<script>']) {
      expect(matchHash(hash)).toBeNull();
      expect(parseHash(hash)).toEqual({ name: 'welcome' });
    }
  });

  it('recovers from malformed percent escapes instead of crashing on navigation', () => {
    for (const hash of ['#/%', '#/%ZZ', '#/library/%E0%A4%A', '#/play/focus/%C0%AF', '#/library/%ED%A0%80']) {
      expect(matchHash(hash)).toBeNull();
      expect(parseHash(hash)).toEqual({ name: 'welcome' });
    }
  });

  it('still accepts correctly encoded route segments', () => {
    expect(parseHash('#/library/fal_straw%5Fman')).toEqual({ name: 'fallacy', fallacyId: 'fal_straw_man' });
  });

  it('uses distinct canonical URLs for Home and Today while retaining the Welcome alias', () => {
    expect(hrefFor({ name: 'welcome' })).toBe('#/');
    expect(hrefFor({ name: 'today' })).toBe('#/today');
    expect(parseHash('#/welcome')).toEqual(parseHash('#/'));
  });

  it('normalizes an invalid browser hash to Home with a matching route', () => {
    history.replaceState(null, '', '#/bad%');
    const stop = startRouter();
    try {
      expect(location.hash).toBe('#/');
      expect(route.peek()).toEqual({ name: 'welcome' });
    } finally {
      stop();
    }
  });

  it('round-trips through hrefFor', () => {
    const routes: Route[] = [
      { name: 'today' },
      { name: 'welcome' },
      { name: 'setup' },
      { name: 'practice' },
      { name: 'repair' },
      { name: 'logic' },
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
