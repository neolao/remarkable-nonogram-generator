import { describe, expect, it } from "vitest";
import {
	extractCluesFromPage,
	type PageRenderer,
	type RawNonogramPageData,
} from "./nonogram-page-clues.js";

function fakeRenderer(data: RawNonogramPageData): PageRenderer {
	return {
		async renderNonogramPage() {
			return data;
		},
	};
}

describe("extractCluesFromPage", () => {
	it("reads width, height, and clues from the rendered page's clue cells, ordered by slot", () => {
		const data: RawNonogramPageData = {
			width: 3,
			height: 2,
			// Row 0 has two numbers (2, 1); row 1 has none.
			rowClueCells: [
				{ index: 0, slot: 0, text: "2" },
				{ index: 0, slot: 1, text: "1" },
			],
			// Column 0 has one number (1); column 1 has none; column 2 has two (3, 2).
			columnClueCells: [
				{ index: 0, slot: 0, text: "1" },
				{ index: 2, slot: 0, text: "3" },
				{ index: 2, slot: 1, text: "2" },
			],
		};

		const result = extractCluesFromPage(
			"https://www.nonograms.org/nonograms/i/81801",
			fakeRenderer(data),
		);

		return result.then((r) => {
			expect(r.width).toBe(3);
			expect(r.height).toBe(2);
			expect(r.clues.rowClues).toEqual([[2, 1], [0]]);
			expect(r.clues.columnClues).toEqual([[1], [0], [3, 2]]);
		});
	});

	it("orders clue numbers by slot index even when the raw cells arrive out of order", async () => {
		const data: RawNonogramPageData = {
			width: 1,
			height: 1,
			rowClueCells: [
				{ index: 0, slot: 2, text: "4" },
				{ index: 0, slot: 0, text: "2" },
				{ index: 0, slot: 1, text: "1" },
			],
			columnClueCells: [{ index: 0, slot: 0, text: "7" }],
		};

		const result = await extractCluesFromPage(
			"https://www.nonograms.org/nonograms/i/1",
			fakeRenderer(data),
		);

		expect(result.clues.rowClues).toEqual([[2, 1, 4]]);
	});

	it("treats an individual line with no clue cells as the empty-line clue [0]", async () => {
		const data: RawNonogramPageData = {
			width: 2,
			height: 2,
			// Row 0 has a clue; row 1 has none (a real empty row).
			rowClueCells: [{ index: 0, slot: 0, text: "2" }],
			// Column 0 has a clue; column 1 has none.
			columnClueCells: [{ index: 0, slot: 0, text: "1" }],
		};

		const result = await extractCluesFromPage(
			"https://www.nonograms.org/nonograms/i/1",
			fakeRenderer(data),
		);

		expect(result.clues.rowClues).toEqual([[2], [0]]);
		expect(result.clues.columnClues).toEqual([[1], [0]]);
	});

	it("throws a clear error when no clue cells were found anywhere on the page", async () => {
		// A real nonograms.org page always renders a clue cell (even just "0")
		// for every line, so finding none at all for the whole grid means the
		// site's DOM structure changed rather than that the puzzle is empty.
		const data: RawNonogramPageData = {
			width: 2,
			height: 2,
			rowClueCells: [],
			columnClueCells: [],
		};

		await expect(
			extractCluesFromPage(
				"https://www.nonograms.org/nonograms/i/1",
				fakeRenderer(data),
			),
		).rejects.toThrow(/could not read any clue values/i);
	});

	it("throws a clear error when the URL is not a nonograms.org puzzle URL", async () => {
		const data: RawNonogramPageData = {
			width: 1,
			height: 1,
			rowClueCells: [],
			columnClueCells: [],
		};

		await expect(
			extractCluesFromPage(
				"https://example.com/not-a-puzzle",
				fakeRenderer(data),
			),
		).rejects.toThrow(/not a nonograms\.org puzzle url/i);
	});

	it("propagates a clear error when the page can't be rendered", async () => {
		const renderer: PageRenderer = {
			async renderNonogramPage() {
				throw new Error("Puzzle page not found or unreachable");
			},
		};

		await expect(
			extractCluesFromPage(
				"https://www.nonograms.org/nonograms/i/999999999",
				renderer,
			),
		).rejects.toThrow(/not found or unreachable/i);
	});
});
