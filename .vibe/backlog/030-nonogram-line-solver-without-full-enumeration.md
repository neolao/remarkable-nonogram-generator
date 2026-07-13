---
status: todo
---
# Nonogram Line Solver Without Full Placement Enumeration

## Description
`solveNonogramFromClues`'s per-line deduction (`enumerateLinePlacements` in `packages/core/src/domain/nonogram-line-solver.ts`) works by generating the full list of every valid placement of a line's clue-blocks, then checking which cells are filled/empty across all of them. For a long line with many, large clue blocks, the number of valid placements can reach into the millions (confirmed real-world: nonograms.org puzzle [80350](https://www.nonograms.org/nonograms/i/80350), a 45x45 grid with unusually long/complex clues), which exhausts the Node.js heap and crashes the whole web server process — during the very first, plain propagation pass, before any hypothesis-testing is even involved. This is a pre-existing limitation (predates backlog item 029), discovered while fixing item where puzzle 80351 wrongly failed with "requires guessing" (see `.vibe/modules/nonogram-url-import.md`).

The fix is to replace the enumeration-based line solver with an algorithm that determines forced-filled/forced-empty cells directly, without ever materializing the full placement list — e.g. a DP/bitset-based approach computing, per line, the leftmost and rightmost feasible position of each clue block (or equivalent forward/backward reachability tables), then deriving each cell's forced state from where those ranges necessarily overlap.

## Acceptance Criteria
- [ ] Importing/solving a nonogram whose row or column clues would previously generate an extremely large number of valid placements (e.g. nonograms.org puzzle 80350) no longer crashes or hangs the server
- [ ] The new line-solving algorithm produces the exact same forced-cell deductions as the current enumeration-based one for every existing passing test case (no behavior change for puzzles that already work)
- [ ] Solving a single line's clue against known cells runs in time and memory proportional to the line length and number of clue blocks, not to the number of valid placements
- [ ] All existing `nonogram-line-solver.test.ts` tests — including the ones covering puzzle 80351's hypothesis-testing case and the under-constrained safety-net case — still pass unchanged

## Notes
The single-level hypothesis-probing pass added on top of line propagation (for puzzles like 80351) is out of scope here and should be left as-is; this item only concerns replacing what happens inside a single line's deduction. The user has offered to pair on this one rather than have it run fully autonomously — worth confirming with them before diving into the DP/bitset algorithm design during `/vibe:feature`.

Reference implementation to look at: https://github.com/monkeyArms/nonogram — may contain a non-enumeration-based line-solving algorithm worth studying/adapting for this fix.
