# Fallacy Forge — UI spec

## Direction: "warm editorial, tactile learning"
Paper-warm surfaces, ink text, one forge-orange accent from the logo, bold grotesque display type, crisp 1px lines and soft layered depth. It should feel like a premium learning app, not a template.

**Reference patterns** (apps catalogued on Mobbin; copy the *pattern*, not the look):
- **Duolingo lesson anatomy:** close button plus segmented progress at the top; one task in the middle; a fixed bottom action bar ("Check"); a feedback sheet that slides up, tinted by result, with one "Continue" button. Tactile "chunky" buttons with a darker bottom edge that compresses on press.
- **Brilliant:** one problem per card, generous whitespace, option cards with unmistakable selected, correct and incorrect states; explanations as a calm second layer.
- **Wordle:** one numbered daily puzzle, a share grid, and a countdown to the next.
- **Headspace / Calm home:** a greeting, ONE hero card ("Today"), and a few secondary cards; low cognitive load.
- **GitHub:** a contribution heatmap for practice days.
- **Linear / Raycast:** fast keyboard search ("/" focuses it), crisp lists, subtle borders.

**Banned:**
- gradient-blob heroes;
- default component-library look;
- uniform card grids with no hierarchy;
- emoji as UI icons (emoji only inside the share text);
- grey-on-grey low contrast;
- walls of text.

## Design tokens (CSS custom properties)
**Light:**

| Token | Value |
|---|---|
| `--bg` | #FAF8F4 |
| `--surface` | #FFFFFF |
| `--surface-2` | #F3F0EA |
| `--ink` | #121212 |
| `--ink-2` | #4A4844 |
| `--line` | #E6E1D8 |
| `--accent` | #FF6B3D |
| `--accent-ink` | #121212 |
| `--accent-soft` | #FFE6DC |
| `--good` / `--good-soft` | #157A43 / #E3F4EA |
| `--bad` / `--bad-soft` | #B3261E / #FCE8E6 |
| `--warn` / `--warn-soft` | #8A5A00 / #FFF3D6 |

**Dark** (`[data-theme=dark]` and `prefers-color-scheme: dark` when theme = system):

| Token | Value |
|---|---|
| `--bg` | #0F1012 |
| `--surface` | #17191C |
| `--surface-2` | #1F2226 |
| `--ink` | #ECEFF3 |
| `--ink-2` | #A6AEB8 |
| `--line` | #2B2F35 |
| `--accent` | #FF7A50 |
| `--accent-ink` | #121212 |
| `--accent-soft` | #3A2219 |
| `--good` / `--good-soft` | #4CC38A / #12301F |
| `--bad` / `--bad-soft` | #FF8A80 / #3A1714 |
| `--warn` / `--warn-soft` | #F2C14E / #33280F |

**Contrast rules:**
- Primary buttons are orange with **ink text** (6.7:1). Never white text on orange (it fails).
- Focus ring: `outline: 3px solid var(--ink); outline-offset: 2px; box-shadow: 0 0 0 6px var(--accent-soft)`. Orange alone is under 3:1 on paper.
- Progress and mastery bars must also show their value as text or an aria label.

**Type:**
- Display: "Bricolage Grotesque Variable", weights 600–800, for headings, scores and big numbers.
- Body: "Inter Variable". Both are self-hosted via @fontsource-variable.
- Headline-format passages use `ui-serif, Georgia, serif`.
- Scale: 0.875, 1, 1.125, 1.375, 1.75, 2.25 rem, and display `clamp(2.5rem, 2rem + 3vw, 3.5rem)`.
- Body line-height 1.55; display 1.1. Passage text 1.125rem / 1.6.

**Other tokens:**
- Space: 4, 8, 12, 16, 24, 32, 48, 64.
- Radius: 10 (controls), 16 (cards), 24 (sheets), 999 (pills).
- Shadow 1: `0 1px 2px rgb(0 0 0 / .06)`.
- Shadow 2: `0 10px 30px -14px rgb(18 18 18 / .28), 0 2px 6px rgb(0 0 0 / .05)`.
- Chunky button: 2px bottom border in a darker shade; `:active` shifts 2px down and collapses the bottom border.

