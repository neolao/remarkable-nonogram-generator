---
date: 2026-07-10
status: accepted
---
# Grid editor reuses the preview endpoint to validate a new grid's size
**Context:** Building the manual grid editor (backlog item 013). Entering a width/height above the reMarkable 2 page cap must be rejected client-side with a message consistent with the server-side grid validation (`createNonogram` in `packages/core`).
**Decision:** When the user submits a width/height for a brand new grid, the editor sends a blank grid of that size to the existing `POST /api/nonograms/preview` endpoint. A 200 response means the size is accepted and the interactive grid is rendered; a 400 response's error message is shown as-is to the user.
**Reason:** The size limits (`MAX_GRID_WIDTH`/`MAX_GRID_HEIGHT`) are derived constants living in `packages/core`, not duplicated anywhere else. Reusing an existing validated endpoint keeps the single source of truth in `core` and avoids introducing a new endpoint or hardcoding the limits in plain frontend JS, consistent with the project rule that `core` remains the only place implementing nonogram domain logic.
**Rejected alternatives:**
- Hardcoding `MAX_GRID_WIDTH`/`MAX_GRID_HEIGHT` in `editor.js` — would drift from `core` if the constants ever change.
- Adding a dedicated `GET /api/nonograms/limits` endpoint — extra surface for no real gain, since a validating endpoint (`preview`) already exists and returns a clear error message.
