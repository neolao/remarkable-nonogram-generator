---
date: 2026-07-13
status: accepted
---
# Line solver replaces full placement enumeration with a leftmost/rightmost "push" algorithm

**Context:** `solveLine`'s per-line deduction (`nonogram-line-solver.ts`) worked by enumerating every valid placement of a line's clue-blocks, then checking which cells were filled/empty across all of them. On a real nonograms.org puzzle (#80350, 45x45), one line alone had 129,024,480 valid placements, exhausting the Node.js heap and crashing the server (backlog item 030).

**Decision:** Replace the enumeration with a "push" algorithm: push the clue-blocks as far left as possible, then as far right as possible, and derive each cell's forced state from where a cell lands in the same block (by run position) in both extremes. Runs in time proportional to line length x number of blocks instead of the placement count.

**Reason:** Two reference implementations were studied and benchmarked against real puzzles (#80350's pathological line, #80351's hypothesis-testing case) before choosing an approach:
- `thomasr/nonogram-solver`'s push technique: ~80 lines, zero dependencies, functionally pure (`(line, hints) → line`) — a natural drop-in replacement for the existing per-call `solveLine` signature. Verified sound against a from-scratch reference enumeration across 500,000+ randomized line/known-cell combinations (0 incorrect deductions). Solves #80350's worst line (129M placements) in under 1ms; a full first propagation pass over the entire 45x45 puzzle completes in ~18ms.
- `monkeyArms/nonogram`'s solver: a stateful class maintaining, per line, each clue-block's list of possible start indexes across many passes, combined with five other interacting deduction techniques and persistent cross-pass state. A faithful single-call adaptation (to fit this project's stateless per-pass model) produced false "impossible" contradictions on ~1.2% of fuzzed lines that were actually solvable — an unsafe false-positive, not just an incompleteness gap — and would need a larger architectural change (persistent per-line state across passes) to use as designed.

Porting just the push algorithm's core technique (not depending on the `nonogram-solver` npm package) keeps `core` free of an unrelated dependency — that package pulls in `commander` and a full CLI/multi-solver harness this project doesn't need, which would go against the project's preference for narrow, dependency-light libraries (see ADR `003`, ADR `017`).

As a side effect, this also fixed a pre-existing correctness bug in the enumeration it replaced: the old algorithm's placement search shared one mutable array across sibling recursive branches, letting state leak between them and, in rare cases (~1 in 1,400 randomly-generated lines during fuzzing), silently missing a valid forced-cell deduction it should have found (never an incorrect one, just an incomplete one). This was never caught by the hand-picked example tests already in the suite.

**Rejected alternatives:**
- Keeping full enumeration with a placement-count cap/early-abort: would turn the crash into a silent "requires guessing" false negative for large-but-solvable lines, rather than actually fixing the underlying algorithmic complexity.
- Depending on the `nonogram-solver` npm package directly: unnecessary dependency surface (CLI parsing, unrelated solvers/serializers) for ~80 lines of algorithm this project already needed to adapt to its own `CellState`-based per-line contract anyway.
- Porting `monkeyArms/nonogram`'s interval-tracking technique: less safe (false-positive contradictions found during fuzzing) and a poorer architectural fit without introducing persistent per-line state this project's line solver doesn't otherwise have.
