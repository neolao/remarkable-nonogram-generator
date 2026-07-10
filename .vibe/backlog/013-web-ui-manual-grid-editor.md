---
status: todo
depends_on: [001, 007]
---
# Web UI: Manual Grid Editor

## Description
Build the manual grid editor in `packages/web/public`: width/height inputs (free-form, capped to fit a reMarkable-2 page) to size the grid, then a clickable grid of cells to toggle filled/empty. The editor loads an existing saved nonogram when opened from the listing, or starts blank for a new one.

## Acceptance Criteria
- [ ] Entering a width and height renders a grid of that size with all cells initially empty
- [ ] Clicking a cell toggles it between filled and empty with no page reload
- [ ] Opening the editor for an existing nonogram id pre-fills the grid with its saved cell state
- [ ] Entering a width/height above the reMarkable-2 page cap is rejected with a clear message, consistent with the server-side grid validation

## Notes
Cell toggling is pure client-side interaction — no server round-trip per click, to keep drawing responsive.
