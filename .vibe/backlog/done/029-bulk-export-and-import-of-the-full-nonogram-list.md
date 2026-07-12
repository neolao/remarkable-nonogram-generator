---
status: done
depends_on: [025]
---
# Bulk Export and Import of the Full Nonogram List

## Description
Let a user export the entire saved nonogram list at once as a single downloadable archive (e.g. a zip containing one JSON file per nonogram, reusing the existing per-nonogram JSON export format), and re-import that archive to restore or transfer the whole list in one operation. This complements the existing single-nonogram JSON export/import (item 025) by giving users a way to back up or migrate all their puzzles at once instead of one by one.

## Acceptance Criteria
- [ ] From the home page's saved nonograms list, the user can download a single zip archive containing every saved nonogram, each as a JSON file in the existing per-nonogram export format
- [ ] The user can import a zip archive of JSON files to create new saved nonograms for each entry it contains
- [ ] Uploading a zip that is malformed, contains a non-JSON entry, or contains a JSON file with an invalid/oversized grid is rejected (or that entry is skipped with a clear per-entry error) instead of producing broken nonograms
- [ ] As with single-nonogram import, row/column clues for every imported nonogram are always recomputed from its cells rather than trusted from the file

## Notes
Reuses the per-nonogram JSON transfer format from item 025 (`nonogram-persistence` module) — each entry in the zip should be structurally identical to what a single export produces. Implementation should decide whether bulk export/import lives on the home page (alongside per-item export) or on the existing import page, and which zip library to use (core stays dependency-light per CLAUDE.md, so check `packages/core`'s existing dependency footprint before adding one). Left open whether duplicate names/ids on import should overwrite, skip, or always create new entries — needs a decision during `/vibe:feature`.
