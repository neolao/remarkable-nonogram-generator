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

	it("solves a real-world puzzle whose pathological clue would previously generate over 100 million valid placements for a single line", () => {
		// nonograms.org puzzle #80350: a 45x45 grid where column 24's clue
		// ([2,1,1,1,2,2,1,1,1,1,1]) alone has 129,024,480 valid placements on
		// its own — enumerating every placement (the pre-fix approach) exhausts
		// the Node.js heap and crashes the server before hypothesis-testing is
		// even reached. There's no independently-sourced expected solution to
		// compare against here (unlike puzzle #80351 above), so correctness is
		// verified by self-consistency instead: the solved grid's own computed
		// clues must exactly match the clues it was solved from.
		const rowClues = [
			[12, 7, 7, 6, 7],
			[3, 3, 3, 2, 2, 2, 2, 5, 3, 3],
			[3, 6, 2, 3, 2, 3, 1, 6],
			[2, 1, 4, 2, 1, 1, 4, 7],
			[3, 5, 1, 2, 3, 7],
			[3, 4, 2, 7, 1, 7, 3],
			[8, 1, 2, 3, 1, 7, 3],
			[8, 1, 2, 3, 2, 3, 1, 2],
			[8, 1, 1, 2, 7, 3],
			[1, 6, 1, 1, 1, 1, 2, 6, 3],
			[8, 2, 1, 2, 2, 2, 8],
			[5, 3, 1, 2, 2, 1, 2, 8],
			[5, 3, 2, 5, 2, 1, 8],
			[4, 1, 3, 1, 2, 1, 2, 2, 7],
			[5, 4, 2, 5, 1, 2, 2, 1, 5, 1],
			[5, 5, 3, 2, 1, 3, 2, 4, 1],
			[1, 8, 2, 2, 3, 4, 1, 3, 1],
			[1, 7, 2, 1, 2, 3, 2, 1, 4, 1],
			[1, 2, 3, 1, 2, 3, 2, 2, 1, 4, 1],
			[1, 6, 2, 3, 2, 2, 1, 1, 6],
			[1, 6, 1, 1, 2, 1, 1, 1],
			[8, 1, 3, 2, 1, 2],
			[3, 3, 5, 1, 1],
			[1, 2, 3, 12, 1, 2],
			[1, 4, 2, 7, 1, 1],
			[1, 2, 4, 2, 2],
			[1, 1, 4, 2],
			[1, 1, 5],
			[1, 1, 5],
			[2, 1, 1, 2, 1],
			[1, 2, 1, 5, 3],
			[3, 2, 1, 1, 5, 6],
			[2, 1, 9, 1, 3, 4],
			[2, 3, 3, 1, 8, 3],
			[2, 2, 2, 3, 1, 1, 4, 7, 3],
			[6, 4, 9, 2, 5, 2],
			[6, 2, 4, 3, 2],
			[4, 3, 2, 6, 6, 5],
			[5, 5, 1, 22],
			[5, 5, 2, 2, 3, 3, 8],
			[6, 2, 4, 2, 4, 7],
			[7, 1, 3, 2, 2, 3, 6],
			[9, 5, 2, 2, 6],
			[9, 8, 3, 6],
			[10, 13, 5, 6],
		];
		const columnClues = [
			[18, 3, 1],
			[9, 6, 1, 1, 2, 1],
			[3, 14, 3, 2, 1, 2],
			[1, 1, 16, 3, 1, 3],
			[3, 9, 8, 2, 2, 3],
			[11, 1, 2, 3, 3, 2, 4],
			[13, 8, 4, 2, 4],
			[1, 20, 2, 1, 2, 5],
			[5, 8, 8, 2, 2, 2, 5],
			[3, 6, 4, 4, 3, 2, 2, 6],
			[2, 3, 3, 1, 3, 2, 3, 2, 7],
			[1, 2, 3, 2, 2, 3, 6],
			[2, 3, 1, 2, 4, 1],
			[2, 1, 1, 2, 2, 1],
			[1, 2, 2, 3, 2],
			[1, 1, 1, 2, 2, 2],
			[1, 1, 1, 1, 2, 6, 2, 2, 3],
			[1, 1, 2, 4, 2, 3, 3, 4],
			[1, 2, 2, 4, 3, 1, 5],
			[2, 4, 2, 1, 3, 8],
			[2, 5, 2, 2, 1, 4, 3, 3],
			[2, 2, 4, 1, 2, 1, 1, 2, 1, 2, 2],
			[2, 2, 2, 2, 1, 1, 2, 1, 1, 2, 1],
			[2, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1],
			[1, 1, 2, 4, 2, 1, 2, 2, 1],
			[1, 1, 5, 2, 4, 2, 1, 2],
			[1, 1, 2, 1, 4, 2, 2, 3],
			[1, 1, 2, 1, 5, 1, 1, 2, 2],
			[1, 2, 1, 2, 6, 1, 1, 3, 2],
			[2, 1, 2, 1, 6, 2, 2, 3, 3, 3],
			[2, 2, 2, 2, 3, 2, 1, 4, 2],
			[1, 3, 2, 2, 8, 2, 1, 3, 3, 1, 2],
			[2, 6, 2, 2, 1, 2, 3, 1, 1],
			[4, 2, 5, 2, 2, 1, 2, 1],
			[9, 2, 2, 2, 4, 3, 1],
			[10, 3, 3, 1, 4, 4, 1],
			[2, 4, 3, 3, 3, 3, 2, 5],
			[1, 8, 7, 2, 3, 5],
			[2, 12, 2, 3, 7],
			[20, 2, 2, 7],
			[7, 12, 2, 2, 7],
			[1, 3, 1, 10, 2, 1, 6],
			[7, 8, 3, 3, 5],
			[14, 1, 1, 3, 3],
			[10, 5, 3, 2, 1],
		];

		const solved = solveNonogramFromClues(45, 45, { rowClues, columnClues });

		const recomputedClues = computeNonogramClues(solved);
		expect(recomputedClues.rowClues).toEqual(rowClues);
		expect(recomputedClues.columnClues).toEqual(columnClues);
	}, 10000);

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

	it("reconstructs a grid matching its own clues for hundreds of randomly-generated puzzles", () => {
		// Property-based regression guard for the per-line deduction algorithm:
		// generates many small random grids, derives their clues the same way a
		// real puzzle's clues are derived, and checks that solving those clues
		// back reproduces the exact same clues — true for ANY valid solution,
		// regardless of which line-solving algorithm produced it, so this test
		// stays meaningful even if the algorithm changes again later. A puzzle
		// whose clues turn out to be genuinely ambiguous or need guessing is a
		// legitimate outcome (already covered by the two dedicated tests above),
		// not a failure of this property, so those throws are tolerated here.
		//
		// A previous version of this algorithm (full placement enumeration with
		// a shared mutable array across recursive branches) passed every
		// hand-picked test in this file while still silently under-solving
		// roughly 1 in 1,400 randomly-generated lines — this is the kind of
		// bug a fixed set of examples doesn't reliably catch.
		const random = mulberry32(20260713);
		let solvedCount = 0;

		for (let trial = 0; trial < 300; trial++) {
			const width = 2 + Math.floor(random() * 5);
			const height = 2 + Math.floor(random() * 5);
			const density = 0.3 + random() * 0.4;
			const cells = Array.from({ length: height }, () =>
				Array.from({ length: width }, () => random() < density),
			);

			const nonogram = createNonogram(width, height, cells);
			const clues = computeNonogramClues(nonogram);

			let solved: ReturnType<typeof solveNonogramFromClues>;
			try {
				solved = solveNonogramFromClues(width, height, clues);
			} catch (error) {
				expect((error as Error).message).toMatch(/could not fully solve/i);
				continue;
			}

			expect(computeNonogramClues(solved)).toEqual(clues);
			solvedCount++;
		}

		// Sanity-check the generator itself: with this density range, most
		// trials should be uniquely solvable, not thrown away as ambiguous.
		expect(solvedCount).toBeGreaterThan(200);
	});
});

// Deterministic PRNG (mulberry32) so this test's failures are reproducible
// instead of depending on Math.random()'s run-to-run state.
function mulberry32(seed: number): () => number {
	let state = seed;
	return () => {
		state |= 0;
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
