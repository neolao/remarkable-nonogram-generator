---
status: todo
depends_on: [002, 013]
---
# Web UI: Live Clue Display

## Description
As the user draws in the manual grid editor, show row/column clues next to the grid, computed client-side in JS for instant feedback, following the same "mirrored logic duplicated into the static page, no build step" pattern already used for `maze-form-validation` in the sibling project's `app.js`.

## Acceptance Criteria
- [ ] Toggling any cell updates the displayed row and column clues immediately, without a network request
- [ ] The client-side clue values match what the server-side clue computation would produce for the same grid
- [ ] An all-empty grid displays clues consistent with the documented empty-clue convention

## Notes
None.
