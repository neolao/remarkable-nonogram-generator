import { describe, expect, it } from "vitest";
import {
	createNonogram,
	MAX_GRID_HEIGHT,
	MAX_GRID_WIDTH,
} from "./nonogram-grid.js";

describe("createNonogram", () => {
	it("returns a Nonogram object for valid dimensions and matching cells", () => {
		const cells = [
			[true, false, true],
			[false, true, false],
		];

		const nonogram = createNonogram(3, 2, cells);

		expect(nonogram).toEqual({ width: 3, height: 2, cells });
	});

	it("throws a clear validation error when width is zero", () => {
		expect(() => createNonogram(0, 5, [])).toThrow(/positive integer/i);
	});

	it("throws a clear validation error when height is negative", () => {
		expect(() => createNonogram(5, -1, [])).toThrow(/positive integer/i);
	});

	it("throws a clear validation error when width is not an integer", () => {
		expect(() => createNonogram(2.5, 5, [])).toThrow(/positive integer/i);
	});

	it("throws a clear validation error when the grid is too large for a reMarkable 2 page", () => {
		expect(() =>
			createNonogram(MAX_GRID_WIDTH + 1, MAX_GRID_HEIGHT, []),
		).toThrow(/too large/i);
	});

	it("accepts a grid exactly at the maximum reMarkable 2 page size", () => {
		const cells = Array.from({ length: MAX_GRID_HEIGHT }, () =>
			Array.from({ length: MAX_GRID_WIDTH }, () => false),
		);

		const nonogram = createNonogram(MAX_GRID_WIDTH, MAX_GRID_HEIGHT, cells);

		expect(nonogram.width).toBe(MAX_GRID_WIDTH);
		expect(nonogram.height).toBe(MAX_GRID_HEIGHT);
	});

	it("throws a clear validation error when cells do not match the declared dimensions", () => {
		const cells = [
			[true, false, true],
			[false, true, false],
		];

		expect(() => createNonogram(3, 3, cells)).toThrow(
			/match declared dimensions/i,
		);
	});

	it("derives a maximum grid size consistent with the reMarkable 2 page constants", () => {
		expect(MAX_GRID_WIDTH).toBe(62);
		expect(MAX_GRID_HEIGHT).toBe(86);
	});
});
