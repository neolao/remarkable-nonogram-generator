---
status: done
depends_on: [004]
---
# Web API: Nonogram PDF Generation Endpoint

## Description
Add a `POST /api/nonograms/generate` Fastify route in `packages/web` that takes a grid in the request body and returns PDF bytes, mirroring the existing `/api/mazes/generate` route in the sibling project.

## Acceptance Criteria
- [ ] `POST /api/nonograms/generate` with a valid grid returns 200 with a PDF content-type and non-empty PDF bytes
- [ ] `POST /api/nonograms/generate` with invalid grid dimensions returns 400 with a clear error message

## Notes
None.
