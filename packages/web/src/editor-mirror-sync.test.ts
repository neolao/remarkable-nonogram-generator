import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
	computeNonogramClues,
	createNonogram,
} from "@remarkable-nonogram-generator/core";
import { describe, expect, it } from "vitest";
import { computeClientNonogramClues } from "./nonogram-client-clues.js";
import { buildNonogramSaveRequest } from "./nonogram-save-request.js";
import { buildNonogramSendRequest } from "./nonogram-send-request.js";
import {
	buildRemarkableFolderCookieAssignment,
	readRemarkableFolderCookie,
} from "./remarkable-folder-cookie.js";

const editorJsPath = fileURLToPath(
	new URL("../public/editor.js", import.meta.url),
);

// public/editor.js hand-mirrors these functions from the tested TS modules
// above (see CLAUDE.md/.vibe/index.md: the static frontend has no build step
// to import them). This test extracts the mirrored source by name and runs
// it against representative inputs to catch silent drift between the two
// copies, since nothing else guards that the mirror stays in sync.
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

function extractLine(fileContent: string, linePrefix: string): string {
	const line = fileContent
		.split("\n")
		.find((candidate) => candidate.trim().startsWith(linePrefix));
	if (!line) {
		throw new Error(
			`Could not find a line starting with "${linePrefix}" in editor.js`,
		);
	}
	return line.trim();
}

async function loadMirroredEditorFunctions() {
	const source = await readFile(editorJsPath, "utf8");
	const constants = [
		extractLine(source, "const REMARKABLE_FOLDER_COOKIE_NAME"),
		extractLine(source, "const REMARKABLE_FOLDER_COOKIE_MAX_AGE_SECONDS"),
	].join("\n");
	const functionNames = [
		"computeLineClues",
		"computeClientNonogramClues",
		"buildNonogramSendRequest",
		"buildNonogramSaveRequest",
		"buildRemarkableFolderCookieAssignment",
		"readRemarkableFolderCookie",
	];
	const extractedSource = functionNames
		.map((name) => extractFunctionSource(source, name))
		.join("\n");

	return new Function(
		`${constants}\n${extractedSource}\nreturn { ${functionNames.join(", ")} };`,
	)() as {
		computeClientNonogramClues: (cells: boolean[][]) => {
			rowClues: number[][];
			columnClues: number[][];
		};
		buildNonogramSendRequest: typeof buildNonogramSendRequest;
		buildNonogramSaveRequest: typeof buildNonogramSaveRequest;
		buildRemarkableFolderCookieAssignment: typeof buildRemarkableFolderCookieAssignment;
		readRemarkableFolderCookie: typeof readRemarkableFolderCookie;
	};
}

describe("editor.js mirrored logic", () => {
	it("computes the same clues as the tested TS module for several grids", async () => {
		const mirrored = await loadMirroredEditorFunctions();
		const grids = [
			[
				[true, false, true, true, false],
				[false, false, false, false, false],
				[true, true, true, true, true],
			],
			[
				[false, false, false],
				[false, false, false],
			],
			[[true]],
		];

		for (const cells of grids) {
			expect(mirrored.computeClientNonogramClues(cells)).toEqual(
				computeClientNonogramClues(cells),
			);
		}
	});

	it("matches the core clue computation too, transitively", async () => {
		const mirrored = await loadMirroredEditorFunctions();
		const cells = [
			[true, false, true, false, true],
			[true, true, false, false, true],
			[false, false, false, true, true],
			[true, false, false, false, false],
		];

		const mirroredClues = mirrored.computeClientNonogramClues(cells);
		const coreClues = computeNonogramClues(createNonogram(5, 4, cells));

		expect(mirroredClues.rowClues).toEqual(coreClues.rowClues);
		expect(mirroredClues.columnClues).toEqual(coreClues.columnClues);
	});

	it("builds the same send request as the tested TS module", async () => {
		const mirrored = await loadMirroredEditorFunctions();

		expect(mirrored.buildNonogramSendRequest(null, "", false)).toEqual(
			buildNonogramSendRequest(null, "", false),
		);
		expect(
			mirrored.buildNonogramSendRequest("puzzle-1", "Puzzles", true),
		).toEqual(buildNonogramSendRequest("puzzle-1", "Puzzles", true));
	});

	it("builds the same save request as the tested TS module", async () => {
		const mirrored = await loadMirroredEditorFunctions();
		const nonogram = { width: 1, height: 1, cells: [[true]] };

		expect(mirrored.buildNonogramSaveRequest(null, "", nonogram)).toEqual(
			buildNonogramSaveRequest(null, "", nonogram),
		);
		expect(
			mirrored.buildNonogramSaveRequest("puzzle-1", "My puzzle", nonogram),
		).toEqual(buildNonogramSaveRequest("puzzle-1", "My puzzle", nonogram));
	});

	it("builds and reads the same folder cookie as the tested TS module", async () => {
		const mirrored = await loadMirroredEditorFunctions();

		expect(mirrored.buildRemarkableFolderCookieAssignment("Puzzles")).toBe(
			buildRemarkableFolderCookieAssignment("Puzzles"),
		);
		expect(mirrored.buildRemarkableFolderCookieAssignment("")).toBe(
			buildRemarkableFolderCookieAssignment(""),
		);
		expect(
			mirrored.readRemarkableFolderCookie("remarkable-folder=Puzzles"),
		).toBe(readRemarkableFolderCookie("remarkable-folder=Puzzles"));
	});
});
