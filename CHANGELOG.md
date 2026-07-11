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
- The editor page now shows a live preview image of your drawing, lets you download it as a PDF, and lets you send it straight to your paired reMarkable tablet with an optional destination folder; sending prompts you to save first if the drawing hasn't been saved yet, and reuses the existing pairing screen if your tablet isn't connected yet
- The live preview and the downloaded/sent PDF now draw a thicker line every 5 rows and every 5 columns, making larger grids easier to scan and count, similar to sudoku block grouping
- The editor page now remembers the last reMarkable destination folder you sent to, pre-filling it automatically on your next visit; clearing the field before sending forgets it again
- The editor page now has an "Include solution on page 2" option: when enabled, the downloaded or sent PDF gets a second page showing the solved grid, so you can check your answer without leaving the tablet
- You can now import a puzzle by pasting its nonograms.org page URL on a new "Import a nonogram" page: the clue numbers are read directly from the page and the puzzle's grid is worked out from them the same way a person solving it logically would, without ever trusting the source for the actual cell layout; a puzzle that isn't fully solvable by logic alone, or a page that can't be read, is rejected with a clear error instead of guessing
- The home page's saved nonograms list now shows a small thumbnail of each puzzle's drawn grid next to its name and size, making it easier to recognize a puzzle at a glance without opening it
- The nonograms.org URL import form now shows a progress indicator (spinner and message) while the import is running, since it can take up to a minute, and disables the Import button until it finishes

### Changed

- Row and column clue numbers in the live preview and the PDF are now packed more tightly together, leaving more room for the puzzle grid itself while staying just as readable, especially on grids with many clues per row or column

### Fixed

- The downloaded and sent PDF is now always a blank puzzle grid showing only the row/column clues, instead of showing the drawn solution with cells already filled in — the live in-browser preview still shows your drawing as-is while you edit it
- The "Import in progress" indicator on the import page no longer shows up as soon as the page loads; it now only appears while an import you actually started is running
- Sending to a reMarkable destination folder no longer fails outright when the reMarkable Cloud service is briefly slow to respond about a single item on your account; the app now retries once before giving up
