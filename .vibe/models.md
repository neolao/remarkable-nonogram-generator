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

## NonogramExport
| Field | Type | Notes |
|---|---|---|
| name | string | User-facing name of the puzzle at export time |
| width | number | Same constraints as `Nonogram.width` |
| height | number | Same constraints as `Nonogram.height` |
| cells | boolean[][] | Same shape as `Nonogram.cells` |
Defined in: `packages/core/src/nonogram-json-transfer.ts` — the downloadable/re-importable JSON file format for a single saved nonogram; `parseNonogramImport` revalidates an untrusted value of this shape through `createNonogram` before it's ever saved, so an imported file is never trusted more than a manually-drawn grid

## SendNonogramResult
A discriminated union over the outcome of `sendNonogramToRemarkable()`, keyed by `outcome`:
| outcome | Extra fields | Meaning |
|---|---|---|
| `not_found` | — | No saved nonogram with the given id |
| `not_authenticated` | — | No reMarkable credentials stored yet |
| `auth_failed` | `message: string` | Re-authentication with reMarkable Cloud failed |
| `upload_failed` | `message: string` | The PDF upload to reMarkable Cloud failed |
| `sent` | `visibleName: string` | Upload succeeded, under this name |
Defined in: `packages/core/src/send-nonogram.ts` — the web route (`remarkable-routes.ts`) maps each outcome to an HTTP status (404 / 409 / 502 / 502 / 200 respectively)
