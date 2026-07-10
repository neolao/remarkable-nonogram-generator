---
status: done
---
# Thicker Gridlines Every 5 Rows/Columns

## Description
Both the live SVG preview and the exported PDF currently draw every grid cell border with the same stroke width, which makes larger grids hard to read at a glance (similar to how sudoku groups cells visually). Draw a thicker line every 5 rows and every 5 columns so the grid is easier to scan and count, on the tablet as well as in the browser.

## Acceptance Criteria
- [x] In the live SVG preview, the border is visibly thicker every 5th row line and every 5th column line compared to regular cell borders
- [x] In the generated/downloaded PDF, the same thicker line pattern appears every 5 rows and every 5 columns
- [x] A grid smaller than 5 in a dimension shows only the regular, non-thickened borders (no thick line appears at the outer edge only)
- [x] The thicker lines do not overlap or misalign with the regular cell grid, and clue numbers remain fully readable

## Notes
Applies to both `renderNonogramToSvg` and `renderNonogramToPdf`, so it touches the SVG and PDF rendering rather than either one alone. Every 5th line convention (not every 5th cell) means the thick lines sit at row/column indices 0, 5, 10, … — confirm the exact placement convention with the user if ambiguous once implementation starts.
