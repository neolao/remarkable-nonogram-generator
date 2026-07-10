---
status: done
depends_on: [007, 010]
---
# Web API: Send a Nonogram to reMarkable

## Description
Add a `POST /api/nonograms/:id/send` Fastify route in `packages/web` that loads the saved nonogram, renders it to PDF, and uploads it to reMarkable Cloud, reusing the existing `authenticate`/`uploadPdf` flow and the pairing routes already implemented in `remarkable-routes.ts`. Mirrors the sibling project's `/api/mazes/send` route.

## Acceptance Criteria
- [x] Sending a known, saved nonogram id while authenticated uploads the rendered PDF and returns 200 with the visible name used
- [x] Sending while not authenticated (no stored reMarkable credentials) returns 409 with a `not_authenticated` error, matching the existing pairing UX
- [x] Sending an unknown nonogram id returns 404 without attempting authentication or upload
- [x] An optional target folder is forwarded to the upload step, same as the maze project's send route

## Notes
None.
