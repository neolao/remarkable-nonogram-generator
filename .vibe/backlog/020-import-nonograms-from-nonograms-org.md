---
status: in_progress
---
# Import Nonograms from nonograms.org

## Description
Add a way to import nonogram puzzles from the external site nonograms.org (https://www.nonograms.org/nonograms) directly into the app, instead of requiring every puzzle to be drawn by hand. The importer fetches a puzzle's grid from the source and saves it as a regular nonogram like any manually-drawn one, with clues always recomputed locally from the grid rather than trusted from the source.

## Acceptance Criteria
- [ ] User can trigger an import of a puzzle from nonograms.org (e.g. by pasting its URL or id) through the web app
- [ ] The system fetches the puzzle's grid from the source and creates a saved nonogram whose row/column clues are computed the same way as for a manually-drawn grid, never trusted as-is from the source
- [ ] An imported nonogram appears in the saved nonograms list and is immediately usable for preview, PDF download, and send-to-reMarkable, exactly like a manually-drawn one
- [ ] A clear error is shown if the source is unreachable, the puzzle id/URL is invalid, or the fetched grid can't be parsed

## Notes
This relaxes the project's earlier "no random puzzle generator / manual drawing only" constraint — `CLAUDE.md` and `.vibe/glossary.md` have been updated accordingly to allow importing a grid from an external source, while still requiring clues to always be derived locally from the grid.

Open questions to resolve during `/vibe:feature`: nonograms.org's terms of service / robots.txt should be checked before scraping its pages; the exact page structure/format to parse is unknown and will need investigation; consider whether this warrants a dedicated import module in `core` (e.g. `nonogram-import.ts`) to keep the scraping/parsing logic isolated and testable, consistent with the project's existing "core owns domain logic" pattern.

**Prior investigation (2026-07-11, in a `/vibe:feature 020` attempt that was abandoned before implementation):**
- `robots.txt` on nonograms.org disallows `/nonogramprint/` (the print view) and certain large image paths; individual puzzle pages (`/nonograms/i/[ID]`) aren't disallowed, but the site's footer states "Reprinting, copying and reproducing of materials from the site in any form without written agreement of the owner is prohibited" — a direct conflict with automated fetching/reproduction of puzzle content, regardless of which specific page/asset is targeted.
- The interactive solving grid (`#nonogram_table`) is not present in the server-rendered HTML of a puzzle page — it's built client-side by the site's own JS after page load. Reading it would require driving a real/headless browser to execute that JS, which is a *more* invasive form of automated access than a plain HTTP fetch, not a lighter one — it does not sidestep the CGU conflict above, it reinforces it.
- Given this, item 020 was abandoned in favor of item 021 (done): the user manually obtains and uploads their own image of a puzzle instead of the app auto-fetching anything from nonograms.org. Reopening this item (whether via plain HTTP scraping or a headless browser) should re-confront the CGU conflict above head-on before any implementation work — it has not been resolved, only routed around.
