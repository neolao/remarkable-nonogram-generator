import { describe, expect, it } from "vitest";
import type {
	PageRenderer,
	RawNonogramPageData,
} from "../infrastructure/nonogram-page-clues.js";
import { importNonogramFromUrl } from "./nonogram-url-import.js";

function fakeRenderer(data: RawNonogramPageData): PageRenderer {
	return {
		async renderNonogramPage() {
			return data;
		},
	};
}

describe("importNonogramFromUrl", () => {
	it("reconstructs the nonogram whose cross-referenced row/column clues match those read from the page", async () => {
		// A T-tetromino: cells [[T,T,T],[F,T,F],[F,T,F]] -> row clues
		// [[3],[1],[1]], column clues [[1],[3],[1]].
		const data: RawNonogramPageData = {
			width: 3,
			height: 3,
			rowClueCells: [
				{ index: 0, slot: 0, text: "3" },
				{ index: 1, slot: 0, text: "1" },
				{ index: 2, slot: 0, text: "1" },
			],
			columnClueCells: [
				{ index: 0, slot: 0, text: "1" },
				{ index: 1, slot: 0, text: "3" },
				{ index: 2, slot: 0, text: "1" },
			],
		};

		const nonogram = await importNonogramFromUrl(
			"https://www.nonograms.org/nonograms/i/81801",
			{ pageRenderer: fakeRenderer(data) },
		);

		expect(nonogram.width).toBe(3);
		expect(nonogram.height).toBe(3);
		expect(nonogram.cells).toEqual([
			[true, true, true],
			[false, true, false],
			[false, true, false],
		]);
	});

	it("reconstructs a minimal 1x1 grid with a single filled cell", async () => {
		const data: RawNonogramPageData = {
			width: 1,
			height: 1,
			rowClueCells: [{ index: 0, slot: 0, text: "1" }],
			columnClueCells: [{ index: 0, slot: 0, text: "1" }],
		};

		const nonogram = await importNonogramFromUrl(
			"https://www.nonograms.org/nonograms/i/1",
			{ pageRenderer: fakeRenderer(data) },
		);

		expect(nonogram.cells).toEqual([[true]]);
	});

	it("throws when the URL is not a nonograms.org puzzle URL", async () => {
		const data: RawNonogramPageData = {
			width: 1,
			height: 1,
			rowClueCells: [],
			columnClueCells: [],
		};

		await expect(
			importNonogramFromUrl("https://example.com/not-a-puzzle", {
				pageRenderer: fakeRenderer(data),
			}),
		).rejects.toThrow(/not a nonograms\.org puzzle url/i);
	});

	it("propagates a clear error when the read clues can't be fully solved by logic alone", async () => {
		// Classic ambiguous 2x2 case (both diagonals satisfy the clues).
		const data: RawNonogramPageData = {
			width: 2,
			height: 2,
			rowClueCells: [
				{ index: 0, slot: 0, text: "1" },
				{ index: 1, slot: 0, text: "1" },
			],
			columnClueCells: [
				{ index: 0, slot: 0, text: "1" },
				{ index: 1, slot: 0, text: "1" },
			],
		};

		await expect(
			importNonogramFromUrl("https://www.nonograms.org/nonograms/i/1", {
				pageRenderer: fakeRenderer(data),
			}),
		).rejects.toThrow(/could not fully solve/i);
	});

	it("propagates a clear error when the page can't be rendered", async () => {
		const renderer: PageRenderer = {
			async renderNonogramPage() {
				throw new Error("Puzzle page not found or unreachable");
			},
		};

		await expect(
			importNonogramFromUrl("https://www.nonograms.org/nonograms/i/999999999", {
				pageRenderer: renderer,
			}),
		).rejects.toThrow(/not found or unreachable/i);
	});
});
