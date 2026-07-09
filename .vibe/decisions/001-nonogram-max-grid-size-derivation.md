---
date: 2026-07-09
status: accepted
---
# Nonogram maximum grid size derivation

**Context:** The nonogram grid data model (backlog item 001) must reject grids too large to fit a reMarkable 2 page. Cell size is not fixed — it scales down as the grid grows (a 10x10 grid has larger cells than a 20x20 grid) — so a naive "max cell count" limit would be arbitrary and disconnected from the physical page. Clue numbers (row/column hints, from backlog item 002) also need reserved space alongside the drawable grid area, and this same limit must later be reused unchanged by the PDF rendering feature (backlog item 004) so the two never drift apart.

**Decision:** Define the maximum grid dimensions as page constants (reMarkable 2 printable area in px) minus a reserved margin for clue numbers, divided by a minimum legible cell size in px. A grid is rejected if its width or height would force cells below that minimum once clue space is reserved. These constants live in `packages/core` as plain exported values, with no rendering or Node/browser dependency, so the domain type stays pure and the PDF rendering feature can import and reuse the exact same constants later.

**Reason:** Ties the abstract "maximum grid size" rule to a concrete, reusable physical constraint instead of an arbitrary cell count, while keeping the grid type itself free of any rendering logic — satisfying the acceptance criterion that this stays a pure domain type.

**Rejected alternatives:** A fixed arbitrary max cell count (e.g. 50x50) — simpler but has no real link to "fits a reMarkable 2 page" and could still overflow or under-utilize the page once actual clue rendering is built.
