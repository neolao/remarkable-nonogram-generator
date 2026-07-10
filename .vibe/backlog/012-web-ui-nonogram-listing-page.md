---
status: todo
depends_on: [006, 008]
---
# Web UI: Nonogram Listing Page

## Description
Build a page in `packages/web/public` that browses saved nonograms, lets the user open one for editing, start a new one, or delete one from the list.

## Acceptance Criteria
- [ ] The page lists every saved nonogram with its name and size, fetched from `GET /api/nonograms`
- [ ] Clicking a listed nonogram navigates to the editor loaded with that nonogram's data
- [ ] A "New nonogram" action starts the editor with a blank grid
- [ ] Deleting a nonogram from the list removes it from the page without a full reload

## Notes
None.
