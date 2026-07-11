---
status: todo
---
# JSON Export and Import for a Nonogram

## Description
Let a user export any saved nonogram from the home page's list as a downloadable JSON file, and re-import a nonogram from a JSON file in that same format to create a new saved nonogram. This gives users a way to back up or transfer a puzzle outside the app, independent of the existing nonograms.org URL import path.

## Acceptance Criteria
- [ ] From the home page's saved nonograms list, the user can download a JSON file for any nonogram in the list
- [ ] The downloaded JSON fully captures the nonogram (its grid dimensions and filled/empty cells) so it can be reconstructed exactly on import
- [ ] The user can import a nonogram by uploading a JSON file in this format, which creates a new saved nonogram
- [ ] Uploading a JSON file that is malformed, not in the expected format, or describes an invalid/oversized grid is rejected with a clear error instead of creating a broken nonogram

## Notes
Per this project's standing rule (see CLAUDE.md), row/column clues must always be (re)derived from the imported cells rather than trusted from the file, even though this JSON format is the app's own round-trip format. Consider whether the export/import UI lives on the existing "Import a nonogram" page (alongside the URL import form) or directly on the home page list — left open for the implementation plan to decide.
