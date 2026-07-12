import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const styleCssPath = fileURLToPath(
	new URL("../public/style.css", import.meta.url),
);
const editorHtmlPath = fileURLToPath(
	new URL("../public/editor.html", import.meta.url),
);
const importHtmlPath = fileURLToPath(
	new URL("../public/import.html", import.meta.url),
);

// Matches a rule whose selector list contains an exact `selector` entry
// (e.g. "button,\n.button {" or ".button {"), not a compound/descendant
// selector that merely contains the same substring (e.g. ".foo .button {").
function extractRule(css: string, selector: string): string {
	const ruleRegex = /([^{}]+)\{([^}]*)\}/g;
	for (const match of css.matchAll(ruleRegex)) {
		const selectors = match[1].split(",").map((part) => part.trim());
		if (selectors.includes(selector)) {
			return match[2];
		}
	}
	throw new Error(`Could not find rule for selector: ${selector}`);
}

describe("mobile-first responsive design", () => {
	it("pins the column clues in place while the grid scrolls", async () => {
		const css = await readFile(styleCssPath, "utf8");

		expect(extractRule(css, ".column-clues")).toMatch(/position:\s*sticky/);
	});

	it("pins the row clues in place while the grid scrolls", async () => {
		const css = await readFile(styleCssPath, "utf8");

		expect(extractRule(css, ".row-clues")).toMatch(/position:\s*sticky/);
	});

	it("gives buttons a touch-friendly minimum height", async () => {
		const css = await readFile(styleCssPath, "utf8");

		expect(extractRule(css, ".button")).toMatch(/min-height:\s*44px/);
	});

	it("gives text inputs a touch-friendly minimum height", async () => {
		const css = await readFile(styleCssPath, "utf8");

		expect(extractRule(css, ".field input")).toMatch(/min-height:\s*44px/);
	});

	it("stacks the nonogram name above its actions on narrow screens so the name isn't squeezed", async () => {
		const css = await readFile(styleCssPath, "utf8");

		expect(extractRule(css, ".nonogram-item")).toMatch(
			/flex-direction:\s*column/,
		);
	});

	it("switches the saved nonograms list to a multi-column grid on wide screens", async () => {
		const css = await readFile(styleCssPath, "utf8");

		const wideLayoutBlock = css.match(
			/@media \(min-width:[^)]*\)\s*\{[\s\S]*?\.nonogram-list\s*\{([^}]*)\}/,
		);
		expect(wideLayoutBlock).not.toBeNull();
		expect(wideLayoutBlock?.[1]).toMatch(/display:\s*grid/);
	});

	it("switches the editor's board and preview cards to a side-by-side layout on wide screens", async () => {
		const css = await readFile(styleCssPath, "utf8");

		const wideLayoutBlock = css.match(
			/@media \(min-width:[^)]*\)\s*\{[\s\S]*?\.layout-columns\s*\{([^}]*)\}/,
		);
		expect(wideLayoutBlock).not.toBeNull();
		expect(wideLayoutBlock?.[1]).toMatch(/display:\s*grid/);
	});

	it("wraps the editor's board and preview cards in the two-column layout container", async () => {
		const html = await readFile(editorHtmlPath, "utf8");

		expect(html).toMatch(/class="[^"]*layout-columns[^"]*"/);
	});

	it("wraps the import page's two forms in the two-column layout container", async () => {
		const html = await readFile(importHtmlPath, "utf8");

		expect(html).toMatch(/class="[^"]*layout-columns[^"]*"/);
	});
});
