# Fallacy Forge development

Keep changes proportional to this static Preact and TypeScript app. See
[architecture](docs/ARCHITECTURE.md) and [content rules](docs/CONTENT-SPEC.md).

- Keep accurate fallacy names and explain them in clear language. Concision must not remove qualifications or imply that a stronger argument proves its conclusion.
- Reuse the existing passage formats, theme tokens and accessible controls. Teach with labels as well as visual emphasis; check affected views at 320px and 200% zoom in both themes.
- Reveal answer-specific annotations only after checking. Use reviewed, exact text excerpts rather than keyword-based argument detection or HTML stored in content strings.
- Preserve Home, Today and compatibility routes, saved progress, exports, scores and unfinished answer drafts. Static assets load from the host; the app has no accounts, analytics, backend or runtime AI.
- Codex scopes assignments, integrates, independently reviews and tests, and publishes. Keep edits within agreed file ownership; Claude returns assigned changes uncommitted. Hand files back before overlapping changes. Do not change Git identity.
- Design skills and connected tools are developer-local capabilities, not app dependencies. Verify them in the active runtime before relying on them. Use Figma or video tools only with a relevant supplied reference; never copy credentials into this repository.
- Run `npm run content`, `npm run typecheck`, `npm test` and `npm run build` before release. Inspect the final diff and verify changed UI in the browser. Do not claim assistive-technology certification from automated checks alone.
