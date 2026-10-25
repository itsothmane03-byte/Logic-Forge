---
name: Fallacy Forge
description: A restrained workbench for reading arguments and practising reasoning.
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
  structure: "#1f6971"
  good: "#157a43"
  good-soft: "#e3f4ea"
  bad: "#b3261e"
  bad-soft: "#fce8e6"
  warn: "#8a5a00"
  warn-soft: "#fff3d6"
typography:
  headline:
    fontFamily: "'Bricolage Grotesque Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Bricolage Grotesque Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  body:
    fontFamily: "'Inter Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "'cv11', 'ss03'"
  label:
    fontFamily: "'Inter Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 650
    lineHeight: 1.2
rounded:
  control: "6px"
  card: "8px"
  sheet: "12px"
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
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
    rounded: "{rounded.control}"
    padding: "0 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 20px"
  search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "14px"
    padding: "0 48px 0 46px"
    height: "52px"
  navigation-link:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.control}"
    padding: "0 10px"
  filter-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
  filter-chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
  daily-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "28px"
---

# Design System: Fallacy Forge

## Overview

**Creative North Star: "Argument workbench"**

Crisp reading fields, strong ink, restrained petrol structure and the retained orange eye make reasoning the focus. The interface is direct and compact, with plain headings, visible rules and a clear next action. It follows the owner's preference to avoid a playful, game-like feel.

This is a record of the implemented static Preact app, derived from its CSS and components. Home, Daily Forge and practice selection establish the current entry patterns; focused exercises and passage formats retain some older depth and geometry. This is a code-led system, with no selected external visual catalogue or generated raster composition. CSS remains the source of truth. The frontmatter captures the reused light-theme vocabulary, not every format-specific value; live custom properties supply both themes.

**Key Characteristics:**

- Neutral reading fields with ink rules.
- Orange actions and identity; petrol task structure.
- Labelled progress and explicit feedback states.
- Compact entry controls alongside retained exercise-specific rendering.

## Colors

The palette combines cool neutral paper and ink with one warm action accent, a quieter structural colour and semantic feedback pairs.

### Primary

- **Forge Orange** (`accent`): the eye mark, primary actions, navigation underline and progress emphasis. `accent-ink` is the dark text used on orange controls; `accent-edge` defines their border. `accent-soft` supplies selection and focus halos; `accent-strong` supplies readable orange text on neutral surfaces.

### Secondary

- **Petrol Structure** (`structure`): connected Home reasoning stages. It identifies task position rather than correctness.

### Neutral

- **Cool Paper** (`bg`), **Reading White** (`surface`) and **Quiet Field** (`surface-2`): page, reading region and secondary field respectively.
- **Reading Ink** (`ink`), **Supporting Ink** (`ink-2`) and **Muted Ink** (`ink-3`): primary content, supporting copy and quieter metadata.
- **Fine Rule** (`line`) and **Control Rule** (`line-strong`): dividers, region boundaries and stronger control edges.

Correct, incorrect and partial outcomes use `good`, `bad` and `warn`, each with its paired soft background. Keep outcome words or accessible labels alongside colour. The existing family-dot and activity-heat scales remain defined in `tokens.css`; they are specialised vocabularies, not additional action accents.

**The Semantic Colour Rule.** Use orange for identity and actions, petrol for the Home task path, and the feedback pairs for outcomes; an outcome must have a text equivalent.

Theme switching replaces the same custom properties through `data-theme` or the system colour preference. Dark mode changes surfaces, ink, accent, structure and feedback together. Daily Forge uses the theme's neutral surface in both modes.

The sidecar's tonal strips are generated preview aids, not additional application tokens or approved colour scales.

## Typography

**Display Font:** Bricolage Grotesque Variable, with UI sans-serif fallbacks.
**Body Font:** Inter Variable, with platform sans-serif fallbacks.
**Label/Mono Font:** the body face for ordinary labels; the platform monospace stack for keyboard hints. Some retained headline and quotation passage treatments use the existing system serif stack.

The display face gives headings a compact, firm character. The body face supports sustained reading and dense controls without decorative casing.

### Hierarchy

- **Headline:** the frontmatter headline role is the desktop page title; mobile page titles step down to the title size. Home has its own fluid heading (`clamp(1.75rem, 1.5rem + 1vw, 2.25rem)`), weight (800) and tighter tracking (-0.03em).
- **Title:** the Daily card heading uses the frontmatter title role. Home panel headings are smaller (1.0625rem, 700); practice activity headings are larger (1.5rem).
- **Body:** the frontmatter body role is the base. Home's passage is slightly enlarged (1.0625rem, line-height 1.6); focused passages use the shared medium size (1.125rem). Home introduction copy is capped at (48ch), and practice descriptions at (60ch).
- **Label:** the frontmatter label role describes filter chips. Navigation uses (0.9375rem, 600), Home sample metadata (0.8125rem), and path labels (0.75rem, 650). Numbers used for progress have tabular figures.

## Layout

The shared content width is (1080px), with desktop gutters (20px) and mobile gutters (16px). General pages use top and bottom spacing from the shared scale; focused sessions use a narrower reading width (680px). The shared scale is based on four-pixel steps with larger jumps for section separation; local values such as (28px) and (40px) remain intentional CSS decisions.

Home reads as one column before (900px), then places the argument and Daily card in a (1.8fr / 1fr) grid with a minimum Daily column (300px) and gap (40px). Activities below use compact rows and horizontal rules. Daily and practice supporting regions stack at (600px). Desktop chrome switches to the mobile header and four-item fixed bottom navigation at (767px); content accounts for the tab bar and safe-area inset.

