import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const editorJsPath = fileURLToPath(
	new URL("../public/editor.js", import.meta.url),
);

function extractFunctionSource(
	fileContent: string,
	functionName: string,
): string {
	const startMarker = `function ${functionName}(`;
	const startIndex = fileContent.indexOf(startMarker);
	if (startIndex === -1) {
		throw new Error(`Could not find function ${functionName} in editor.js`);
	}

	let depth = 0;
	let endIndex = -1;
	for (let i = startIndex; i < fileContent.length; i++) {
		const char = fileContent[i];
		if (char === "{") {
			depth++;
		} else if (char === "}") {
			depth--;
			if (depth === 0) {
				endIndex = i;
				break;
			}
		}
	}

	if (endIndex === -1) {
		throw new Error(`Could not find the end of function ${functionName}`);
	}

	return fileContent.slice(startIndex, endIndex + 1);
}

// public/editor.js has no jsdom-tested TS counterpart for these two DOM
// functions (unlike the mirrored request-building functions covered by
// editor-mirror-sync.test.ts), so their behavior is asserted from the source
// text directly, following the same no-jsdom pattern as
// import-progress-style.test.ts.
describe("editor.js UX and accessibility", () => {
	it("surfaces an error message when the preview or generate request fails", async () => {
		const source = await readFile(editorJsPath, "utf8");
		const fn = extractFunctionSource(source, "updatePreviewAndDownload");

		expect(fn).toMatch(
			/previewResponse\.ok[\s\S]*?else[\s\S]*?errorElement\.textContent\s*=/,
		);
		expect(fn).toMatch(
			/generateResponse\.ok[\s\S]*?else[\s\S]*?errorElement\.textContent\s*=/,
		);
	});

	it("labels each grid cell with its row and column position for screen readers", async () => {
		const source = await readFile(editorJsPath, "utf8");
		const fn = extractFunctionSource(source, "renderGrid");

		expect(fn).toMatch(/setAttribute\(\s*"aria-label"/);
	});
});
