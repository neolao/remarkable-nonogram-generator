# Module: nonogram-persistence
**Role:** Save/list/load/delete nonograms as individual JSON files on disk, mirroring the `CredentialStore` / `createFileCredentialStore` split. Foundation for the upcoming `/api/nonograms/*` routes.
**Files:** `packages/core/src/nonogram-store.ts`, `packages/web/src/nonogram-store.ts`
**Exports:**
- `NonogramStore` — `{ list, load, save, delete }` interface
- `NonogramSummary` — `{ id, name, width, height, createdAt, updatedAt }`, returned by `list()` without loading each grid's cells
- `SavedNonogram` — `{ id, name, nonogram, createdAt, updatedAt }`, returned by `load()` and `save()`
- `SaveNonogramInput` — `{ id?, name, nonogram }` passed to `save()`; omitting `id` creates a new nonogram, providing an existing `id` updates it in place while preserving `createdAt`
- `createFileNonogramStore(directoryPath): NonogramStore` — one JSON file per nonogram (`<id>.json`), generated id via `crypto.randomUUID()`, rejects ids containing path separators (`assertValidId`) to prevent escaping the store directory, default directory `DEFAULT_NONOGRAMS_DIR` (`~/.config/remarkable-nonogram-generator/nonograms/`)
**Depends on:** `modules/nonogram-domain.md` (reuses the `Nonogram` type)
