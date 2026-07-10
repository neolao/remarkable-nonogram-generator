---
status: done
depends_on: [001, 002]
---
# Nonogram SVG Rendering (Preview)

## Description
Render a grid and its computed clues as an SVG image in `packages/core`, for use as a live preview in the web UI. Follow the same visual pattern as `renderMazeToSvg` in the sibling project `remarkable-maze-generator`: grid lines, filled cells, and clue numbers displayed in the top and left margins.

## Acceptance Criteria
- [ ] Rendering a grid produces valid SVG markup with one visual cell per grid cell, filled cells visually distinct from empty ones
- [ ] Row clues are rendered to the left of each row and column clues above each column, matching the values from the clue computation
- [ ] Rendering an all-empty grid still produces valid SVG without errors

## Notes
None.
