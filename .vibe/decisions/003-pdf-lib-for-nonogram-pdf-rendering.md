---
date: 2026-07-10
status: accepted
---
# Use pdf-lib for nonogram PDF rendering, mirroring the maze project's layout approach

**Context:** The nonogram grid and its clues need to be rendered as a PDF sized for the reMarkable 2 tablet, reusing the same visual layout already established by the SVG preview (row clues left-aligned, column clues top-aligned, one rect per cell).

**Decision:** Use the `pdf-lib` npm package to build the PDF document and draw the grid/clues with its rectangle, text, and font-embedding APIs. Compute a page-fitting cell size (grid + clue margins scaled to fit the fixed reMarkable 2 page size with a page margin) the same way the sibling maze project's `maze-pdf.ts` computes its layout, rather than reusing the SVG renderer's fixed default cell size.

**Reason:** `pdf-lib` is already used for this exact purpose (grid/vector rendering to a reMarkable-sized PDF) in the sibling `remarkable-maze-generator` project (see its ADR `004-pdf-lib-for-pdf-rendering`), so reusing it avoids introducing a second PDF library for the same job and keeps `packages/core` dependency-light (pure TS/JS, no native rendering dependencies). A dynamically fit-to-page cell size (instead of the SVG's fixed default) is required because a PDF page has fixed physical dimensions and must guarantee the largest allowed grid still fits without clipping.

**Rejected alternatives:** `pdfkit` — same reasoning as the maze project's ADR: stream-oriented and geared toward text-heavy documents, `pdf-lib`'s simpler shape/text drawing API is a better fit here too.
