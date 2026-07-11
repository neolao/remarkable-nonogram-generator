---
date: 2026-07-11
status: accepted
---
# Docker image runs the server via tsx on source, not the compiled dist output

**Context:** Packaging the web app as a Docker image (backlog item 026) for one-command deployment on a Synology NAS.

**Decision:** The container's runtime command executes the server through the same TypeScript-execution mechanism already used for local development (`tsx`), running directly against the package sources, rather than running the compiled `dist/server.js` output with plain `node`.

**Reason:** `core`'s `package.json` (`main`/`types`/`exports`) intentionally points at its TypeScript source (`./src/index.ts`), not at a built `dist` output — this is the project's existing, deliberate pattern, letting `vitest` and `tsx watch` consume `core` without a separate build step. As a direct consequence, `node packages/web/dist/server.js` fails at runtime today (`ERR_UNKNOWN_FILE_EXTENSION` on `core`'s `.ts` entry point) — a pre-existing bug, unrelated to Docker, discovered while investigating this backlog item. Reusing the already-working `tsx`-based execution path avoids touching that resolution pattern (and the regression risk to the dev/test workflow that redirecting `core`'s exports to `dist` would carry) while still fully satisfying the "single image, one command, no manual build step on the NAS" acceptance criterion — the multi-stage Docker build still runs the TypeScript build as a type-check gate before shipping the image, it just isn't what actually executes at runtime.

**Rejected alternatives:**
- Point `core`'s `exports`/`main`/`types` at its compiled `dist` output so `node dist/server.js` works unconditionally — rejected because it would require `core` to always be pre-built before `npm run web` (tsx watch) or `vitest` could resolve it, regressing the current zero-build-step local dev/test workflow, for a fix whose only real beneficiary is the Docker image.
- Same fix, gated behind a conditional `"development"` export condition — rejected as unnecessary added complexity (custom Node resolution conditions wired through `tsx`/`vitest`) to solve a problem the `tsx`-runtime approach already solves with no source changes.
