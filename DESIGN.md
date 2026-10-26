---
name: Fallacy Forge
description: An editorial workbench for reading arguments and practising reasoning.
colors:
  bg: "#f4f7f7"
  surface: "#ffffff"
  surface-2: "#eaf0f0"
  ink: "#142023"
  ink-2: "#46585c"
  ink-3: "#586a6e"
  line: "#dbe3e4"
  line-strong: "#809497"
  accent: "#ff6b3d"
  accent-ink: "#121212"
  accent-soft: "#ffe6dc"
  accent-edge: "#c4461d"
  accent-strong: "#a43b17"
  field: "#ff6b3d"
  desk: "#142023"
  good: "#157a43"
  good-soft: "#e3f4ea"
  bad: "#b3261e"
  bad-soft: "#fce8e6"
  warn: "#8a5a00"
  warn-soft: "#fff3d6"
typography:
  display:
    fontFamily: "'Newsreader Variable', ui-serif, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2.75rem, 1.6rem + 4.2vw, 5.5rem)"
    fontWeight: 500
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "'Newsreader Variable', ui-serif, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2rem, 1.3rem + 3.2vw, 4rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  title:
    fontFamily: "'Newsreader Variable', ui-serif, Georgia, 'Times New Roman', serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  lead:
    fontFamily: "'Inter Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem)"
    fontWeight: 400
    lineHeight: 1.35
  body:
    fontFamily: "'Inter Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "'cv11', 'ss03'"
  label:
    fontFamily: "'Inter Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  control: "3px"
  card: "4px"
  sheet: "8px"
  pill: "999px"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "12px"
  s-4: "16px"
  s-5: "24px"
  s-6: "32px"
  s-7: "48px"
  s-8: "64px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.control}"
    padding: "0 20px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 20px"
  verdict-choice:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "64px"
  paper-sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "0"
    padding: "64px"
  cell:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
    rounded: "0"
    height: "72px"
  stat-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "18px 20px"
---

# Design System: Fallacy Forge

## Overview

**Creative North Star: "The day's edition"**

Fallacy Forge reads like a well-made printed edition rather than a game. Home and About are pages, set as
pieces of stationery: a paper sheet on the Forge-orange field holds a real argument to judge, a contents
sheet on the ink desk lists the activities, and the back cover closes the page. Daily Forge, Practice, the
quizzes, the Library and Progress are app screens: quiet chrome, flat surfaces, colour on data and outcomes.

The direction was dealt by the Taste Skill (`page-is-the-object`, seed 964925646) and adapted to the
project rules. CSS custom properties in `src/ui/styles/tokens.css` are the source of truth; this file
records the shipped system.

**Key characteristics**

- An editorial serif (Newsreader) for headings, passages and statements; Inter for controls, labels and figures.
- One accent: Forge Orange on the eye mark, primary actions, the editor's mark and data.
- Filled shapes with real edges (scooped corners, serrated tear-off edges) instead of hairlines and shadows.
- Motion that confirms and orients; never motion that delays a question, an answer or feedback.

## Colors

- **Forge Orange** (`accent`): identity, primary actions, the drawn mark under a flaw, progress data.
  `accent-strong` is readable orange text on light surfaces; `accent-soft` is the mark's tint and the focus halo.