**The Reading Order Rule.** Preserve argument, decision, explanation and next action in the document order; responsive layouts must keep that order legible without horizontal scrolling.

## Elevation & Depth

Home's argument and verdict controls, the Daily card, new practice rows and shared buttons are flat at rest. Fine rules and surface changes separate regions. Home explicitly removes the passage shadow and the focused session's offset button treatment, including its pressed movement. Focus remains visible with an ink outline (3px, offset 2px); shared controls can also carry the soft accent halo (6px).

The application is not uniformly shadow-free. Existing passages use `shadow-2`; search and selected segmented controls use `shadow-1`; dialogs use `shadow-3`; exercise feedback uses `shadow-sheet`. These diffuse depth tokens have dark-theme counterparts. The focused session's existing verdict buttons also retain a hard offset edge and pressed translation. That exception is recorded as legacy drift, not the rule for new entry controls.

Shared state transitions use the shared easing with standard duration (200ms); route entry uses the fast duration (160ms), and slower transitions use (240ms). Existing reveals and charts have their own animations. Reduced-motion styles suppress animation and transition duration across the app.

## Shapes

The shared radius vocabulary separates compact controls, reading cards, sheets and pills. Buttons and new navigation controls use `control`; Daily and passage containers use `card`; dialogs use `sheet`; chips, tags and progress tracks use `pill`. Circles identify path nodes and outcome icons.

These tokens do not imply a universal radius. Search retains (14px), segmented controls retain (14px) with (10px) inner options, and focused verdict controls retain (14px). Chat passages retain asymmetric bubble corners. New Home verdict controls explicitly use the shared control radius instead.

## Components

### Buttons

Clear, flat actions with a visible edge. Shared buttons have a minimum height (48px), border (1.5px), body type (1rem, 650) and the control radius. Primary uses orange with dark text; secondary uses a neutral surface; ink uses the main text colour as its fill; ghost removes the visible fill and border. Small and large variants use minimum heights (44px / 56px) and horizontal padding (14px / 26px).

Hover changes fill and edge treatment; pressing mixes the fill with the text colour. Focus uses the shared ink outline and accent halo. Disabled buttons replace fill, text and border with subdued theme roles and use a not-allowed cursor. Home's Sound / Flawed pair is a distinct inherited exercise control: (56px) minimum height, labelled outcome icons, the control radius, no resting or pressed shadow, and no pressed translation.

### Chips

Filters use pill geometry, minimum height (44px), a neutral surface and fine border. Hover strengthens the border and changes the surface. A selected filter reverses ink and background, with selection also exposed by its native control or `aria-pressed` state. Noninteractive tags and outcome badges are smaller; they must not imply a filter action.

### Cards / Containers

The Daily card is a neutral reading container with the card radius, strong one-pixel border and padding (28px); mobile padding becomes (20px 16px). Home result panels use semantic soft fill and matching border, with an icon, written verdict, fallacy name when applicable and explanation. Home's sample has a nearby, truthful “Fictional scenario · not scored” disclosure. Passage renderers keep their format-specific structure; answer cues appear only after checking.

### Inputs / Fields

Search is a surface-filled field (52px high), with a strong (1.5px) border, a retained rounded shape and low shadow. Its inline search icon leaves space for text; an optional keyboard hint appears only where appropriate. Focus strengthens the border and uses the shared focus treatment. Existing form errors use a bad-soft field with bad text; form notes use the warning pair. Segmented options are native radios; switches are native checkboxes with visible checked states.

### Navigation

Desktop uses a sticky neutral top bar (64px) and text links with minimum height (44px). Hover changes the background; the current section has an orange underline and `aria-current`. Home is identified by the linked eye and wordmark. Mobile uses a sticky header (56px) and four labelled SVG tabs; the current tab changes both label colour and icon background. Keep visible labels with the symbols.

### Connected progress

Home's Read / Decide / Understand path uses three labelled nodes, a connecting rule, filled completed nodes and an outlined current node. The path tracks the actual stage, never the answer. The Daily card displays ten connected nodes whose checked-answer states use outcome fills and accessible question labels. Empty, in-progress and completed Daily states change the status and action copy; the visual path is not a separate scoring mechanism.

## Do's and Don'ts

### Do:

- **Do** use the live CSS custom properties so controls follow both themes.
- **Do** use flat fields and ink rules for new entry surfaces, with the shared control radius for their actions.
- **Do** keep keyboard focus, explicit outcome labels and progress text alongside visual states.
- **Do** preserve the nearby fictional/unscored disclosure and delay answer-specific highlights until checking.
- **Do** reuse the existing passage renderers and focused exercise behaviour when extending those activities.

### Don't:

- **Don't** introduce a playful, game-like treatment or a paid-app onboarding funnel.
- **Don't** make the Daily region permanently dark or turn petrol into a competing primary action colour.
- **Don't** generalise Home's flat controls into a claim that all existing screens have no shadows or identical corners.
- **Don't** inherit the legacy offset verdict-button edge, uppercase eyebrow helpers or keyboard-shortcut glyph as new system motifs.

Not canonized: the focused session's hard offset verdict-button edge, existing uppercase eyebrow helpers and the desktop shortcut glyph remain outside this documentation-only change; their presence is not permission to reproduce them on new surfaces.
