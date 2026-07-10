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

interface PdfLineOp {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	lineWidth: number;
}

interface PdfRectOp {
	x: number;
	y: number;
	width: number;
	height: number;
	borderWidth: number;
}

// A drawLine() block has no "cm" transform (unlike a rectangle block), sets a
// line width via "<n> w", then a single "m ... l" segment ending in a lone
// stroke operator "S" (a rectangle ends in "B", fill+stroke).
function extractLineOps(pdfBytes: Uint8Array): PdfLineOp[] {
	const blocks = decompressAllContentStreams(pdfBytes).join("\n").split(/^Q$/m);

	return blocks.flatMap((block) => {
		if (!/^S$/m.test(block) || / cm$/m.test(block)) {
			return [];
		}
		const widthMatch = block.match(/^(-?[\d.]+) w$/m);
		const moveMatches = Array.from(
			block.matchAll(/^(-?[\d.]+) (-?[\d.]+) m$/gm),
		);
		const lineMatches = Array.from(
			block.matchAll(/^(-?[\d.]+) (-?[\d.]+) l$/gm),
		);
		if (!widthMatch || moveMatches.length === 0 || lineMatches.length === 0) {
			return [];
		}
		const start = moveMatches[0];
		const end = lineMatches[lineMatches.length - 1];
		return [
			{
				x1: Number(start[1]),
				y1: Number(start[2]),
				x2: Number(end[1]),
				y2: Number(end[2]),
				lineWidth: Number(widthMatch[1]),
			},
		];
	});
}

