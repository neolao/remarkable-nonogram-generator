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

## SavedNonogram
| Field | Type | Notes |
|---|---|---|
| id | string | Generated via `crypto.randomUUID()` unless the caller supplies one on save; must not contain path separators |
| name | string | User-facing name of the puzzle |
| nonogram | Nonogram | The saved grid (width, height, cells) |
| createdAt | string | ISO timestamp, set once and preserved across updates |
| updatedAt | string | ISO timestamp, refreshed on every save |
Defined in: `packages/core/src/nonogram-store.ts`

## NonogramSummary
| Field | Type | Notes |
|---|---|---|
| id | string | Same id as the full `SavedNonogram` |
| name | string | |
| width | number | |
| height | number | |
| createdAt | string | ISO timestamp |
| updatedAt | string | ISO timestamp |
Defined in: `packages/core/src/nonogram-store.ts` — returned by `list()`, omits `cells` so listing doesn't require loading each nonogram fully
