// Scroll reveals as progressive enhancement (UI-SPEC "Scroll-reveal motion").
//
// Content is visible by default. Only when IntersectionObserver exists AND the
// user has not asked for reduced motion do we add html.reveal-ready, which lets
// CSS pre-hide [data-reveal] blocks. Each block is revealed once (then
// unobserved) when 15% of it enters the viewport, or immediately if anything
// inside it receives focus.

const REVEALED = 'is-revealed';
const OBSERVED = 'data-reveal-observed';

let started = false;

export function canReveal(win: Window = window): boolean {
  const reduced = typeof win.matchMedia === 'function' && win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return 'IntersectionObserver' in win && typeof win.IntersectionObserver === 'function' && !reduced;
}

export function initReveal(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  if (!canReveal()) return;

  const root = document.documentElement;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add(REVEALED);
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
  );

  const scan = () => {
    document.querySelectorAll(`[data-reveal]:not([${OBSERVED}])`).forEach((el) => {
      el.setAttribute(OBSERVED, '');
      observer.observe(el);
    });
  };

  const mutations = new MutationObserver(scan);
  mutations.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('focusin', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-reveal]') : null;
    if (target && !target.classList.contains(REVEALED)) {
      target.classList.add(REVEALED);
      observer.unobserve(target);
    }
  });

  // If the user turns on reduced motion later, show everything immediately.
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (event) => {
    if (event.matches) root.classList.remove('reveal-ready');
  });

  root.classList.add('reveal-ready');
  scan();
}
