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
- The web app now exposes an endpoint to list every saved nonogram with its name, size, and last-modified date, laying the groundwork for the upcoming listing page
- Nonograms can now be created, fetched by id, and updated (name and/or grid) through the web app's API, with a clear error returned when the grid is invalid
- Saved nonograms can now be deleted through the web app's API
- The web app can now render a live SVG preview of any grid through its API, even before it has been saved
- The web app can now generate a downloadable PDF for any grid through its API, ready to print or send to a reMarkable tablet
- A saved nonogram can now be sent directly to a paired reMarkable tablet through the web app's API, with a clear message when pairing is required first
- The web app's home page now lists every saved nonogram with its name and size, lets you start a new one, and lets you delete one from the list without reloading the page
- The editor page now lets you draw a nonogram by hand: pick a width and height to create an empty grid, click cells to fill or clear them instantly, and reopen an already-saved puzzle with its grid pre-filled; sizes too large for a reMarkable 2 page are rejected with a clear message
- The editor page now shows row and column clues next to the grid, updating instantly as you toggle cells, with no page reload needed
- The editor page now lets you name and save your drawing: a new nonogram is created on first save, further saves on the same drawing update it in place instead of creating a duplicate, and a validation message appears if you try to save without a name
