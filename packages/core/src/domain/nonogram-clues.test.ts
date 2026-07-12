import { describe, expect, it } from "vitest";
import { computeNonogramClues } from "./nonogram-clues.js";
import { createNonogram } from "./nonogram-grid.js";

describe("computeNonogramClues", () => {
	it("computes row and column clues for a grid with multiple separated runs", () => {
		const nonogram = createNonogram(5, 3, [
			[true, false, true, true, false],
			[false, false, false, false, false],
			[true, true, true, true, true],
		]);

		const clues = computeNonogramClues(nonogram);

		expect(clues.rowClues).toEqual([[1, 2], [0], [5]]);
		expect(clues.columnClues).toEqual([[1, 1], [1], [1, 1], [1, 1], [1]]);
	});

	it("represents an entirely empty row and column as a single 0 clue", () => {
		const nonogram = createNonogram(3, 2, [
			[false, false, false],
			[false, false, false],
		]);

		const clues = computeNonogramClues(nonogram);

		expect(clues.rowClues).toEqual([[0], [0]]);
		expect(clues.columnClues).toEqual([[0], [0], [0]]);
	});

	it("represents a fully filled row and column as a single clue equal to its length", () => {
		const nonogram = createNonogram(3, 2, [
			[true, true, true],
			[true, true, true],
		]);

		const clues = computeNonogramClues(nonogram);

		expect(clues.rowClues).toEqual([[3], [3]]);
		expect(clues.columnClues).toEqual([[2], [2], [2]]);
	});

	it("computes clues for a 1x1 grid with a single filled cell", () => {
		const nonogram = createNonogram(1, 1, [[true]]);

		const clues = computeNonogramClues(nonogram);

		expect(clues.rowClues).toEqual([[1]]);
		expect(clues.columnClues).toEqual([[1]]);
	});
});
