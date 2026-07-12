---
status: in_progress
---
# Apply Domain-Driven Design Architecture

## Description
Restructure the `core` package to make its domain layer explicit, following Domain-Driven Design principles. Today domain logic (grid, clues, line solver, page clues) and infrastructure concerns (SVG/PDF rendering, file-based storage interfaces, reMarkable Cloud client) live as flat sibling files under `packages/core/src/`, with no directory boundary separating them. This is also why `vibe:review-ddd` is currently marked inactive in CLAUDE.md's review agents table ("no explicit domain layer").

## Acceptance Criteria
- [ ] `packages/core/src/` groups files into an explicit domain layer (entities/value objects: `Nonogram`, `NonogramClues`, grid) separated from infrastructure/application concerns (rendering, persistence interfaces, reMarkable Cloud integration)
- [ ] Domain modules (grid, clue computation, line solver) have no import dependency on infrastructure modules (PDF/SVG rendering, credential/nonogram stores, reMarkable client)
- [ ] Naming of domain types and functions matches the ubiquitous language already documented in `.vibe/glossary.md`
- [ ] CLAUDE.md's review agents table is updated to mark `vibe:review-ddd` active, and `.vibe/index.md` is refreshed via `/vibe:sync` to reflect the new structure

## Notes
This is an architectural refactor, not a new user-facing feature — no new behavior should result, and all existing tests must keep passing unchanged (aside from import path updates). Coordinate with `/vibe:sync`'s "Observed patterns" section afterward, since several existing patterns reference the current flat file layout (e.g. the `file-<thing>-store.ts` naming convention). Cross-reference CLAUDE.md's review agents table, which explains why `vibe:review-ddd` is currently disabled.