// A drawRectangle() block places its origin via a "1 0 0 1 tx ty cm"
// translation, then paths a rectangle from (0,0) to (rectWidth, rectHeight)
// relative to that origin, and ends in "B" (fill+stroke).
function extractRectOps(pdfBytes: Uint8Array): PdfRectOp[] {
	const blocks = decompressAllContentStreams(pdfBytes).join("\n").split(/^Q$/m);

	return blocks.flatMap((block) => {
		if (!/^B$/m.test(block)) {
			return [];
		}
		const cmMatch = block.match(/^1 0 0 1 (-?[\d.]+) (-?[\d.]+) cm$/m);
		const widthMatch = block.match(/^(-?[\d.]+) w$/m);
		const lineMatches = Array.from(
			block.matchAll(/^(-?[\d.]+) (-?[\d.]+) l$/gm),
		);
		if (!cmMatch || !widthMatch || lineMatches.length < 2) {
			return [];
		}
		return [
			{
				x: Number(cmMatch[1]),
				y: Number(cmMatch[2]),
				width: Number(lineMatches[1][1]),
				height: Number(lineMatches[0][2]),
				borderWidth: Number(widthMatch[1]),
			},
		];
	});
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

	it("draws every cell empty/white regardless of the source drawing, so the exported puzzle stays blank to solve", async () => {
		const cells = [
			[true, false, true],
			[false, true, false],
		];
		const nonogram = createNonogram(3, 2, cells);
		const totalCells = cells.flat().length;

		const pdfBytes = await renderNonogramToPdf(nonogram);

		expect(countCellRectangles(pdfBytes, "1 1 1")).toBe(totalCells);
		expect(countCellRectangles(pdfBytes, "0 0 0")).toBe(0);
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

	it("draws a thicker gridline only at the interior 5th row and 5th column, leaving other lines regular", async () => {
		const width = 10;
		const height = 8;
		const nonogram = createNonogram(
			width,
			height,
			buildGrid(width, height, false),
		);

		const pdfBytes = await renderNonogramToPdf(nonogram);

		const rects = extractRectOps(pdfBytes);
		const regularBorderWidth = rects[0].borderWidth;
		const lines = extractLineOps(pdfBytes);

		expect(lines).toHaveLength(2);
		for (const line of lines) {
			expect(line.lineWidth).toBeGreaterThan(regularBorderWidth);
		}

		const gridMinX = Math.min(...rects.map((rect) => rect.x));
		const gridMaxX = Math.max(...rects.map((rect) => rect.x + rect.width));
		const gridMinY = Math.min(...rects.map((rect) => rect.y));
		const gridMaxY = Math.max(...rects.map((rect) => rect.y + rect.height));

		const verticalLines = lines.filter((line) => line.x1 === line.x2);
		const horizontalLines = lines.filter((line) => line.y1 === line.y2);

		expect(verticalLines).toHaveLength(1);
		expect(verticalLines[0].x1).toBeGreaterThan(gridMinX);
		expect(verticalLines[0].x1).toBeLessThan(gridMaxX);

		expect(horizontalLines).toHaveLength(1);
		expect(horizontalLines[0].y1).toBeGreaterThan(gridMinY);
		expect(horizontalLines[0].y1).toBeLessThan(gridMaxY);
	});

	it("draws no thick gridline when a grid dimension is smaller than 5", async () => {
		const width = 4;
		const height = 3;
		const nonogram = createNonogram(
			width,
			height,
			buildGrid(width, height, false),
		);

		const pdfBytes = await renderNonogramToPdf(nonogram);

		expect(extractLineOps(pdfBytes)).toHaveLength(0);
	});

	it("never thickens the outer border, even when the total width/height is an exact multiple of 5", async () => {
		const width = 10;
		const height = 10;
		const nonogram = createNonogram(
			width,
			height,
			buildGrid(width, height, false),
		);

		const pdfBytes = await renderNonogramToPdf(nonogram);

		const rects = extractRectOps(pdfBytes);
		const gridMinX = Math.min(...rects.map((rect) => rect.x));
		const gridMaxX = Math.max(...rects.map((rect) => rect.x + rect.width));
		const gridMinY = Math.min(...rects.map((rect) => rect.y));
		const gridMaxY = Math.max(...rects.map((rect) => rect.y + rect.height));

		const lines = extractLineOps(pdfBytes);
		const verticalLines = lines.filter((line) => line.x1 === line.x2);
		const horizontalLines = lines.filter((line) => line.y1 === line.y2);

		expect(verticalLines).toHaveLength(1);
		expect(verticalLines[0].x1).not.toBeCloseTo(gridMinX, 1);
		expect(verticalLines[0].x1).not.toBeCloseTo(gridMaxX, 1);

		expect(horizontalLines).toHaveLength(1);
		expect(horizontalLines[0].y1).not.toBeCloseTo(gridMinY, 1);
		expect(horizontalLines[0].y1).not.toBeCloseTo(gridMaxY, 1);
	});

	it("draws no thick gridline when a dimension is exactly 5, since index 5 sits on the outer edge, not an interior line", async () => {
		const width = 5;
		const height = 5;
		const nonogram = createNonogram(
			width,
			height,
			buildGrid(width, height, false),
		);

		const pdfBytes = await renderNonogramToPdf(nonogram);

		expect(extractLineOps(pdfBytes)).toHaveLength(0);
	});

	it("stays a single page when includeSolution is explicitly false", async () => {
		const nonogram = createNonogram(3, 3, buildGrid(3, 3, true));

		const pdfBytes = await renderNonogramToPdf(nonogram, {
			includeSolution: false,
		});

		const doc = await PDFDocument.load(pdfBytes);
		expect(doc.getPageCount()).toBe(1);
	});

	it("adds a same-sized second page showing the solution when includeSolution is true", async () => {
		const nonogram = createNonogram(3, 3, [
			[true, false, true],
			[false, true, false],
			[true, true, false],
		]);

		const pdfBytes = await renderNonogramToPdf(nonogram, {
			includeSolution: true,
		});

		const doc = await PDFDocument.load(pdfBytes);
		expect(doc.getPageCount()).toBe(2);
		for (const page of doc.getPages()) {
			expect(page.getWidth()).toBeCloseTo(REMARKABLE_2_PAGE_WIDTH_PT, 1);
			expect(page.getHeight()).toBeCloseTo(REMARKABLE_2_PAGE_HEIGHT_PT, 1);
		}
	});

	it("draws the solution page's cells filled/empty to match the source drawing, while the puzzle page stays entirely blank", async () => {
		const cells = [
			[true, false, true],
			[false, true, false],
			[true, true, false],
		];
		const nonogram = createNonogram(3, 3, cells);
		const totalCells = cells.flat().length;
		const filledCells = cells.flat().filter(Boolean).length;
		const emptyCells = totalCells - filledCells;

		const pdfBytes = await renderNonogramToPdf(nonogram, {
			includeSolution: true,
		});

		// Puzzle page (all white) + solution page's empty cells are white;
		// only the solution page's filled cells are black.
		expect(countCellRectangles(pdfBytes, "1 1 1")).toBe(
			totalCells + emptyCells,
		);
		expect(countCellRectangles(pdfBytes, "0 0 0")).toBe(filledCells);
	});

	it("renders an all-white solution page for a fully empty grid", async () => {
		const nonogram = createNonogram(2, 2, buildGrid(2, 2, false));
		const totalCells = 4;

		const pdfBytes = await renderNonogramToPdf(nonogram, {
			includeSolution: true,
		});

		expect(countCellRectangles(pdfBytes, "1 1 1")).toBe(totalCells * 2);
		expect(countCellRectangles(pdfBytes, "0 0 0")).toBe(0);
	});

	it("renders an all-black solution page for a fully filled grid", async () => {
		const nonogram = createNonogram(2, 2, buildGrid(2, 2, true));
		const totalCells = 4;

		const pdfBytes = await renderNonogramToPdf(nonogram, {
			includeSolution: true,
		});

		expect(countCellRectangles(pdfBytes, "1 1 1")).toBe(totalCells);
		expect(countCellRectangles(pdfBytes, "0 0 0")).toBe(totalCells);
	});

	it("repeats the row/column clue labels on the solution page, matching the puzzle page's layout", async () => {
		const nonogram = createNonogram(3, 2, [
			[true, false, true],
			[false, true, true],
		]);
		const { rowClues, columnClues } = computeNonogramClues(nonogram);
		const expectedClueCount =
			rowClues.reduce((sum, clues) => sum + clues.length, 0) +
			columnClues.reduce((sum, clues) => sum + clues.length, 0);

		const pdfBytes = await renderNonogramToPdf(nonogram, {
			includeSolution: true,
		});

		expect(countTextDraws(pdfBytes)).toBe(expectedClueCount * 2);
	});

	it("rejects a nonogram with invalid dimensions even when includeSolution is true", async () => {
		const invalidNonogram: Nonogram = { width: 0, height: 0, cells: [] };

		await expect(
			renderNonogramToPdf(invalidNonogram, { includeSolution: true }),
		).rejects.toThrow();
	});
});
