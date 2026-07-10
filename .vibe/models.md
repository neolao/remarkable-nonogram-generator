# Data models

## RemarkableCredentials
| Field | Type | Notes |
|---|---|---|
| deviceToken | string | Token returned by reMarkable Cloud after pairing |
Defined in: `packages/core/src/remarkable-credential-store.ts`

## Nonogram
| Field | Type | Notes |
|---|---|---|
| width | number | Positive integer, max `MAX_GRID_WIDTH` |
| height | number | Positive integer, max `MAX_GRID_HEIGHT` |
| cells | boolean[][] | `[row][col]`, filled (true) / empty (false), shape must match width x height |
Defined in: `packages/core/src/nonogram-grid.ts`

## NonogramClues
| Field | Type | Notes |
|---|---|---|
| rowClues | number[][] | One clue-number list per row, top to bottom; `[0]` for an entirely empty row |
| columnClues | number[][] | One clue-number list per column, left to right; `[0]` for an entirely empty column |
Defined in: `packages/core/src/nonogram-clues.ts`

No persistence model exists yet — that will be populated as later `/vibe:feature` items build it.
