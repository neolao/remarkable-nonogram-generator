# Ubiquitous Language

## Pairing code
**Definition:** One-time code obtained from `my.remarkable.com/device/browser/connect`, used once to register this app as a trusted device on the user's reMarkable Cloud account. Exchanged for a long-lived device token, which is what gets persisted locally.
**Code:** `authenticate()` in `packages/core/src/remarkable-auth.ts`

## Nonogram
**Definition:** A picture logic puzzle (also known as picross) solved by filling grid cells according to numeric clues per row/column. In this project, the grid is drawn manually by the user rather than generated. The grid data model and clue computation exist; rendering and persistence are not yet implemented.
**Code:** `createNonogram()`, `Nonogram` in `packages/core/src/nonogram-grid.ts`

## Clue
**Definition:** The ordered list of consecutive filled-cell run lengths for a single row or column of a nonogram — the numeric hints a player uses to solve the puzzle. An entirely empty row/column is conventionally represented by a single clue of `0` rather than an empty list.
**Code:** `computeNonogramClues()`, `NonogramClues` in `packages/core/src/nonogram-clues.ts`
