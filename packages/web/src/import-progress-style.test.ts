import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const styleCssPath = fileURLToPath(
	new URL("../public/style.css", import.meta.url),
);

// public/style.css sets `.import-progress { display: flex; ... }` so the
// spinner/message is laid out correctly while shown. The element also
// carries the `hidden` attribute (toggled by setImportInProgress in
// import.js) to stay hidden until an import actually starts. Author-level
// `display` rules always win over the browser's default `[hidden] {
// display: none }` UA rule regardless of source order, so without an
// explicit `[hidden]` override here, the indicator is visible on page load
// even though `hidden` is set.
describe("import-progress CSS respects the hidden attribute", () => {
	it("forces display: none when the element is hidden", async () => {
		const css = await readFile(styleCssPath, "utf8");

		expect(css).toMatch(/\.import-progress\[hidden\]\s*\{[^}]*display:\s*none/);
	});
});
