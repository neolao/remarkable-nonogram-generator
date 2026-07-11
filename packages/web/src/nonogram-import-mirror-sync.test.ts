import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildNonogramImportRequest } from "./nonogram-import-request.js";

const importJsPath = fileURLToPath(
	new URL("../public/import.js", import.meta.url),
);

// public/import.js hand-mirrors buildNonogramImportRequest from the tested
// TS module above (see CLAUDE.md/.vibe/index.md: the static frontend has no
// build step to import it). This test extracts the mirrored source by name
// and runs it against representative inputs to catch silent drift between
// the two copies, since nothing else guards that the mirror stays in sync.
function extractFunctionSource(
	fileContent: string,
	functionName: string,
): string {
	const startMarker = `function ${functionName}(`;
	const startIndex = fileContent.indexOf(startMarker);
	if (startIndex === -1) {
		throw new Error(`Could not find function ${functionName} in import.js`);
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

async function loadMirroredImportRequestBuilder() {
	const source = await readFile(importJsPath, "utf8");
	const extractedSource = extractFunctionSource(
		source,
		"buildNonogramImportRequest",
	);

	return new Function(
		`${extractedSource}\nreturn { buildNonogramImportRequest };`,
	)() as {
		buildNonogramImportRequest: typeof buildNonogramImportRequest;
	};
}

describe("import.js mirrored logic", () => {
	it("builds the same import request as the tested TS module", async () => {
		const mirrored = await loadMirroredImportRequestBuilder();

		expect(
			mirrored.buildNonogramImportRequest("nonograms.org", true, "20", "20"),
		).toEqual(buildNonogramImportRequest("nonograms.org", true, "20", "20"));
		expect(
			mirrored.buildNonogramImportRequest("nonograms.org", false, "20", "20"),
		).toEqual(buildNonogramImportRequest("nonograms.org", false, "20", "20"));
		expect(
			mirrored.buildNonogramImportRequest("nonograms.org", true, "0", "20"),
		).toEqual(buildNonogramImportRequest("nonograms.org", true, "0", "20"));
		expect(mirrored.buildNonogramImportRequest("", true, "20", "20")).toEqual(
			buildNonogramImportRequest("", true, "20", "20"),
		);
	});
});
