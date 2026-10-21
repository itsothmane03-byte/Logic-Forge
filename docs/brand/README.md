# Spot the flaw — Fallacy Forge identity

The old anvil/check mark is replaced by two opposing speech brackets forming an eye, with a diamond pupil. The mark connects to spotting flawed reasoning and uses the site's existing ember orange. The pupil follows the current light/dark text colour in the app.

## Assets and provenance

- `generated-eye-concept.png`: design concept generated with the built-in image-generation tool on 2026-10-21, with a cleanup pass through the same tool. The original generated image is retained here as provenance, not downloaded by the app.
- `public/brand/spot-the-flaw.svg`: clean hand-drawn vector implementation of that concept. `src/ui/components/Logo.tsx` uses matching geometry for theme-aware rendering.
- The PNG exports, browser icons, social preview and install icons are derived from that vector. No paid service or runtime AI is involved.

Generation prompt: “One compact original symbol for Fallacy Forge, a critical-thinking practice game: an intelligent eye constructed from two bold opposing angular speech-bracket forms around a diamond-shaped ember pupil; flat geometric artwork in #FF6B3D and warm ivory, transparent background, legible at 24px, no text, anvil, hammer, gradients or mockup.” The cleanup pass preserved the concept and requested smooth edges and no stray pixels; vector geometry was used for reliable final edges.

## Regenerating exports

`scripts/dev/icons.mjs` is a dev-only asset utility using [sharp](https://sharp.pixelplumbing.com/), which is not a production dependency. Point `SHARP_MODULE` to an existing installation's module entry point (for example `dist/index.mjs`), then run `node scripts/dev/icons.mjs`. The build uses the committed exports and requires no image tooling.
