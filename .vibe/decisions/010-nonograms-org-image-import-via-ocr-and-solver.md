---
date: 2026-07-11
status: superseded by 012
---
# First image import type: OCR clues + logical solver for nonograms.org-style print images

**Context:** Building the "import a nonogram from an image" feature (backlog item 021), which lets the user pick an image type from a list so the correct parsing strategy applies; only one type needs to exist initially, extensible later. A real example image was provided: it is nonograms.org's printable puzzle layout — a blank, unsolved grid with row/column clue numbers in the margins, no filled cells at all (unlike a solved/answer image). An earlier attempt to auto-fetch puzzles directly from nonograms.org (backlog item 020) was abandoned over that site's terms of service explicitly prohibiting reproduction of its content; the same concern was re-flagged here since the example image originates from that site's print page, even though the application never fetches it automatically — the user accepted this and chose to proceed regardless.

**Decision:**
- The first supported image type, `nonograms.org`, targets this blank-grid-with-clue-numbers layout (not a solved/filled grid). Parsing has two stages: (1) locate and read the row/column clue numbers from the image margins via optical character recognition (OCR), (2) run a nonogram line-solver (iterative logical deduction per row/column, no backtracking/guessing) over the recognized clues to reconstruct the unique filled/empty grid.
- The solver only performs deduction that would be valid without guessing. If it cannot fully determine every cell this way, the import is rejected with a clear "could not fully solve this puzzle" error rather than guessing a plausible-looking grid. This is safe because nonograms.org guarantees every one of its puzzles is solvable by logic alone.
- As with every nonogram in this project, the clues ultimately persisted are recomputed by the existing clue engine from the reconstructed cells — the OCR'd numbers are only an intermediate input to reconstruct cells, never trusted or stored directly.
- A previous ADR in this same slot number explored a different first type (sampling pixel darkness from an already-solved bordered-grid image) before the real example image revealed the actual expected input is the unsolved, clue-only print layout; that exploration was discarded before being implemented, so no formal supersede record exists for it.

**Reason:** The blank print-page layout does not contain any filled-cell pixel data to sample — only text. OCR + logical solving is the only viable way to derive a grid from this specific image type. Restricting the solver to pure logical deduction (rejecting ambiguous puzzles instead of backtracking/guessing) keeps the implementation deterministic, testable, and aligned with how nonograms.org itself designs its puzzles (solvable without guessing), avoiding the correctness risk and complexity of a full constraint-satisfaction/backtracking solver for puzzles that should never need one.

**Rejected alternatives:**
- Sampling pixel darkness from a pre-solved image (the original plan before the real example was seen) — rejected once the actual expected input turned out to be an unsolved, clue-only image with nothing to sample.
- A full backtracking/guessing solver able to handle ambiguous puzzles — rejected as unnecessary complexity for puzzles that are always logically solvable by design, and undesirable since a guessed (non-unique) solution could silently be wrong.
