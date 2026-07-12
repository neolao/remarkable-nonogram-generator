import { describe, expect, it } from "vitest";
import { MAX_GRID_WIDTH } from "./nonogram-grid.js";
import {
	parseNonogramImport,
	serializeNonogramExport,
} from "./nonogram-json-transfer.js";

describe("serializeNonogramExport", () => {
	it("returns a plain object with the name and grid fields", () => {
		const nonogram = {
			width: 2,
			height: 2,
			cells: [
				[true, false],
				[false, true],
			],
		};

		const exported = serializeNonogramExport("My puzzle", nonogram);

		expect(exported).toEqual({
			name: "My puzzle",
			width: 2,
			height: 2,
			cells: [
				[true, false],
				[false, true],
			],
		});
	});
});

describe("parseNonogramImport", () => {
	it("returns the name and a validated Nonogram for a well-formed export", () => {
		const data = {
			name: "Imported puzzle",
			width: 3,
			height: 1,
			cells: [[true, true, false]],
		};

		const result = parseNonogramImport(data);

		expect(result).toEqual({
			name: "Imported puzzle",
			nonogram: { width: 3, height: 1, cells: [[true, true, false]] },
		});
	});

	it("defaults the name to an empty string when it is missing", () => {
		const data = { width: 1, height: 1, cells: [[false]] };

		const result = parseNonogramImport(data);

		expect(result.name).toBe("");
	});

	it("throws a clear error when the input is not an object", () => {
		expect(() => parseNonogramImport("not an object")).toThrow(
			/must be a json object/i,
		);
	});

	it("throws a clear error when the input is null", () => {
		expect(() => parseNonogramImport(null)).toThrow(/must be a json object/i);
	});

	it("throws a clear error when cells is missing", () => {
		expect(() => parseNonogramImport({ width: 2, height: 2 })).toThrow(
			/cells/i,
		);
	});

	it("throws a clear error when cells is not an array", () => {
		expect(() =>
			parseNonogramImport({ width: 2, height: 2, cells: "nope" }),
		).toThrow(/cells/i);
	});

	it("throws a clear error when width/height are missing", () => {
		expect(() => parseNonogramImport({ cells: [[true]] })).toThrow(
			/positive integer/i,
		);
	});

	it("throws a clear error when cells do not match the declared dimensions", () => {
		expect(() =>
			parseNonogramImport({ width: 3, height: 1, cells: [[true, false]] }),
		).toThrow(/match declared dimensions/i);
	});

	it("throws a clear error when the grid is too large for a reMarkable 2 page", () => {
		const cells = Array.from({ length: 1 }, () =>
			Array.from({ length: MAX_GRID_WIDTH + 1 }, () => false),
		);

		expect(() =>
			parseNonogramImport({ width: MAX_GRID_WIDTH + 1, height: 1, cells }),
		).toThrow(/too large/i);
	});
});
