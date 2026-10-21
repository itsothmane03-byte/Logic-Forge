# Changelog

All notable changes to this project are documented here.

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
