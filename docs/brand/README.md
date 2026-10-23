# Spot the flaw — Fallacy Forge identity

The mark is two opposing speech brackets forming an eye, with a diamond pupil, in the site's ember orange. It replaced an older anvil and check mark. In the app, `src/ui/components/Logo.tsx` draws matching geometry so the pupil follows the current light/dark text colour.

## Source and exports

`public/brand/spot-the-flaw.svg` is the canonical vector; every PNG is derived from it. The committed exports are exactly the files `index.html` and the web manifest use:

| File | Use |
| --- | --- |
| `public/brand/favicon_16.png`, `favicon_32.png` | Browser tab icons |
| `public/brand/logo-512.png` | Social preview image |
| `public/brand/logomark_light_128.png`, `_256.png`, `_512.png` | Install icons |
| `public/icons/maskable-512.png` | Android maskable icon (mark at 80% of the canvas, inside the safe zone) |
| `public/icons/apple-touch-icon.png` | iOS home screen icon (180 px) |

The build uses these committed files and needs no image tooling.

## Regenerating

`scripts/dev/icons.mjs` rewrites those eight PNGs from the SVG with [sharp](https://sharp.pixelplumbing.com/), which is not a project dependency. Point `SHARP_MODULE` at an existing installation's `dist/index.mjs`:

```bash
SHARP_MODULE=/path/to/sharp/dist/index.mjs node scripts/dev/icons.mjs
```

A different sharp version may produce slightly different PNG bytes, so compare the images before committing them.

## Concept provenance

The design concept was generated with the built-in AI image-generation tool on 2026-10-21, with a cleanup pass through the same tool. The shipped mark is a hand-drawn vector implementation of that concept, not the generated bitmap, and no paid service or runtime AI is involved. The original generated image is no longer in the working tree; it remains available at [commit 153c789](https://github.com/itsothmane03-byte/Logic-Forge/blob/153c7895acdca3386f210a543006430f45a60a37/docs/brand/generated-eye-concept.png).

Generation prompt: “One compact original symbol for Fallacy Forge, a critical-thinking practice game: an intelligent eye constructed from two bold opposing angular speech-bracket forms around a diamond-shaped ember pupil; flat geometric artwork in #FF6B3D and warm ivory, transparent background, legible at 24px, no text, anvil, hammer, gradients or mockup.” The cleanup pass preserved the concept and requested smooth edges and no stray pixels; vector geometry was used for reliable final edges.
