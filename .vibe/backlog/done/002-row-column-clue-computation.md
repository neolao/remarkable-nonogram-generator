---
status: done
depends_on: [001]
---
# Row/Column Clue Computation

## Description
Add a pure function in `packages/core` that computes nonogram clues from a grid: for every row and every column, the lengths of consecutive runs of filled cells, in order. This is the calculation that turns a hand-drawn grid into a solvable puzzle.

## Acceptance Criteria
- [ ] An all-empty row/column produces its designated empty-clue value (decide and document the convention: empty list vs. a single 0)
- [ ] A row/column with multiple separated runs of filled cells produces one clue number per run, in left-to-right / top-to-bottom order
- [ ] A fully filled row/column produces a single clue equal to its length
- [ ] A single call returns both row clues and column clues for the whole grid

## Notes
None.
