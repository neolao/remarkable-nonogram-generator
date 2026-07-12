import { describe, expect, it } from "vitest";
import { isThickGridlineIndex } from "./nonogram-client-grid-lines.js";

describe("isThickGridlineIndex", () => {
	it("returns true for an interior multiple of 5", () => {
		expect(isThickGridlineIndex(5)).toBe(true);
		expect(isThickGridlineIndex(10)).toBe(true);
	});

	it("returns false for index 0, even though it is a multiple of 5", () => {
		expect(isThickGridlineIndex(0)).toBe(false);
	});

	it("returns false for an index that is not a multiple of 5", () => {
		expect(isThickGridlineIndex(3)).toBe(false);
		expect(isThickGridlineIndex(7)).toBe(false);
	});

	it("returns false for every index of a grid smaller than the interval", () => {
		const indices = [0, 1, 2, 3];
		expect(indices.map(isThickGridlineIndex)).toEqual([
			false,
			false,
			false,
			false,
		]);
	});
});
