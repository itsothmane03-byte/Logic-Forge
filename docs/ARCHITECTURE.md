# Architecture

Fallacy Forge is a static browser app hosted on GitHub Pages at
[fallacyforge.com](https://fallacyforge.com/). There is no backend,
account system, analytics or runtime AI. Progress stays in the learner's browser.

## App and routes

- Vite builds strict TypeScript and Preact; `@preact/signals` holds app state.
- The [hash router](../src/router.ts) works at the custom domain or a subpath.
  Today (`#/`) is the entry point. Other screens are `#/practice`, `#/setup`,
  `#/repair`, `#/logic`, `#/library`, `#/library/:id`, `#/progress`, `#/about`,
  `#/welcome` and `#/summary`. Quizzes use `#/play/:mode` or `#/play/focus/:id`.
  The welcome URL is an optional introduction within About, not a second home.
- [Engine modules](../src/engine) handle selection, scoring, deduction, storage
  and progress. [State modules](../src/state) connect them to the UI.
- Daily Forge is shared by date. Practice adapts to quiz history; familiar topics
  are preferences after skill, difficulty and freshness, rather than hard filters.
  The optional five-question warm-up uses self-reported comfort, not a diagnosis.
- Repair and deduction have separate collections and scores. Reviewing an earlier
  question is read only; it must preserve the live question and any answer draft.

## Content and saved data

- `content/fallacies/` and `content/items/` are the authored quiz JSON.
  `npm run content` validates them and generates the committed
  [bank.json](../src/data/bank.json). Keep that output with content changes.
- [CONTENT-SPEC.md](CONTENT-SPEC.md) defines writing rules and schemas;
  [canonical.mjs](../scripts/canonical.mjs) defines IDs, families and limits.
  Review evidence lives in [content/review](../content/review).
- [repairs.ts](../src/data/repairs.ts) and [logic.ts](../src/data/logic.ts) are
  authored separately. Deduction answers are computed from the stated facts.
- [storage.ts](../src/engine/storage.ts) validates and migrates browser-local
  progress under `fallacyforge:v1`, including preferences and activity scores.
  Export/import uses JSON; no progress is uploaded. Keep older saves compatible.
  Saves belong to the browser origin; moving domains requires exporting from the
  old origin and importing at the new one.
- Checked answers save immediately. Active drafts live in memory; Daily results
  can resume after a refresh. Reset, import and learning changes in another tab
  invalidate active sessions; preference-only changes preserve them.

## UI constraints

- Plain CSS and [design tokens](../src/ui/styles/tokens.css); self-hosted fonts.
  Keep the orange eye identity. See [brand notes](brand/README.md) for exports.
- Target WCAG 2.2 AA: semantic controls, keyboard access, visible focus, labelled
  feedback and dialogs, and text or icons alongside result colours. Check 320px
  layouts, zoom, and both themes when changing the UI.
- Motion uses progressive enhancement and respects `prefers-reduced-motion`.
  Keep content visible without reveal support; never delay a question or answer.

## Build and deployment

- Use `npm ci` and `npm run dev`. Before shipping, run `npm run typecheck`,
  `npm run content`, `npm test` and `npm run build` (the CI checks).
- The build enforces a 150 KB gzip budget for app JavaScript, excluding the
  separate question-bank chunk. No additional runtime service is required.
- [vite.config.ts](../vite.config.ts) configures relative asset paths, install
  icons and the updating service worker. The production PWA works offline after
  its assets have been cached; development mode does not establish offline support.
- [CI](../.github/workflows/ci.yml) checks pushes and pull requests.
  [Pages](../.github/workflows/pages.yml) builds the committed bank and deploys
  `main`. Public URLs and app identity live in [config.ts](../src/config.ts).
