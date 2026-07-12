---
date: 2026-07-12
status: accepted
---
# Bulk export/import of the nonogram list uses fflate for zip archives, and always creates new entries on import
**Context:** Backlog item 029 asks for exporting/importing the entire saved nonogram list at once via a zip archive of the existing per-nonogram JSON export format, complementing the single-nonogram JSON export/import (item 025). Its notes explicitly left two points open: which zip library to use given `core`'s dependency-light mandate, and whether importing an entry whose name/id collides with an existing saved nonogram should overwrite, skip, or always create a new entry.

**Decision:**
1. Use `fflate` (zero runtime dependencies, pure JS, synchronous `zipSync`/`unzipSync` API, includes TypeScript types) in `packages/core` to build and read zip archives.
2. A bulk import always creates a brand-new saved nonogram for every valid entry in the archive, exactly like the existing single-nonogram JSON import — it never overwrites or merges with an existing saved nonogram.

**Reason:**
1. `fflate` adds a single small, dependency-free package, which is the lightest option among common zip libraries (`jszip`, `archiver`, `adm-zip`) and matches the project's existing pattern of picking a narrowly-scoped library per technical concern (e.g. `pdf-lib` for PDF rendering).
2. The per-nonogram JSON export format (`NonogramExport`) never included an `id` field to begin with — only `name`/`width`/`height`/`cells` — so there is no reliable identity to match against on import. Always creating a new entry keeps bulk import consistent with the single-file import path and avoids silently overwriting a user's existing puzzle based on a name collision alone.

**Rejected alternatives:**
- `jszip` / `archiver`: heavier, pull in more transitive dependencies than needed for basic zip read/write.
- Matching on name (or a re-added id) to overwrite an existing nonogram on import: rejected because it would silently destroy existing data on a name collision (e.g. two puzzles both named "Cat") and would diverge from how single-file import already behaves.
