---
date: 2026-07-12
status: accepted
---
# DDD-layered structure for the core package

**Context:** The `core` package's domain logic (grid, clues, line solver), use cases (send-to-reMarkable, URL import), and technical adapters (SVG/PDF rendering, reMarkable Cloud client, headless-browser page scraping) lived as flat sibling files under `packages/core/src/`, with no directory boundary between them. `vibe:review-ddd` was disabled in CLAUDE.md's review agents table for exactly this reason ("no explicit domain layer").

**Decision:** Split `packages/core/src/` into three subdirectories: `domain/` (pure entities/value objects and domain services with zero infrastructure dependency: grid, clues, line solver, JSON transfer shape), `application/` (use cases and the ports they depend on: `sendNonogramToRemarkable`, `importNonogramFromUrl`, the `NonogramStore` and `CredentialStore` interfaces), and `infrastructure/` (concrete technical adapters: SVG/PDF rendering, the reMarkable Cloud client, Puppeteer-based page scraping, the network-timeout helper). `packages/core/src/index.ts` keeps re-exporting the same public names from their new paths, so `packages/web` (which only ever imports via the `@remarkable-nonogram-generator/core` package alias) requires no changes.

**Reason:** Makes the dependency direction the project already had informally (domain has zero outward dependencies; use cases orchestrate domain + infrastructure) visible and enforceable from the file layout itself, and unblocks re-enabling `vibe:review-ddd`.

**Rejected alternatives:** A flatter two-way split (`domain/` vs. everything else) was considered — simpler, but it would leave use cases (`send-nonogram.ts`, `nonogram-url-import.ts`) undistinguished from raw technical adapters (PDF rendering, the reMarkable HTTP client), which is the exact distinction DDD's application layer exists to make.
