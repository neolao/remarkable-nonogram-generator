---
status: todo
---
# Find an Importable Nonogram Source

## Description
Research and identify an external source of nonogram puzzles whose terms of service or license explicitly allow programmatic access or reuse of puzzle data — unlike nonograms.org, whose CGU explicitly prohibit reproducing site content (see item 020, abandoned, and the OCR-based workaround built instead in item 021). The goal is to find a source that could support a cleaner, more reliable import path (e.g. a documented API or a downloadable puzzle format) as a candidate for a future additional image/import type.

## Acceptance Criteria
- [ ] A candidate source is identified whose terms of service or license clearly permit programmatic/bulk access to puzzle data, not just personal manual viewing
- [ ] The candidate's puzzle data format (API response shape, downloadable file format, or well-structured page markup) is documented well enough to design a parser against it
- [ ] A comparison is presented against the existing nonograms.org OCR + logic-solver import (item 021), noting whether the candidate would be simpler or more reliable to support
- [ ] A recommendation is recorded on whether to pursue this source as a new supported image/import type

## Notes
This is a research/investigation task, not an implementation task — it should conclude with a documented recommendation (e.g. a note or a follow-up backlog item), not code. Known candidates worth checking first: webpbn.com (mentioned earlier in this project's discussions as potentially offering a text export per puzzle) and any site with an explicit open-data/API license. Cross-reference with `.vibe/backlog/done/020-import-nonograms-from-nonograms-org.md` and `.vibe/backlog/done/021-import-nonogram-from-image.md` for prior context on why nonograms.org itself was ruled out.
