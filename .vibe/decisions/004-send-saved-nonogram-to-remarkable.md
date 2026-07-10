---
date: 2026-07-10
status: accepted
---
# Send a saved nonogram to reMarkable: load-by-id, not stateless regeneration

**Context:** Backlog item 011 adds `POST /api/nonograms/:id/send`, mirroring the sibling `remarkable-maze-generator` project's `POST /api/mazes/send` (ADR `020-web-direct-remarkable-send-design` there), which regenerates the maze statelessly from request parameters on every send since mazes are never persisted.

**Decision:**
- The nonogram send route loads the nonogram from the existing `NonogramStore` by `:id` (like `GET /api/nonograms/:id`) instead of accepting a raw grid in the request body, since nonograms — unlike mazes — are already persisted before being sent.
- An unknown id returns `404` before any reMarkable authentication is attempted.
- The route is registered alongside the existing pairing routes (`registerRemarkableRoutes`), which gains the `NonogramStore` as an added dependency, keeping the "talks to reMarkable Cloud" routes grouped together as in the sibling project, rather than adding a reMarkable Cloud dependency to `registerNonogramRoutes`.
- The default visible name uploaded to reMarkable is the nonogram's own saved `name`; an optional `folder` field is forwarded to `uploadPdf`, same as the maze project's send route.
- Not-yet-authenticated behavior is reused as-is: `409 { error: "not_authenticated" }` when no credentials are stored, consistent with the existing pairing UX.

**Reason:** The nonogram domain already has a persistence layer the maze project lacks, so re-deriving the grid from request parameters would be redundant and would let the sent PDF silently diverge from what is actually saved. Grouping the send route with the pairing routes (rather than the CRUD routes) keeps the reMarkable Cloud dependency in one place, matching the established module boundary.

**Rejected alternatives:** Accepting the full grid in the request body and regenerating statelessly, mirroring the maze project exactly — rejected because it would duplicate data already in the store and risk sending a grid that doesn't match what's saved. Adding the `NonogramStore` dependency to `registerNonogramRoutes` instead — rejected to avoid introducing a reMarkable Cloud dependency into the nonogram CRUD module.
