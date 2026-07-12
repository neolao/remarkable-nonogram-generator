---
status: done
---
# Find an Importable Nonogram Source

## Description
Research and identify an external source of nonogram puzzles whose terms of service or license explicitly allow programmatic access or reuse of puzzle data — unlike nonograms.org, whose CGU explicitly prohibit reproducing site content (see item 020, abandoned, and the OCR-based workaround built instead in item 021). The goal is to find a source that could support a cleaner, more reliable import path (e.g. a documented API or a downloadable puzzle format) as a candidate for a future additional image/import type.

## Acceptance Criteria
- [ ] A candidate source is identified whose terms of service or license clearly permit programmatic/bulk access to puzzle data, not just personal manual viewing — **not satisfied**: no such candidate exists among the sources investigated (see Research Findings below); this negative result is itself the research outcome
- [x] The candidate's puzzle data format (API response shape, downloadable file format, or well-structured page markup) is documented well enough to design a parser against it — done for webpbn.com, the best technical (but not licensing) candidate found
- [x] A comparison is presented against the existing nonograms.org OCR + logic-solver import (item 021), noting whether the candidate would be simpler or more reliable to support
- [x] A recommendation is recorded on whether to pursue this source as a new supported image/import type

## Research Findings

Investigated: webpbn.com, griddlers.net, GitHub puzzle datasets (`SmilingWayne/puzzlekit-dataset`, `mikix/nonogram-db`), and the closed commercial nonogram.com (Easybrain).

- **webpbn.com** — restrictive. Its `export.cgi` page states puzzles are copyrighted by their posting authors: *"Exporting puzzles for personal use is fine, but it would be inappropriate to submit them to other puzzle archives on the web or distribute them in any other way without the permission of the puzzle author."* No explicit allowance for programmatic/bulk access. However, its data format is well documented and directly usable: `POST https://webpbn.com/export.cgi` with `id`, `fmt`, `go=1` params, supporting ~20 export formats (XML documented at `pbn_fmt.html`, plus `.NON`, `.G`, CSV, etc.) containing dimensions, row/column clues, and an optional solution — no scraping or logic-solving needed, unlike the current nonograms.org path.
- **griddlers.net** — more restrictive than nonograms.org: its terms of use explicitly prohibit *"any kind of software or bot for solving any type of puzzle on the website... in an automated way."*
- **GitHub puzzle datasets** (`puzzlekit-dataset`, `nonogram-db`) — status unclear at best: their wrapper repos carry a permissive license (e.g. MIT), but the underlying puzzle data is sourced from janko.at/puzz.link/webpbn, which themselves claim "all rights reserved" or the same webpbn restriction. The wrapper's license does not appear to cover the puzzle content itself.
- **nonogram.com (Easybrain)** — closed commercial product, no API/export surface.

**Recommendation: do not pursue a new import type based on this research.** No investigated source has a license or ToS that explicitly permits programmatic or bulk access — every major community site (webpbn.com, griddlers.net) explicitly reserves puzzles for personal use and prohibits redistribution or automation, and the open-license-looking GitHub datasets inherit an unresolved rights problem from their upstream sources. Keeping the current nonograms.org approach (headless-browser scraping + logic solver, already explicitly flagged as an acknowledged "personal-use" compromise, see ADR 011) remains the most honest option available. If the priority ever shifts from the licensing question to purely reducing scraping fragility, webpbn.com would be the better *technical* choice (structured export, no solver required) — but it would not resolve the underlying licensing concern this item set out to address.

## Notes
This was a research/investigation task, not an implementation task — it concludes with the documented recommendation above, not code. Cross-reference with `.vibe/backlog/done/020-import-nonograms-from-nonograms-org.md` and `.vibe/backlog/done/021-import-nonogram-from-image.md` for prior context on why nonograms.org itself was ruled out as fully compliant.
