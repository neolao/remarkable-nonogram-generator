---
status: done
---
# Nonogram Grid Data Model

## Description
Define the core nonogram grid type in `packages/core`: a width x height grid of boolean cells representing filled/empty state, with a constructor/validation function that rejects non-positive dimensions and dimensions too large to fit a reMarkable-2 page. This is a pure domain type with no rendering or persistence logic — every other nonogram feature builds on it.

## Acceptance Criteria
- [x] Creating a grid with a valid width, height, and cell values returns a Nonogram object
- [x] Creating a grid with a non-positive width or height throws a clear validation error
- [x] Creating a grid larger than the maximum size that fits a reMarkable-2 page throws a clear validation error
- [x] The grid type has no dependency on rendering, persistence, or any Node/browser-specific runtime

## Notes
The maximum grid size should be derived from the same reMarkable-2 page constants later used for PDF rendering (see the nonogram PDF rendering item), so the two never drift apart.
