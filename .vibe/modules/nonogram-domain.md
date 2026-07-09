# Module: nonogram-domain
**Role:** Core nonogram domain model — the grid of filled/empty cells that every other nonogram feature (clues, rendering, persistence) builds on. Pure data + validation, no rendering/persistence/runtime dependency.
**Files:** `packages/core/src/nonogram-grid.ts`
**Exports:**
- `createNonogram(width, height, cells): Nonogram` — validates positive integer dimensions, rejects grids too large for a reMarkable 2 page, and rejects cells not matching the declared dimensions
- `Nonogram` — `{ width, height, cells }` read-only type
- `MAX_GRID_WIDTH`, `MAX_GRID_HEIGHT` — maximum grid dimensions that fit a reMarkable 2 page once clue space is reserved
- `REMARKABLE_2_PAGE_WIDTH_PX`, `REMARKABLE_2_PAGE_HEIGHT_PX`, `CLUE_AREA_MARGIN_PX`, `MIN_CELL_SIZE_PX` — page/layout constants the max size is derived from, meant to be reused unchanged by the future PDF rendering feature
**Depends on:** nothing (pure domain type)
