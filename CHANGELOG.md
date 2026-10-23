# Changelog

All notable changes to this project are documented here.

## 2.4.0 — 2026-10-22

- **Familiar topics.** Optional Everyday life, Work and Technology preferences for new Spot the flaw and Focus sets. Reasoning skill, difficulty and freshness come before topic preference; missing topic coverage falls back to the wider collection. Preferences save locally and support older imports.
- **Show another.** Replace an unanswered Practice or Focus example without recording an attempt or changing scores. Replacements keep the difficulty and question mix, avoid all planned and replaced IDs, and preserve earlier answers. Daily Forge and mistake review retain their original questions.
- **Plain language.** Revised 40 passages to explain or remove specialist terms and provide needed facts. All 304 questions now label background knowledge separately from reasoning difficulty; specialist content is excluded from adaptive practice.

## 2.3.0 — 2026-10-22

- **Look back during practice.** Previous and Next let you revisit answered questions in all three activities. Your original choices and explanations stay visible, and Return to current restores your unfinished answer without changing scores.
- **Clear review boundaries.** Earlier answers are read only. Reopened Daily sets explain when an original choice is unavailable rather than inventing one.
- **Installed icon.** Enlarged the existing orange eye inside Android's maskable safe zone for clearer home-screen display.

## 2.2.0 — 2026-10-22

- **What follows?** 18 fictional deduction puzzles in sets of five. Classify a claim as necessarily true, necessarily false, or possible either way. Answers are checked across every permitted combination of facts, with optional concrete examples.
- **Less reading before practice.** Three compact activity cards, shorter Today and Welcome pages, and expandable help. Fixed the desktop Review card layout.
- **Retry missed exercises.** Revisit only the arguments or deduction puzzles missed in the set you just finished. Checked attempts count in each activity’s separate local scores.
- **Reliable progress.** Completed quiz history saves with the last answer, even if the page closes before Continue. Reset/import and learning changes from another tab discard stale sessions in all three activities. Old exports remain compatible.
- **Corrections.** Malformed URL escapes recover safely. Two quiz explanations now describe sampling and randomized evidence without overstating certainty.

## 2.1.0 — 2026-10-22

- **Fix the argument.** 15 fictional exercises across 15 fallacies for choosing a better revision of an everyday argument. Five-exercise sets, shuffled choices, specific feedback for each choice, results, and recency-based selection without repeats within a set.
- **Practice hub.** Choose between Spot the flaw and Fix the argument, with entry points from Today and Welcome.
- **Separate repair progress.** Scores and history save locally alongside existing data, with export/import/reset and compatibility with older exports. Identification mastery, quiz accuracy and Daily streaks keep their existing meaning.
- **Honest quiz feedback.** "Why not X?" now refers only to a fallacy the learner actually selected and for which a written comparison exists. Sound choices and unrelated wrong names no longer receive an unrelated comparison.
- **Verification.** Added regression tests for answer-specific feedback, repair flows, selection and saved-data compatibility. Clarified that the documented AI blind reviews cover the original quiz bank.

## 2.0.0 — 2026-10-20

Rebuilt as Fallacy Forge: a full rewrite of the 2025 MVP, from one-line flashcards into a real-world reasoning trainer.

- **New core loop.** Spot (is the reasoning sound or flawed?), Name (four options, where the wrong ones are the closest look-alikes) and Learn (the flawed phrase highlighted in the passage, a short explanation, and why it isn't the nearest confusable).
- **New question bank.** 38 fallacies in 6 families and 304 realistic passages in eight formats (social posts, emails, group chats, headlines, ads, reviews, speeches and overheard quotes), including 76 sound near-misses. Every item passes the automated validator and a blind review.
- **Modes.** A Daily Forge that is the same for everyone with a Wordle-style share grid, adaptive Practice driven by Leitner boxes, Focus on one fallacy mixed with its look-alikes, and Review mistakes.
- **Library.** All 38 fallacies with a definition, three tips for spotting it, a classic example, when the move is actually legitimate, contrasts with its look-alikes, and two example passages with a "Reveal answer" toggle.
- **Progress.** Mastery per fallacy, current and best streak, a 20-week practice heatmap, an accuracy trend, and export, import and reset of local data.
- **Welcome page.** A live mini-demo with a real question, plus restrained scroll-reveal motion built as progressive enhancement (reduced-motion safe, content never hidden without JavaScript).
- **Platform.** Vite, TypeScript (strict), Preact and signals; an installable offline PWA; light and dark themes; keyboard shortcuts; WCAG 2.2 AA as the target. No accounts, analytics or network calls.
- **Tooling.** Content validator and bank builder, a Vitest suite, GitHub Actions CI and GitHub Pages deployment.

## 1.0.0 — 2025-08-10
- Arena, Gauntlet, Library.
- Rotation simulate within bounds; validator 0 errors.
- A11y and responsive pass.
