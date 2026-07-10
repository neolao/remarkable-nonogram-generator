import {
	computeNonogramClues,
	createNonogram,
} from "@remarkable-nonogram-generator/core";
import { describe, expect, it } from "vitest";
import { computeClientNonogramClues } from "./nonogram-client-clues.js";

describe("computeClientNonogramClues", () => {
	it("computes row and column clues for a grid with multiple separated runs", () => {
		const cells = [
			[true, false, true, true, false],
			[false, false, false, false, false],
			[true, true, true, true, true],
		];

		const clues = computeClientNonogramClues(cells);

		expect(clues.rowClues).toEqual([[1, 2], [0], [5]]);
		expect(clues.columnClues).toEqual([[1, 1], [1], [1, 1], [1, 1], [1]]);
	});

	it("represents an entirely empty grid as a single 0 clue per row and column", () => {
		const cells = [
			[false, false, false],
			[false, false, false],
		];

		const clues = computeClientNonogramClues(cells);

		expect(clues.rowClues).toEqual([[0], [0]]);
		expect(clues.columnClues).toEqual([[0], [0], [0]]);
	});

	it("represents a fully filled row and column as a single clue equal to its length", () => {
		const cells = [
			[true, true, true],
			[true, true, true],
		];

		const clues = computeClientNonogramClues(cells);

		expect(clues.rowClues).toEqual([[3], [3]]);
		expect(clues.columnClues).toEqual([[2], [2], [2]]);
	});

	it("computes clues for a 1x1 grid with a single filled cell", () => {
		const clues = computeClientNonogramClues([[true]]);

		expect(clues.rowClues).toEqual([[1]]);
		expect(clues.columnClues).toEqual([[1]]);
	});

	it("matches the server-side clue computation for the same grid", () => {
		const cells = [
			[true, false, true, false, true],
			[true, true, false, false, true],
			[false, false, false, true, true],
			[true, false, false, false, false],
		];

		const clientClues = computeClientNonogramClues(cells);
		const serverClues = computeNonogramClues(createNonogram(5, 4, cells));

		expect(clientClues.rowClues).toEqual(serverClues.rowClues);
		expect(clientClues.columnClues).toEqual(serverClues.columnClues);
	});
});
