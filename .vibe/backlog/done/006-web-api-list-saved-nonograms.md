---
status: done
depends_on: [005]
---
# Web API: List Saved Nonograms

## Description
Add a `GET /api/nonograms` Fastify route in `packages/web` that returns a lightweight list (id, name, size, updated-at) for every saved nonogram, backed by the `NonogramStore`.

## Acceptance Criteria
- [x] `GET /api/nonograms` returns 200 with an empty array when no nonograms are saved
- [x] `GET /api/nonograms` returns id, name, width, height, and updated-at for each saved nonogram
- [x] The response does not include full cell data (kept lightweight for a listing view)

## Notes
None.
