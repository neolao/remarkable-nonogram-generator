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

No clue, rendering, or persistence model exists yet — those will be populated as later `/vibe:feature` items build them.
