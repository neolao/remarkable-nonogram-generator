# Module: nonogram-domain
**Role:** Core nonogram domain model — the grid of filled/empty cells and its derived row/column clues, which rendering and persistence build on. Pure data + validation, no rendering/persistence/runtime dependency.
**Files:** `packages/core/src/domain/nonogram-grid.ts`, `packages/core/src/domain/nonogram-clues.ts`
**Exports:**
- `createNonogram(width, height, cells): Nonogram` — validates positive integer dimensions, rejects grids too large for a reMarkable 2 page, and rejects cells not matching the declared dimensions
- `Nonogram` — `{ width, height, cells }` read-only type
- `MAX_GRID_WIDTH`, `MAX_GRID_HEIGHT` — maximum grid dimensions that fit a reMarkable 2 page once clue space is reserved
- `REMARKABLE_2_PAGE_WIDTH_PX`, `REMARKABLE_2_PAGE_HEIGHT_PX`, `CLUE_AREA_MARGIN_PX`, `MIN_CELL_SIZE_PX` — page/layout constants the max size is derived from, meant to be reused unchanged by the future PDF rendering feature
- `computeNonogramClues(nonogram): NonogramClues` — computes row and column clues (consecutive filled-cell run lengths) for a whole grid; an empty row/column yields `[0]` (see ADR `002-empty-line-clue-convention`)
- `NonogramClues` — `{ rowClues, columnClues }` read-only type, each a list of clue-number lists
**Depends on:** nothing (pure domain type)
