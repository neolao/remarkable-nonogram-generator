---
date: 2026-07-11
status: accepted
---
# Thick gridlines never apply to the outer border

**Context:** Backlog item 019 asks for a thicker line every 5 rows/columns in the SVG preview and PDF export, similar to sudoku block grouping. The convention for where exactly the thick lines land (row/column indices 0, 5, 10, …) was ambiguous: does the outer edge of the grid also get thickened when the grid's width or height is itself a multiple of 5 (e.g. a 10x10 grid)?

**Decision:** Thick lines only apply to interior grid lines, i.e. at index `i` where `i % 5 === 0` and `0 < i < width` (or `height`). The outermost border (index `0` and index `width`/`height`) always renders at the regular stroke width, regardless of whether the grid's total width/height is a multiple of 5.

**Reason:** Confirmed with the user. This also keeps the behavior consistent with the acceptance criteria: a grid smaller than 5 in a dimension must show only regular borders, including at its outer edge — which only holds if outer edges are categorically excluded from the "multiple of 5" rule rather than incidentally excluded by being smaller than the first multiple.

**Rejected alternatives:** Thickening the outer border whenever the total width/height is a multiple of 5 — rejected because it would make the border thickness depend on the overall grid size, which is inconsistent and surprising (e.g. a 10x10 grid vs. a 10x11 grid would render different border weights on the same left/right edges).
