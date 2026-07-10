---
status: todo
depends_on: [003]
---
# Web API: Nonogram SVG Preview Endpoint

## Description
Add a `POST /api/nonograms/preview` Fastify route in `packages/web` that takes a grid in the request body and returns SVG, mirroring the existing `/api/mazes/preview` route in the sibling project's `maze-routes.ts`. Used for live preview while editing, independent of whether the grid has been saved yet.

## Acceptance Criteria
- [ ] `POST /api/nonograms/preview` with a valid grid returns 200 with SVG content
- [ ] `POST /api/nonograms/preview` with invalid grid dimensions returns 400 with a clear error message

## Notes
None.
