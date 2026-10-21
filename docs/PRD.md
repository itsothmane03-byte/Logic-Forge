# Fallacy Forge — Product spec (v1.0)

**One line:** learn to spot bad arguments in five minutes a day.

**Owner:** Othmane (itsothmane03-byte). Free, open source (MIT), no accounts, no payments, no backend. Hosted on GitHub Pages.

## Who it is for
- Students in critical-thinking, debate, philosophy or media-literacy courses.
- Curious adults who want to read news, ads and social posts more sharply.
- Teachers who want a free practice link to share.

## The problem with v0 (why we rebuilt)
- **Flashcards, not reasoning.** One-line statements (about 70 characters) that announce their own fallacy ("A famous actor says it cures colds, so it works").
- **Broken "sound" items.** Many were instructions or proposals, not arguments, so "sound or flawed?" made no sense.
- **Duplicate and mislabelled fallacies.** Circular reasoning appeared 3 times; bandwagon and appeal to popularity were separate.
- **Unfinished app.** Practice, gauntlet and library were never built.

## Core idea
Real-world reasoning practice: short, realistic passages (posts, emails, chats, headlines, ads, reviews, speeches) where the flaw is embedded among normal sentences, plus **sound near-misses**, arguments that look fallacious but aren't. The skill we teach is discrimination, not memorisation.

Every question is two small steps:
1. **Spot:** is the reasoning sound or flawed?
2. **Name:** if flawed, which fallacy? Four options; the wrong ones are deliberately the most confusable fallacies.

Then **Learn**: the flawed phrase is highlighted in the passage, with a one-line explanation and "why it's not <the closest look-alike>".

## Modes (v1)
| Mode | What | Why |
|---|---|---|
| **Daily Forge** | The same 10 questions for everyone each day (seeded by date), with a Wordle-style share grid | Habit plus free word-of-mouth |
| **Practice** | An endless adaptive set of 10; mistakes come back sooner (spaced repetition) | Mastery |
| **Focus** | 10 questions on one chosen fallacy, mixed with look-alikes so it can't be pattern-matched | Targeted study from the library |
| **Review mistakes** | Recent misses only | Quick fix-up |
| **Library** | All 38 fallacies: definition, how to spot, classic example, "don't confuse with", example passages, "Practice this" | Reference and learning |
| **Progress** | Mastery per fallacy, streak, practice-day heatmap, accuracy trend, export/import, reset | Motivation |

## Non-goals for v1
- No accounts, cloud sync, leaderboards, payments or ads.
- No live AI generation of questions: it costs money, can't be reviewed, and needs a backend.
- **v1.1 candidate:** "Analyze any text". The user pastes a post or article and gets possible fallacies, using the user's own API key stored in their browser (bring your own key), so it costs the owner nothing.
- English only (French possible later).

## Success criteria for the release
1. **Content:**
   - 38 fallacies, about 304 questions (6 flawed + 2 sound near-misses per fallacy).
   - Every question passes the automated validator and a blind review (an independent reviewer labels it without seeing the answer).
   - Disagreements are fixed or dropped.
2. **Quality:**
   - WCAG 2.2 AA; works with keyboard only.
   - Lighthouse accessibility 100, performance 90 or more on mobile.
   - No console errors.
   - JS bundle 150 KB gzip or less, excluding data.
3. **Works:** offline after the first visit (PWA, installable); 320 px phones up to wide desktop; light and dark.
4. **Shipped:**
   - Public GitHub repo with a README (screenshots, live link) and green CI.
   - Live on GitHub Pages; tagged v1.0.0 with a changelog.

## Roadmap after v1
- "Analyze any text" with the user's own API key.
- French.
- Teacher links: a shareable custom set of fallacies via URL parameters, no backend.
- Monthly content drops (new passages, same validator and review).