**Motion:**
- 160–240ms, easing `cubic-bezier(.2,.8,.2,1)`.
- Feedback sheet slides up 240ms; route change fades and translates 8px over 160ms.
- Correct answer: a tiny 6-particle orange "spark" burst from the Continue button ("forge strike"), CSS only.
- Everything is disabled under `prefers-reduced-motion`.

## Scroll-reveal motion (owner request, 2026-10-20)
Restrained, polished motion as the page scrolls, used on the Welcome landing page and on long pages (fallacy detail, progress, summary list):
- Below-the-fold sections fade in and rise: opacity 0→1, translateY 16px→0, 420ms, `cubic-bezier(.2,.8,.2,1)`. Feature and step cards stagger by 60ms each, with at most 4 steps of delay.
- **The hero and the primary call to action are never hidden or delayed.** Quiz screens never wait on an animation, and the answer and feedback flow is never delayed by reveals.
- **Progressive enhancement:** content is fully visible by default.
  - A small script adds `html.reveal-ready` only when `IntersectionObserver` exists AND `prefers-reduced-motion` is not `reduce`.
  - Only under `html.reveal-ready` does CSS pre-hide `[data-reveal]:not(.is-revealed)`.
  - The observer (threshold 0.15, rootMargin `0px 0px -8% 0px`, reveal once, then unobserve) adds `.is-revealed`.
  - With no JS, no observer, or reduced motion, everything stays visible with no animation.
  - The stagger comes from a `--reveal-i` custom property set per card.
- Animate only `opacity` and `transform`. No animation libraries; never hijack or smooth-scroll the page; normal scrolling and keyboard navigation always work. Content that receives focus while hidden must reveal immediately (`:focus-within` forces it visible).
- **Optional scroll-linked accent (Welcome page only):** a thin forge-orange reading-progress line, or the hero's anvil spark drifting slightly, using CSS scroll-driven animations (`animation-timeline: scroll()`) inside `@supports (animation-timeline: scroll())` and a no-reduced-motion media query. Decorative only (`aria-hidden`).
- Must be verified in a real browser: one actual scroll transition, and the reduced-motion and static fallbacks, before calling it done.

## Welcome landing (`#/welcome`; shown at `#/` on the first visit)
First-time visitors (no attempts and not onboarded) land here. Returning users go straight to Today. It stays reachable from About and the footer ("What is Fallacy Forge?"). It is also the portfolio face of the project, so make it excellent.
1. **Hero** (visible immediately, never animated in):
   - logo mark;
   - display headline "Spot bad arguments in five minutes a day.";
   - one-line subhead;
   - primary chunky button **Start today's forge** and secondary link **Browse the 38 fallacies**.
2. **Live mini-demo:** one real bank passage rendered with the passage card and working Sound / Flawed buttons, showing the feedback inline. It proves the product in five seconds.
3. **How it works:** 3 step cards (Spot → Name → Learn), with staggered reveals.
4. **Real-world formats:** a slightly fanned or overlapping stack of 3 passage cards (post, email, headline) with depth. Each card is still readable.
5. **Features:**
   - Daily Forge plus share;
   - adaptive practice;
   - the library of 38 fallacies;
   - progress and streaks;
   - works offline and installable;
   - free and open source.

   Use a bento layout, not a uniform grid, with staggered reveals.
