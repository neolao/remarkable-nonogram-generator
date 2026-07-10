import { inflateSync } from "node:zlib";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { computeNonogramClues } from "./nonogram-clues.js";
import {
	createNonogram,
	MAX_GRID_HEIGHT,
	MAX_GRID_WIDTH,
	type Nonogram,
} from "./nonogram-grid.js";
import {
	REMARKABLE_2_PAGE_HEIGHT_PT,
	REMARKABLE_2_PAGE_WIDTH_PT,
	renderNonogramToPdf,
} from "./nonogram-pdf.js";

function decompressAllContentStreams(pdfBytes: Uint8Array): string[] {
	const text = Buffer.from(pdfBytes).toString("latin1");
	const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
	const streams: string[] = [];
	let match: RegExpExecArray | null;
	// biome-ignore lint/suspicious/noAssignInExpressions: standard regex.exec loop
	while ((match = streamRegex.exec(text)) !== null) {
		try {
			streams.push(
				inflateSync(Buffer.from(match[1], "latin1")).toString("latin1"),
			);
		} catch {
			// Not a deflate-compressed stream (e.g. an embedded font); skip it.
		}
	}
	return streams;
}

// Each drawRectangle() call is wrapped in its own "q ... Q" graphics-state
// block (pdf-lib's operations.js), so splitting on a standalone "Q" line
// isolates one shape's operators per block. A cell block always sets both a
// nonstroking fill color ("r g b rg") and ends with the fill+stroke operator
// ("B"), which distinguishes it from a text block (which uses "Tj" instead).
function countCellRectangles(pdfBytes: Uint8Array, fillRgb: string): number {
	const content = decompressAllContentStreams(pdfBytes).join("\n");
	const blocks = content.split(/^Q$/m);
	return blocks.filter(
		(block) => block.includes(`${fillRgb} rg`) && /^B$/m.test(block),
	).length;
}

function countTextDraws(pdfBytes: Uint8Array): number {
	const content = decompressAllContentStreams(pdfBytes).join("\n");
	return (content.match(/Tj$/gm) || []).length;
}

function buildGrid(width: number, height: number, fill: boolean): boolean[][] {
	return Array.from({ length: height }, () =>
		Array.from({ length: width }, () => fill),
	);
}

describe("renderNonogramToPdf", () => {
	it("produces a valid single-page PDF sized to the reMarkable 2 page dimensions", async () => {
		const nonogram = createNonogram(3, 3, [
			[true, false, true],
			[false, true, false],
			[true, true, false],
		]);

		const pdfBytes = await renderNonogramToPdf(nonogram);

		const header = Buffer.from(pdfBytes.slice(0, 5)).toString("ascii");
		expect(header).toBe("%PDF-");

		const doc = await PDFDocument.load(pdfBytes);
		expect(doc.getPageCount()).toBe(1);
		const page = doc.getPage(0);
		expect(page.getWidth()).toBeCloseTo(REMARKABLE_2_PAGE_WIDTH_PT, 1);
		expect(page.getHeight()).toBeCloseTo(REMARKABLE_2_PAGE_HEIGHT_PT, 1);
	});

	it("draws one rectangle per grid cell, black for filled cells and white for empty cells", async () => {
		const cells = [
			[true, false, true],
			[false, true, false],
		];
		const nonogram = createNonogram(3, 2, cells);
		const filledCount = cells.flat().filter(Boolean).length;
		const emptyCount = cells.flat().filter((cell) => !cell).length;

		const pdfBytes = await renderNonogramToPdf(nonogram);

		expect(countCellRectangles(pdfBytes, "0 0 0")).toBe(filledCount);
		expect(countCellRectangles(pdfBytes, "1 1 1")).toBe(emptyCount);
	});

	it("draws exactly one text label per computed row/column clue, matching the SVG preview's clue layout", async () => {
		const nonogram = createNonogram(3, 2, [
			[true, false, true],
			[false, true, true],
		]);
		const { rowClues, columnClues } = computeNonogramClues(nonogram);
		const expectedClueCount =
			rowClues.reduce((sum, clues) => sum + clues.length, 0) +
			columnClues.reduce((sum, clues) => sum + clues.length, 0);

		const pdfBytes = await renderNonogramToPdf(nonogram);

		expect(countTextDraws(pdfBytes)).toBe(expectedClueCount);
	});

	it("fits the largest allowed grid size on the page without clipping", async () => {
		const nonogram = createNonogram(
			MAX_GRID_WIDTH,
			MAX_GRID_HEIGHT,
			buildGrid(MAX_GRID_WIDTH, MAX_GRID_HEIGHT, false),
		);

		const pdfBytes = await renderNonogramToPdf(nonogram);

		const doc = await PDFDocument.load(pdfBytes);
		const page = doc.getPage(0);
		expect(page.getWidth()).toBeCloseTo(REMARKABLE_2_PAGE_WIDTH_PT, 1);
		expect(page.getHeight()).toBeCloseTo(REMARKABLE_2_PAGE_HEIGHT_PT, 1);
		// No cell silently dropped to make it fit: every cell of the largest
		// allowed grid is still drawn (as an empty/white cell here).
		expect(countCellRectangles(pdfBytes, "1 1 1")).toBe(
			MAX_GRID_WIDTH * MAX_GRID_HEIGHT,
		);
	});

	it("renders the same nonogram twice into identical PDF bytes", async () => {
		const nonogram = createNonogram(4, 4, buildGrid(4, 4, true));

		const first = await renderNonogramToPdf(nonogram);
		const second = await renderNonogramToPdf(nonogram);

		expect(Buffer.from(second)).toEqual(Buffer.from(first));
	});

	it("renders the minimal 1x1 grid without error, for both a filled and an empty cell", async () => {
		const filled = createNonogram(1, 1, [[true]]);
		const empty = createNonogram(1, 1, [[false]]);

		await expect(renderNonogramToPdf(filled)).resolves.toBeInstanceOf(
			Uint8Array,
		);
		await expect(renderNonogramToPdf(empty)).resolves.toBeInstanceOf(
			Uint8Array,
		);
	});

	it("rejects a nonogram with invalid dimensions instead of producing a corrupt PDF", async () => {
		const invalidNonogram: Nonogram = { width: 0, height: 0, cells: [] };

		await expect(renderNonogramToPdf(invalidNonogram)).rejects.toThrow();
	});

	it("rejects a nonogram whose cells do not match its declared dimensions", async () => {
		const invalidNonogram: Nonogram = {
			width: 3,
			height: 2,
			cells: [[true, false, true]],
		};

		await expect(renderNonogramToPdf(invalidNonogram)).rejects.toThrow();
	});
});
