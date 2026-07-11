import { describe, expect, it } from "vitest";
import { computeNonogramClues } from "./nonogram-clues.js";
import { createNonogram } from "./nonogram-grid.js";
import { solveNonogramFromClues } from "./nonogram-line-solver.js";

describe("solveNonogramFromClues", () => {
	it("reconstructs a grid whose clues require cross-referencing rows and columns to resolve", () => {
		const cells = [
			[true, true, true],
			[false, true, false],
			[false, true, false],
		];
		const nonogram = createNonogram(3, 3, cells);
		const clues = computeNonogramClues(nonogram);

		const solved = solveNonogramFromClues(3, 3, clues);

		expect(solved.cells).toEqual(cells);
	});

	it("reconstructs a grid with a single filled cell, which only cross-line deduction can pinpoint", () => {
		const cells = [
			[false, false, false],
			[false, true, false],
			[false, false, false],
		];
		const nonogram = createNonogram(3, 3, cells);
		const clues = computeNonogramClues(nonogram);

		const solved = solveNonogramFromClues(3, 3, clues);

		expect(solved.cells).toEqual(cells);
	});

	it("returns an entirely empty grid when every row and column clue is [0]", () => {
		const rowClues = [[0], [0]];
		const columnClues = [[0], [0], [0]];

		const solved = solveNonogramFromClues(3, 2, { rowClues, columnClues });

		expect(solved.cells).toEqual([
			[false, false, false],
			[false, false, false],
		]);
	});

	it("returns an entirely filled grid when every row and column clue matches the full line length", () => {
		const rowClues = [[3], [3]];
		const columnClues = [[2], [2], [2]];

		const solved = solveNonogramFromClues(3, 2, { rowClues, columnClues });

		expect(solved.cells).toEqual([
			[true, true, true],
			[true, true, true],
		]);
	});

	it("throws a clear error when a row clue is impossible to satisfy for the declared width", () => {
		const rowClues = [[5]];
		const columnClues = [[1], [1], [1]];

		expect(() =>
			solveNonogramFromClues(3, 1, { rowClues, columnClues }),
		).toThrow(/impossible/i);
	});

	it("throws a clear error when the clues describe an ambiguous puzzle that pure logic can't fully resolve", () => {
		// Classic ambiguous 2x2 case: both diagonals satisfy [[1],[1]] rows and
		// [[1],[1]] columns, so no amount of line-only deduction picks one.
		const rowClues = [[1], [1]];
		const columnClues = [[1], [1]];

		expect(() =>
			solveNonogramFromClues(2, 2, { rowClues, columnClues }),
		).toThrow(/could not fully solve/i);
	});

	it("throws a clear error when the number of row clue lines does not match the declared height", () => {
		const rowClues = [[0]];
		const columnClues = [[0], [0]];

		expect(() =>
			solveNonogramFromClues(2, 2, { rowClues, columnClues }),
		).toThrow(/row clues/i);
	});

	it("throws a clear validation error when width or height is not a positive integer", () => {
		const rowClues = [[0]];
		const columnClues = [[0]];

		expect(() =>
			solveNonogramFromClues(0, 1, { rowClues, columnClues }),
		).toThrow(/positive integer/i);
	});
});