6. **Final call to action** plus a footer: GitHub link (https://github.com/itsothmane03-byte/Logic-Forge), MIT license, and "Built by Othmane".

## App shell and navigation (hash routes, so GitHub Pages works)
**Routes:** `#/` Today (Welcome on the first visit) · `#/welcome` · `#/play/:mode` (daily | practice | focus/:fallacyId | review) · `#/summary` · `#/library` · `#/library/:fallacyId` · `#/progress` · `#/about`. Unknown routes go to Today.

**Mobile (under 768px):**
- A bottom tab bar: Today, Practice, Library, Progress. Icons plus labels, 56px tall, safe-area padding.
- The tab bar and header are hidden during a session (focus mode).

**Desktop:**
- A slim top bar: logo (horizontal SVG; dark variant in dark mode), nav links, theme toggle and a "?" shortcuts button.
- Content max-width 1080px; the session column is 680px, centered.

**Every route:**
- updates `document.title` ("Library · Fallacy Forge");
- moves focus to the page `<h1>`;
- has a skip link and landmarks.

## Screens
### 1. Today (home)
1. **Header:**
   - a greeting by time of day, plus a streak chip (flame SVG and "4-day streak"; hidden at 0);
   - first run: a dismissible "How it works" card: ① Spot ② Name ③ Learn, with a "Try one" button that runs a 1-question demo.
2. **Hero card: Daily Forge #N.**
   - "10 questions · about 5 min".
   - The status sets the button: **Start**, **Resume 3/10**, or **Done 8/10**.
   - When done: "Share" and a countdown "Next forge in 6h 12m".
3. **Secondary cards:**
   - **Practice:** "Adaptive · your weak spots first", plus 3 chips for the weakest fallacies.
   - **Review mistakes (n):** only if n > 0.
   - **Fallacy of the day:** seeded by date; name, shortDef, "Learn it", leading to the detail page.

### 2. Session (the core screen; get this perfect)
**Top bar:**
- close ✕ (asks to confirm if answers would be lost; Daily progress auto-saves, so it can resume);
- 10 segments that fill green, amber or red after each answer, each with an aria label;
- the text "3 / 10".

**Passage card** (a renderer per `format`; all decoration `aria-hidden`):
- `post`: avatar circle with initials (colour hashed from the name); display name and handle from `source`; body; a faint decorative row (♡ 128 · ↻ 12 · reply).
- `email`: an envelope header (From: source; Subject: title, bold), then the body. Looks like a mail client.
- `chat`: a channel name at the top; messages as bubbles, alternating left and right by speaker, with the speaker name above each bubble.
- `headline`: the outlet name small-caps; the title in a large serif; the standfirst below; a thin rule.
- `ad`: a bordered promo card on `--surface-2`; brand label; bold title; body; a decorative pill button ("Learn more", not focusable).
- `review`: reviewer name; 4–5 decorative stars; bold title; body.
- `speech` and `quote`: a large hanging quote mark; the passage; an attribution line from `source`.

**Step 1, Spot.**
- Prompt: "Is the reasoning sound?"
- Two large chunky buttons side by side: **Sound** (check icon) and **Flawed** (crack icon). Keys `S` / `F`.

**Step 2, Name** (only when the user picked Flawed and the item IS flawed).
- Prompt: "Which fallacy?"
- 4 option cards in a single column on mobile, 2×2 on desktop. Each shows the name in bold, plus the shortDef in `--ink-2` (Settings can hide definitions: "Hard mode").
- Behaviour: `role=radiogroup`; arrow keys and `1`–`4` select; the selected card gets an accent border, accent-soft fill and a check badge.
- The bottom bar shows **Check**, disabled until something is selected (`Enter`).

**Outcomes:**
- **Correct:** picked Sound on a sound item, or Flawed and the right name. Green sheet.
- **Partial:** picked Flawed on a flawed item, but the wrong name. Amber sheet: "Right instinct, wrong name."
- **Wrong:** picked Sound on a flawed item, or Flawed on a sound item. Red sheet.
  - "There's a flaw here", plus the fallacy name.
  - Or "This one's actually sound", plus what it resembles.

**Feedback sheet** (slides up over the bottom; `role=status`; focus moves to Continue):
1. An icon and a title.
2. The answer line: "Straw Man". The name opens the fallacy detail in a side sheet over the session.
3. The explanation.
4. "Why not **Red Herring**?" with its whyNot text.
5. **Continue** (`Enter`).

At the same moment, the passage highlights the `cue` with a `<mark>`: an accent-soft background and a drawn underline animation.

After question 10, go to the Summary.

### 3. Summary
- A big score "7 / 10" in a progress ring and a one-line message by band (10: "Flawless forging." · 7–9: "Sharp eye." · 4–6: "Getting there." · 0–3: "Every expert started here.").
- Daily only: a **Share** button that copies the share text and shows a "Copied" toast (aria-live).
- **Your answers:** a list of rows (format icon, the true answer, a result badge), each expanding to show the passage with the cue highlighted plus the explanation.
- **Mastery changes:** chips such as "Straw Man ↑", "Red Herring ↓".
- Buttons: **Practice weak spots** and **Back to Today**.

**Share text:**
```
Fallacy Forge #12 · 8/10
🟩🟩🟨🟩🟥🟩🟩🟩🟩🟩
<site url>
```
🟩 correct · 🟨 partial · 🟥 wrong.

### 4. Library
- **Header:** title, count "38 fallacies", search field (`/` focuses it; matches names and aliases, case- and accent-insensitive).
- **Filters:** chips by family ("All", "Attacks & distractions", "Emotional appeals", "Crowds, authority & tradition", "Cause & evidence", "Framing & assumptions", "Language & parts") and difficulty (Beginner, Intermediate, Advanced).
- **Cards:** a list on mobile, a 2–3 column grid on desktop. Each card shows a family colour dot, name, shortDef, and a mastery bar with a text percentage if practiced.
- Families get distinct muted hues, used ONLY on small dots and tags, never as large fills.
- **Empty search:** "No fallacy matches 'xyz'. Try an alias like 'whataboutism'."

### 5. Fallacy detail (`#/library/:id`)
1. **Hero:** name (display font), aliases, family and difficulty tags, mastery.
2. **Definition.**
3. **How to spot it:** 3 numbered tips.
4. **Classic example:** a quote card.
5. **When it's legitimate:** the `legitimateVersion`, in a subtle callout. This nuance is a differentiator.
6. **Don't confuse with:** a contrast card per confusable, linking to that fallacy.
7. **In the wild:** 2 bank passages (one flawed, one sound near-miss), rendered with the passage renderers, each with a "Reveal answer" toggle.
8. **Sticky CTA:** **Practice this fallacy** (Focus mode).

### 6. Progress
1. **Stat row:** questions answered · accuracy · current / best streak · mastered x / 38.
2. **Heatmap:** the last 20 weeks, GitHub-style cells with 4 intensity levels, a legend and aria labels per cell (for example "Oct 12: 10 questions").
3. **Accuracy trend:** a sparkline of the last 14 sessions, with a text summary.
4. **Mastery by family:** grouped rows with bars and percentages; tap to go to detail.
5. **Settings:**
   - Theme (System / Light / Dark segmented control).
   - "Show definitions on answers" toggle.
   - Data: Export (downloads JSON), Import (file picker, validated) and Reset (confirm dialog).

### 7. About
- What a fallacy is (3 sentences).
- How scoring and mastery work.
- "Your progress never leaves this browser."
- Open source link and credits.

## Accessibility (non-negotiable, WCAG 2.2 AA)
- Semantic HTML first; native buttons and links; all controls usable by keyboard with a visible focus ring.
- Touch targets 44px or larger; works at 200% zoom and 320px width with no horizontal scroll.
- Results are never conveyed by colour alone: icon plus text.
- Live regions for feedback and toasts.
- Dialogs trap focus, close on Esc and return focus.
- **Shortcuts dialog ("?"):**

  | Key | Action |
  |---|---|
  | S / F | Spot sound or flawed |
  | 1–4 | Choose an answer |
  | Enter | Check / Continue |
  | / | Search the library |
  | Esc | Close |

- Respect `prefers-reduced-motion` and `prefers-color-scheme`.

## Copy voice
Friendly, precise, short. Encouraging, never sarcastic.
- "Spot the flaw."
- "Is the reasoning sound?"
- "Right instinct, wrong name."
- "Sound, and sneaky: it only looks like an appeal to authority."
