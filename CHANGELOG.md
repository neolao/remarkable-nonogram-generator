# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Nonogram grids can now be created with a width, height, and filled/empty cells, with automatic rejection of invalid or oversized grids that wouldn't fit on a reMarkable 2 page
- Row and column clues (the numeric hints of a nonogram puzzle) are now computed automatically from a drawn grid, with an empty row or column represented by a single 0
- Nonogram grids can now be rendered as an SVG image, with filled and empty cells visually distinguished and row/column clues shown alongside the grid, for future use as a live preview
- Nonogram grids can now be rendered as a downloadable PDF sized for the reMarkable 2 tablet, matching the same grid/clue layout as the live preview
- Nonograms can now be saved to disk under a generated id, listed, reloaded, and deleted, laying the groundwork for saving and reopening puzzles from the web app
