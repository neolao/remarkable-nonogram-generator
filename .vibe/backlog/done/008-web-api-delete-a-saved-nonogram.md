---
status: done
depends_on: [005]
---
# Web API: Delete a Saved Nonogram

## Description
Add a `DELETE /api/nonograms/:id` Fastify route in `packages/web`, backed by the `NonogramStore`, so users can remove nonograms they no longer need from the listing.

## Acceptance Criteria
- [ ] `DELETE /api/nonograms/:id` on a known id removes it, and a subsequent `GET` returns 404
- [ ] `DELETE /api/nonograms/:id` on an unknown id returns 404 rather than a server error

## Notes
None.