- **Field** (`field`): the ground Home and About print on. Forge Orange in light; a dark ember (#3a2219) in dark.
- **Desk** (`desk`): the ink ground under the contents sheet; near-black in dark.
- **Paper and ink**: `surface` for sheets and panels, `bg` for app pages, `surface-2` for one tone step.
  Running text is full `ink`; `ink-2` is for supporting notes only.
- **Outcomes**: `good`, `bad` and `warn` with their soft pairs. Every outcome also has words or an accessible label.

Dark mode replaces the same properties through `data-theme` or the system preference. Both themes are
checked at 320, 390, 640 (200% zoom of 1280), 768 and 1440px.

## Typography

- **Display** (Home and About titles): Newsreader 500, -0.03em, leading 0.95. The Home title is staggered on two lines.
- **Headline** (Home sections): Newsreader 600 at the head step, up to 64px.
- **Title** (app screens): Newsreader 600 at 32px, 26px on phones. App titles stay within 18–32px.
- **Lead** (one sentence under a title): Inter at 20–26px.
- **Body**: Inter 16px and up, leading 1.55; passages at 18px.
- **Label**: Inter 14px, sentence case. No tracked capitals, no eyebrow labels above headings.
- Figures use tabular numerals. Two typefaces in all; both self-hosted through Fontsource for the offline PWA.

## Layout

One frame for the whole site: the content width (1080px) and gutters (20px, 16px on phones) shared with
the top bar. Home sections are 96–160px apart and each has its own composition: the argument sheet, a
square Daily plate with spare text, the contents sheet, a statement with the families pushed right, side
facts with a wide paragraph, and the back cover. App screens keep a single reading column for sessions
(680px) and the content width elsewhere. The reading order is argument, decision, explanation, next action.

## Elevation and edges

Nothing rests on a shadow: `shadow-1` and `shadow-2` are empty. Only what floats casts one: dialogs
(`shadow-3`) and the answer sheet docked over a session (`shadow-sheet`). Pages separate surfaces with
tone steps and filled edges; app screens may use one quiet 1px border on panels, tables and controls.
Focus is a 3px ink outline with a soft accent halo; programmatic focus targets (headings) show none.

## Shapes

Controls use a 3px radius and cards 4px; sheets on pages are square, with scooped or serrated edges cut by
`clip-path` or field-coloured circles. Pills remain for filter chips and tags only.

## Components

- **Verdict choices** (Sound / Flawed): 64px, 1.5px ink border, plain coloured icons beside the word,
  inverting on hover and scaling to 0.97 on press. The same control on Home and in sessions.
- **Paper sheet** (Home, About): white on the field, scooped top corners, centred letterpress setting.
- **Contents sheet**: activities as a printed contents list with 4px round dot leaders and values.
- **Cells**: full-width ink and tone blocks for paired actions on Home.
- **Stat panel**: one container split by rules, label under value, values in the serif at 24–30px.
- **Daily plate**: the shared Daily card set square; outcome fills on its ten nodes.

## Motion

- **Signature: the editor's mark.** After a decision, an orange pencil line draws under the exact words
  that carry the flaw (720ms, expo out). The words are readable from the first frame.
- **Section entrances** on pages: heading, text, then details, rising 24px once in reading order
  (`data-reveal`, staggered 80ms, four steps at most). Nothing above the fold waits; nothing is hidden
  without script.
- **Feedback under the hand**: press scale on buttons and cells (140ms), hover colour behind
  `(hover: hover)` (180ms), arrows that move 4px on hover.
- **Quiz screens**: only feedback motion (the verdict settles 10px, the mark draws).
- **Reduced motion**: all durations collapse and every revealed block is shown at once.

Transform and opacity only, except the mark's underline, which grows its background size because a
transform cannot follow text across line breaks.

## Pictures

Pictures show documents, tools and places, never faces or living beings. They are archival, credited on
the page and on About, greyscale WebP under 80 KB, and precached for offline use. The software's own
pictures are its interface fragments (`data-ui`): the live argument and the Daily plate.

## Do's and Don'ts

### Do

- Use the live custom properties so every surface follows both themes.
- Keep questions, answers and feedback immediate; let motion confirm, not decide.
- Keep outcome words and accessible labels beside colour.
- Reveal answer-specific highlights only after checking.

### Don't

- Don't introduce a playful, game-like treatment, a paid-app funnel, or decorative loops.
- Don't use eyebrow labels, tracked capitals, hairline dividers, gradients or resting shadows on pages.
- Don't use pictures of faces or figures, or stock photography that stands in for the product.
- Don't load fonts or images from another host.

## Recorded allowances

Taste Skill inspector findings that stay, with the project rule that keeps them:

- `font-not-dealt` (all screens): the dealt faces are served from a third-party CDN; the app loads every
  asset from its own host and works offline, so Newsreader replaces them.
- `few-pictures` (About): pictures appear only where they serve the subject and contain no faces; About
  is reference text with one archival plate.
- `no-footage`, `size-count`, `ragged-edges`, `unused-canvas`: no honest clip fits reasoning practice;
  exercise components keep their own sizes; centred sheets and narrow session columns are deliberate.
- `covered-text` on phones may appear where a heading scrolls under the fixed tab bar, the primary navigation.
