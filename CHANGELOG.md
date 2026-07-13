# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.1] - 2026-07-14

### Changed

- Docker deployments and local development now require Node.js 25 or later (previously 22)

### Fixed

- Importing a nonograms.org puzzle with unusually long or complex clues no longer crashes the server

## [0.3.0] - 2026-07-12

### Added

- The editor's grid now draws a thicker line every 5 rows and every 5 columns while you draw, matching the same look already used in the live preview and generated PDF
- Each cell in the editor's grid now has a proper label for screen readers, announcing its row and column position

### Changed

- The live preview and PDF renderers now share the same internal grid-layout code instead of each computing it separately; this is an internal reorganization with no change to how the app behaves

### Fixed

- The editor now shows a clear error message if refreshing the live preview or generating the PDF fails, instead of failing silently
- Importing a zip archive with more than 500 files is now rejected with a clear error instead of risking an overloaded import
- Importing a nonograms.org puzzle now fails with a clear error instead of silently producing an empty grid if the site's page layout has changed and no clue numbers could be read at all
- Sending a puzzle to reMarkable now reuses your already-connected session directly instead of re-checking your stored credentials a second time, avoiding a confusing pairing-code error in a rare race condition

## [0.2.0] - 2026-07-12

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
- The editor page now shows a live preview image of your drawing, lets you download it as a PDF, and lets you send it straight to your paired reMarkable tablet with an optional destination folder; sending prompts you to save first if the drawing hasn't been saved yet, and reuses the existing pairing screen if your tablet isn't connected yet
- The live preview and the downloaded/sent PDF now draw a thicker line every 5 rows and every 5 columns, making larger grids easier to scan and count, similar to sudoku block grouping
- The editor page now remembers the last reMarkable destination folder you sent to, pre-filling it automatically on your next visit; clearing the field before sending forgets it again
- The editor page now has an "Include solution on page 2" option: when enabled, the downloaded or sent PDF gets a second page showing the solved grid, so you can check your answer without leaving the tablet
- You can now import a puzzle by pasting its nonograms.org page URL on a new "Import a nonogram" page: the clue numbers are read directly from the page and the puzzle's grid is worked out from them the same way a person solving it logically would, without ever trusting the source for the actual cell layout; a puzzle that isn't fully solvable by logic alone, or a page that can't be read, is rejected with a clear error instead of guessing
- The home page's saved nonograms list now shows a small thumbnail of each puzzle's drawn grid next to its name and size, making it easier to recognize a puzzle at a glance without opening it
- The nonograms.org URL import form now shows a progress indicator (spinner and message) while the import is running, since it can take up to a minute, and disables the Import button until it finishes
- The app can now be deployed as a single Docker container (with a ready-to-use `docker-compose.yml`), including a step-by-step guide for running it on a Synology NAS through Container Manager; saved nonograms and reMarkable pairing persist across container restarts and image updates via a mounted volume
- Each saved nonogram in the home page's list now has an Export button to download it as a JSON file, and the import page now has a second form to import a nonogram from such a JSON file; as with any import, the row/column clues are recomputed from the file's grid rather than trusted as-is, and a malformed, incorrectly-shaped, or oversized file is rejected with a clear error
- The home page now has an "Export all" button to download every saved nonogram at once as a single zip archive, and the import page has a third form to import that archive back: each nonogram inside always creates a new saved nonogram, and an entry that can't be read (not a JSON file, or an invalid/oversized grid) is reported and skipped instead of stopping the whole import

### Changed

- The `core` package's internal code organization now makes its layering explicit (pure puzzle logic, use cases, and technical details like PDF/SVG rendering or the reMarkable Cloud connection, each in their own place); this is an internal reorganization with no change to how the app behaves
- Row and column clue numbers in the live preview and the PDF are now packed more tightly together, leaving more room for the puzzle grid itself while staying just as readable, especially on grids with many clues per row or column
- The home page, editor, and import pages now use a mobile-first design: comfortably tappable buttons and fields, a saved nonogram's name no longer gets squeezed by its Export/Delete buttons on a narrow screen, and a large puzzle grid scrolls with its row/column clue numbers pinned in view instead of shrinking to fit. On wider screens, the layout is deliberately adapted rather than just stretched — the saved nonograms list becomes a multi-column grid of cards, and paired sections like the editor's grid/preview or the two import forms sit side by side

### Fixed

- The downloaded and sent PDF is now always a blank puzzle grid showing only the row/column clues, instead of showing the drawn solution with cells already filled in — the live in-browser preview still shows your drawing as-is while you edit it
- The "Import in progress" indicator on the import page no longer shows up as soon as the page loads; it now only appears while an import you actually started is running
- Sending to a reMarkable destination folder no longer fails outright when the reMarkable Cloud service is briefly slow to respond about a single item on your account; the app now retries once before giving up
- Importing a nonograms.org puzzle no longer fails with "requires guessing" on puzzles that are solvable by reasoning about one cell at a time and ruling out impossible guesses, instead of only puzzles solvable row-by-row/column-by-column at a glance

[Unreleased]: https://github.com/neolao/remarkable-nonogram-generator/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/neolao/remarkable-nonogram-generator/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/neolao/remarkable-nonogram-generator/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/neolao/remarkable-nonogram-generator/releases/tag/v0.2.0
