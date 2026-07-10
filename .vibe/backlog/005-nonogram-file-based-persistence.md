---
status: todo
depends_on: [001]
---
# Nonogram File-Based Persistence

## Description
Define a `NonogramStore` interface (list/load/save/delete by id) in `packages/core`, with a file-based implementation in `packages/web`, mirroring the existing `CredentialStore` / `createFileCredentialStore` split already in this codebase. Each saved nonogram is stored as its own JSON file (id, name, width, height, cells, timestamps) under a configurable directory, defaulting to a `nonograms` subdirectory alongside the existing reMarkable credentials file.

## Acceptance Criteria
- [ ] Saving a new nonogram creates a JSON file and returns/generates a stable id
- [ ] Loading by id returns the previously saved grid, name, and timestamps unchanged
- [ ] Listing returns all saved nonograms without requiring each one to be fully loaded individually
- [ ] Deleting a nonogram removes its file and it no longer appears in listing or load results

## Notes
Default directory should live alongside `DEFAULT_CREDENTIALS_PATH`'s parent (`~/.config/remarkable-nonogram-generator/`), e.g. a `nonograms/` sibling directory.
