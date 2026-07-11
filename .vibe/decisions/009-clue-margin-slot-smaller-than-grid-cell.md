---
date: 2026-07-11
status: accepted
---
# Clue margin slot size decoupled from grid cell size

**Context:** Row and column clue numbers in the SVG preview and the PDF were laid out using the same unit as the puzzle grid cells: each clue number occupied a full `cellSizePx`/`cellSize` slot, both in the direction where clues stack (multiple numbers per row/column) and in the direction where they align with the grid. For grids with many clues per row/column, this made the clue margin consume a large share of the page, shrinking the available cell size for the puzzle grid itself more than necessary for legibility.

**Decision:** Introduce a separate, smaller ratio of `cellSizePx`/`cellSize` for the clue *stacking* direction only (the axis along which multiple numbers in the same row/column are laid out side by side), while keeping the alignment direction (row height / column width) equal to the grid's cell size so clues stay visually aligned with their row/column. The PDF layout's cell-size-fitting computation is updated to weight margin cells by this smaller ratio, so the freed-up space is redistributed to the puzzle grid (larger cells), which keeps clue numbers at the same or a slightly larger absolute size instead of shrinking them.

**Reason:** The user-facing complaint was that clue numbers "take a bit too much space" while needing to "remain readable." Shrinking the font was rejected because it directly trades off legibility for space. Shrinking only the inter-number spacing (with a safety margin so two-digit numbers never touch) reduces the margin's footprint without touching numbers' visual size, and the reclaimed page space increases the grid's cell size, an indirect legibility improvement for the puzzle itself.

**Rejected alternatives:**
- Shrinking `FONT_SIZE_RATIO` (font size relative to cell size): directly conflicts with the "must remain readable" requirement.
- Leaving the margin sized as one full cell per clue slot: keeps the reported issue (too much space taken by numbers) unresolved for grids with many clues per row/column.
