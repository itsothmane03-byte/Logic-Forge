# Contributing to Fallacy Forge

Thanks for helping. Fallacy Forge is a free, MIT-licensed practice app with no backend, so most contributions are either **content** (passages and fallacy entries) or **code** (the app itself).

## Ground rules

- No accounts, analytics, trackers or runtime network calls. Everything runs in the browser.
- Accessibility is a requirement, not a feature: WCAG 2.2 AA, full keyboard support, visible focus, nothing conveyed by color alone.
- Keep the app's JavaScript under 150 KB gzip (the build checks this).
- Be kind in reviews and in the content itself: the voice is friendly, precise and never sarcastic.

## Setup

```bash
npm ci
npm run dev
```

Node 22.22+ or 24.15+ is required. See [the architecture notes](docs/ARCHITECTURE.md) for the app's structure and data flow.

## Adding or editing content

Content is the product, so it follows [`docs/CONTENT-SPEC.md`](docs/CONTENT-SPEC.md) exactly. Read it before writing.

1. **Files.** Each fallacy has one pair of files:
   - `content/fallacies/<fallacy_id>.json`: the reference entry (name, aliases, definition, three tips, classic example, when it's legitimate, contrasts).
   - `content/items/<fallacy_id>.json`: exactly 8 items, 6 flawed (two each at difficulty 1, 2 and 3) and 2 sound near-misses.
2. **Ids and families are fixed.** The 38 ids, their families, difficulty labels and `confusableWith` lists live in [`scripts/canonical.mjs`](scripts/canonical.mjs), the single source of truth from CONTENT-SPEC section 1. Don't change them in content files.
3. **Writing standard, in short.**
   - Realistic voices; the flaw is embedded among ordinary sentences, and the `cue` is an exact, verbatim fraction of the passage.
   - Never name the fallacy or lean on its stock phrase. One primary fallacy per flawed item.
   - Sound near-misses are real arguments (premises leading to a conclusion), not instructions or opinions.
   - Fictional people, brands, towns and outlets only; no partisan hot-button topics; US English.
4. **Validate while you write:**

   ```bash
   npm run content:check   # every rule except completeness (all 38, exactly 8 each)
   ```

5. **Before opening a pull request**, run the strict build, which also regenerates `src/data/bank.json` (commit it together with your content):

   ```bash
   npm run content
   npm test
   ```

   The validator prints a numbered list of errors (file, item id and rule) plus distribution stats. CI fails on any error, and a test fails if `bank.json` is out of date with the content.
6. **Blind review.** New or changed items are labeled by an independent reviewer who sees only the passage and the list of fallacies. Items the reviewer disagrees with, or flags as ambiguous, stacked, inaccurate or sensitive, are rewritten or dropped.

## Changing code

- TypeScript is strict. Engine logic in `src/engine/` stays pure (no DOM, no storage access) and gets unit tests in `tests/engine/`.
- Run the same gates as CI before pushing:

  ```bash
  npm run typecheck
  npm run content
  npm test
  npm run build
  ```

- Keep source files focused (roughly 800 lines at most).
- For UI changes, check the affected flow in a browser with keyboard controls, light and dark themes, and a 320px layout. Check reduced motion when changing animations.

## Commits and pull requests

- Use conventional commit messages: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `perf:`, `ci:` or `chore:`. Content changes use a scope, for example `feat(content): add sunk cost passages`.
- Describe what changed and how you checked it. For UI changes, include a screenshot in light and dark.
