---
date: 2026-07-11
status: accepted
---
# Second nonograms.org import path: headless-browser DOM extraction from a puzzle URL

**Context:** Backlog item 020 (URL-based import directly from nonograms.org) had been abandoned early in this project in favor of item 021 (manual image upload + OCR + logic solver), over the site's terms of service prohibiting automated reproduction of its content. The user revisited this decision for personal, non-commercial use, wanting a cleaner reMarkable-formatted PDF than manually screenshotting a puzzle allows. Before committing to an approach, the printable page's client-side rendering was inspected: its `#nonogram_table` widget is built entirely by the site's own JavaScript after page load and is not present in the server-rendered HTML - reading it requires an actual (or headless) browser executing that JS, not a plain HTTP fetch. The page also embeds a large, deliberately obfuscated data array (`var d = [[...]]`) consumed through convoluted modular-arithmetic expressions in the site's minified JS - a pattern consistent with intentional anti-scraping obfuscation, not just passive terms-of-service boilerplate.

**Decision:**
- Proceed with a headless browser (Puppeteer) rendering the puzzle page, for personal use, with the CGU conflict explicitly acknowledged and accepted by the user (not resolved) — this is a conscious risk decision, not a claim that it's permitted.
- Once rendered, the puzzle's row/column clue numbers are read directly as plain HTML text from the widget's clue cells (`nmv{col}_{slot}` for column clues, `nmh{row}_{slot}` for row clues) — confirmed by inspection to be exact, human-readable digit text, not pixel data. This is used purely to read clues, not to reveal or scrape the actual solved grid (the widget's fillable cells, `nmf{row}_{col}`, start empty - it's a solving widget, not an answer key).
- The clue numbers feed into the existing logic-only nonogram solver (`solveNonogramFromClues`, built for item 021) unchanged, to reconstruct the grid - the same "never trust the source for cells, only clues, and reject rather than guess" guarantee applies identically to this new import path.

**Reason:** DOM text extraction of the clue numbers is strictly more reliable than image OCR (item 021/023) since it reads exact text rather than recognizing tiny rendered glyphs, and it removes the OCR accuracy problem entirely for this source. Reusing the existing solver avoids duplicating the "reconstruct grid from clues" logic between the image-upload and URL-based import paths. A headless browser is the only viable way to access this specific site's clue text, since it's rendered by JavaScript the site appears to have deliberately made resistant to static parsing.

**Rejected alternatives:**
- Reusing the OCR pipeline against a screenshot of the rendered page instead of DOM text extraction — rejected once DOM text access was confirmed to work directly, since it's strictly more accurate and doesn't need OCR at all.
- Not building this at all (leaving item 020 abandoned, as originally decided) — reconsidered at the user's explicit, informed request for personal use; see Context.
