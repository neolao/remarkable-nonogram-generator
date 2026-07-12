import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const styleCssPath = fileURLToPath(
	new URL("../public/style.css", import.meta.url),
);

// public/editor.js applies .thick-left / .thick-top to grid cells at every
// interior multiple of 5 rows/columns (see nonogram-client-grid-lines.ts),
// mirroring the thicker-every-5-lines convention already used by the SVG
// preview and PDF renderers. This test checks the CSS actually renders a
// visibly thicker border for those classes, following the same
// content-based pattern as import-progress-style.test.ts since this project
// has no jsdom/browser-rendering test environment.
describe("nonogram editor grid thick-line styling", () => {
	it("draws a thicker left border for cells marking a thick column boundary", async () => {
		const css = await readFile(styleCssPath, "utf8");

		expect(css).toMatch(
			/\.nonogram-cell\.thick-left\s*\{[^}]*border-left:\s*2px/,
		);
	});

	it("draws a thicker top border for cells marking a thick row boundary", async () => {
		const css = await readFile(styleCssPath, "utf8");

		expect(css).toMatch(
			/\.nonogram-cell\.thick-top\s*\{[^}]*border-top:\s*2px/,
		);
	});
});
