---
status: done
depends_on: [005]
---
# Web API: Get, Create, and Update a Nonogram

## Description
Add Fastify routes in `packages/web` to fetch a single saved nonogram by id (`GET /api/nonograms/:id`), create a new one (`POST /api/nonograms`), and update an existing one's grid/name (`PUT /api/nonograms/:id`), all backed by the `NonogramStore`.

## Acceptance Criteria
- [x] `POST /api/nonograms` with a valid grid and name creates a new nonogram and returns its id
- [x] `GET /api/nonograms/:id` returns the full saved grid and name for a known id, and 404 for an unknown id
- [x] `PUT /api/nonograms/:id` updates the stored grid/name and a subsequent `GET` reflects the change
- [x] `POST`/`PUT` with invalid grid dimensions returns 400 with a clear error message

## Notes
None.
