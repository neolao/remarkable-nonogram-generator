import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validateNonogramJsonImportFile } from "./nonogram-json-import-file.js";

const importJsPath = fileURLToPath(
	new URL("../public/import.js", import.meta.url),
);

// public/import.js hand-mirrors validateNonogramJsonImportFile from the
// tested TS module above (see CLAUDE.md/.vibe/index.md: the static frontend
// has no build step to import it). This test extracts the mirrored source by
// name and runs it against representative inputs to catch silent drift
// between the two copies, since nothing else guards that the mirror stays in
// sync.
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

async function loadMirroredValidateNonogramJsonImportFile() {
	const source = await readFile(importJsPath, "utf8");
	const extractedSource = extractFunctionSource(
		source,
		"validateNonogramJsonImportFile",
	);

	return new Function(
		`${extractedSource}\nreturn { validateNonogramJsonImportFile };`,
	)() as {
		validateNonogramJsonImportFile: typeof validateNonogramJsonImportFile;
	};
}

describe("import.js mirrored JSON import file validation logic", () => {
	it("behaves the same as the tested TS module for a selected file", async () => {
		const mirrored = await loadMirroredValidateNonogramJsonImportFile();

		expect(
			mirrored.validateNonogramJsonImportFile({ name: "puzzle.json" }),
		).toEqual(validateNonogramJsonImportFile({ name: "puzzle.json" }));
	});

	it("behaves the same as the tested TS module when no file is selected", async () => {
		const mirrored = await loadMirroredValidateNonogramJsonImportFile();

		expect(mirrored.validateNonogramJsonImportFile(undefined)).toEqual(
			validateNonogramJsonImportFile(undefined),
		);
	});
});
