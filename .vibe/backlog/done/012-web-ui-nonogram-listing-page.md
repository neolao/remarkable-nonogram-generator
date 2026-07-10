---
status: done
depends_on: [006, 008]
---
# Web UI: Nonogram Listing Page

## Description
Build a page in `packages/web/public` that browses saved nonograms, lets the user open one for editing, start a new one, or delete one from the list.

## Acceptance Criteria
- [x] The page lists every saved nonogram with its name and size, fetched from `GET /api/nonograms`
- [x] Clicking a listed nonogram navigates to the editor loaded with that nonogram's data
- [x] A "New nonogram" action starts the editor with a blank grid
- [x] Deleting a nonogram from the list removes it from the page without a full reload

## Notes
The editor page itself is a minimal placeholder for now (see ADR `.vibe/decisions/005-minimal-editor-stub-page.md`): "New nonogram" correctly navigates there with no id, but the actual blank grid rendering is delivered by backlog item 013.
