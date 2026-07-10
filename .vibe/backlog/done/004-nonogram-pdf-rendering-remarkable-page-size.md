---
status: done
depends_on: [001, 002]
---
# Nonogram PDF Rendering (reMarkable Page Size)

## Description
Render a grid and its clues to a PDF sized for the reMarkable 2 tablet, in `packages/core`, reusing the `REMARKABLE_2_PAGE_WIDTH_PT` / `REMARKABLE_2_PAGE_HEIGHT_PT` constants pattern already established in the sibling project's `maze-pdf.ts`. This is the artifact that gets downloaded or sent to the device.

## Acceptance Criteria
- [x] Rendering a grid produces a valid single-page PDF sized to the reMarkable 2 page dimensions
- [x] The rendered PDF visually reflects the same grid/clue layout as the SVG preview
- [x] Rendering the largest grid size allowed by the grid data model's validation still fits on the page without clipping

## Notes
None.
