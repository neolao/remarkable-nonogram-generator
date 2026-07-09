---
date: 2026-07-10
status: accepted
---
# Empty row/column clue convention

**Context:** Implementing the row/column clue computation for nonograms. A row or column with no filled cells has no runs, so there is no single obvious representation for its clue list.

**Decision:** An all-empty row or column produces a clue list containing a single `0` (e.g. `[0]`), never an empty list.

**Reason:** This matches the conventional display used by classic nonogram/picross puzzles, where an empty line is shown with a single "0" rather than left blank, avoiding ambiguity with "not yet computed".

**Rejected alternatives:** Representing an empty row/column with an empty array (`[]`) — rejected because it is visually indistinguishable from "no clues computed" and diverges from the puzzle convention players expect.
