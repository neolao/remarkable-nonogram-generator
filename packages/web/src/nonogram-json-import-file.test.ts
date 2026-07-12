import { describe, expect, it } from "vitest";
import { validateNonogramJsonImportFile } from "./nonogram-json-import-file.js";

describe("validateNonogramJsonImportFile", () => {
	it("accepts a selected file", () => {
		const result = validateNonogramJsonImportFile({ name: "puzzle.json" });

		expect(result).toEqual({ ok: true });
	});

	it("rejects a missing file selection with a clear error", () => {
		const result = validateNonogramJsonImportFile(null);

		expect(result).toEqual({
			ok: false,
			error: "Please choose a JSON file to import",
		});
	});

	it("rejects an undefined file selection with a clear error", () => {
		const result = validateNonogramJsonImportFile(undefined);

		expect(result).toEqual({
			ok: false,
			error: "Please choose a JSON file to import",
		});
	});
});
