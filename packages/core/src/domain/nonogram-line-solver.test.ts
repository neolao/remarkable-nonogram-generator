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

	it("solves a real-world puzzle whose clues require testing a hypothesis and rejecting it on contradiction, not just per-line deduction", () => {
		// nonograms.org puzzle #80351: pure per-line propagation stalls partway
		// through with a unique solution still reachable only by guessing a
		// cell's state and discarding the guess if it leads to a line with no
		// valid placement (contradiction), then resuming propagation.
		const rowClues = [
			[3],
			[4, 2, 1],
			[3, 1, 1, 1],
			[3, 1, 2, 1],
			[2, 1, 2],
			[4, 2, 2],
			[2, 2, 2],
			[1, 3, 1],
			[2, 2, 1],
			[4, 3],
			[1, 1, 2, 2],
			[1, 1, 1],
			[1, 1, 1],
			[5, 2],
			[3, 2, 3],
		];
		const columnClues = [
			[2],
			[3],
			[1, 1],
			[1, 1, 2, 1],
			[2, 2, 1, 1],
			[2, 6, 2],
			[1, 2, 2],
			[1, 3, 2],
			[3, 2, 5],
			[2, 1, 1],
			[1, 1],
			[4, 2, 1],
			[2, 2, 2, 2],
			[1, 1, 2, 5],
			[2, 5],
		];
		const expectedRows = [
			"............###",
			".....####..##.#",
			"...###..#..#.#.",
			"###.#..##..#...",
			"##.....#...##..",
			".####..##...##.",
			"....##..##...##",
			".....#...###..#",
			".....##....##.#",
			"...####.....###",
			"...#.#..##...##",
			".....#..#....#.",
			"......#.#....#.",
			".....#####..##.",
			"...###.##.###..",
		];
		const expectedCells = expectedRows.map((row) =>
			row.split("").map((char) => char === "#"),
		);

		const solved = solveNonogramFromClues(15, 15, { rowClues, columnClues });

		expect(solved.cells).toEqual(expectedCells);
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

	it("gives up quickly instead of exhausting memory on a badly under-constrained puzzle", () => {
		// Every line only has clue [1] on a length-16 line: an enormous number
		// of individually-valid placements per line, with no way to narrow them
		// by propagation alone — the kind of input a mis-parsed source could
		// produce. Hypothesis-testing must be bounded, or exploring this
		// combinatorially would exhaust memory rather than reporting failure.
		const size = 16;
		const rowClues = Array.from({ length: size }, () => [1]);
		const columnClues = Array.from({ length: size }, () => [1]);

		expect(() =>
			solveNonogramFromClues(size, size, { rowClues, columnClues }),
		).toThrow(/could not fully solve/i);
	}, 5000);

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
