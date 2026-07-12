import { describe, expect, it } from "vitest";
import { computeNonogramClues } from "../domain/nonogram-clues.js";
import { createNonogram } from "../domain/nonogram-grid.js";
import { renderNonogramToSvg } from "./nonogram-svg.js";

interface TextElement {
	x: number;
	y: number;
	content: string;
}

function extractViewBoxSize(svg: string): { width: number; height: number } {
	const match = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
	if (!match) {
		throw new Error("SVG has no viewBox attribute");
	}
	return { width: Number(match[1]), height: Number(match[2]) };
}

function extractTexts(svg: string): TextElement[] {
	const matches = svg.matchAll(
		/<text x="(-?\d+(?:\.\d+)?)" y="(-?\d+(?:\.\d+)?)"[^>]*>([^<]+)<\/text>/g,
	);
	return Array.from(matches).map((match) => ({
		x: Number(match[1]),
		y: Number(match[2]),
		content: match[3],
	}));
}

function countFilledCellRects(svg: string): number {
	return (svg.match(/<rect[^>]*fill="black"[^>]*>/g) || []).length;
}

function countCellRects(svg: string): number {
	// Subtract 1 for the full-canvas background rect.
	return (svg.match(/<rect /g) || []).length - 1;
}

interface LineElement {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	strokeWidth: number;
}

function extractThickLines(svg: string): LineElement[] {
	const matches = svg.matchAll(
		/<line x1="(-?\d+(?:\.\d+)?)" y1="(-?\d+(?:\.\d+)?)" x2="(-?\d+(?:\.\d+)?)" y2="(-?\d+(?:\.\d+)?)" stroke="[^"]*" stroke-width="(-?\d+(?:\.\d+)?)" \/>/g,
	);
	return Array.from(matches)
		.map((match) => ({
			x1: Number(match[1]),
			y1: Number(match[2]),
			x2: Number(match[3]),
			y2: Number(match[4]),
			strokeWidth: Number(match[5]),
		}))
		.filter((line) => line.strokeWidth > 1);
}

function emptyCells(width: number, height: number): boolean[][] {
	return Array.from({ length: height }, () =>
		Array.from({ length: width }, () => false),
	);
}

describe("renderNonogramToSvg", () => {
	it("renders one rect per grid cell, with filled cells visually distinct from empty ones", () => {
		const cells = [
			[true, false, true],
			[false, true, false],
			[true, true, false],
		];
		const nonogram = createNonogram(3, 3, cells);

		const svg = renderNonogramToSvg(nonogram, { cellSizePx: 20 });

		expect(svg.startsWith("<svg")).toBe(true);
		expect(svg.trim().endsWith("</svg>")).toBe(true);
		expect(countCellRects(svg)).toBe(9);
		expect(countFilledCellRects(svg)).toBe(cells.flat().filter(Boolean).length);
	});

	it("renders row clues to the left of each row and column clues above each column, matching computed values", () => {
		const cells = [
			[true, false, true],
			[false, true, true],
		];
		const nonogram = createNonogram(3, 2, cells);
		const cellSizePx = 20;
		const expectedClues = computeNonogramClues(nonogram);

		const svg = renderNonogramToSvg(nonogram, { cellSizePx });

		const { width: totalWidth, height: totalHeight } = extractViewBoxSize(svg);
		const gridStartX = totalWidth - nonogram.width * cellSizePx;
		const gridStartY = totalHeight - nonogram.height * cellSizePx;

		const texts = extractTexts(svg);
		const rowClueTexts = texts.filter(
			(text) => text.x < gridStartX && text.y >= gridStartY,
		);
		const columnClueTexts = texts.filter(
			(text) => text.y < gridStartY && text.x >= gridStartX,
		);

		for (let row = 0; row < nonogram.height; row++) {
			const bandStart = gridStartY + row * cellSizePx;
			const bandEnd = bandStart + cellSizePx;
			const rowTexts = rowClueTexts
				.filter((text) => text.y >= bandStart && text.y < bandEnd)
				.sort((a, b) => a.x - b.x)
				.map((text) => Number(text.content));

			expect(rowTexts).toEqual(expectedClues.rowClues[row]);
		}

		for (let column = 0; column < nonogram.width; column++) {
			const bandStart = gridStartX + column * cellSizePx;
			const bandEnd = bandStart + cellSizePx;
			const columnTexts = columnClueTexts
				.filter((text) => text.x >= bandStart && text.x < bandEnd)
				.sort((a, b) => a.y - b.y)
				.map((text) => Number(text.content));

			expect(columnTexts).toEqual(expectedClues.columnClues[column]);
		}
	});

	it("renders a valid SVG for an entirely empty grid, with each row/column showing a single 0 clue", () => {
		const cells = [
			[false, false],
			[false, false],
		];
		const nonogram = createNonogram(2, 2, cells);

		const svg = renderNonogramToSvg(nonogram, { cellSizePx: 20 });

		expect(svg.startsWith("<svg")).toBe(true);
		expect(countFilledCellRects(svg)).toBe(0);

		const texts = extractTexts(svg);
		expect(texts).toHaveLength(4);
		expect(texts.every((text) => text.content === "0")).toBe(true);
	});

	it("renders the minimal 1x1 grid without error, for both a filled and an empty cell", () => {
		const filledNonogram = createNonogram(1, 1, [[true]]);
		const emptyNonogram = createNonogram(1, 1, [[false]]);

		const filledSvg = renderNonogramToSvg(filledNonogram);
		const emptySvg = renderNonogramToSvg(emptyNonogram);

		expect(filledSvg.startsWith("<svg")).toBe(true);
		expect(countFilledCellRects(filledSvg)).toBe(1);
		expect(emptySvg.startsWith("<svg")).toBe(true);
		expect(countFilledCellRects(emptySvg)).toBe(0);
	});

	it("throws a clear error when cellSizePx is zero or negative", () => {
		const nonogram = createNonogram(2, 2, [
			[true, false],
			[false, true],
		]);

		expect(() => renderNonogramToSvg(nonogram, { cellSizePx: 0 })).toThrow();
		expect(() => renderNonogramToSvg(nonogram, { cellSizePx: -10 })).toThrow();
	});

	it("draws a thicker gridline only at the interior 5th row and 5th column, leaving other lines regular", () => {
		const width = 10;
		const height = 8;
		const cellSizePx = 20;
		const nonogram = createNonogram(width, height, emptyCells(width, height));

		const svg = renderNonogramToSvg(nonogram, { cellSizePx });

		const { width: totalWidth, height: totalHeight } = extractViewBoxSize(svg);
		const gridStartX = totalWidth - width * cellSizePx;
		const gridStartY = totalHeight - height * cellSizePx;

		const thickLines = extractThickLines(svg);
		const verticalOffsets = thickLines
			.filter((line) => line.x1 === line.x2)
			.map((line) => line.x1 - gridStartX);
		const horizontalOffsets = thickLines
			.filter((line) => line.y1 === line.y2)
			.map((line) => line.y1 - gridStartY);

		expect(verticalOffsets).toEqual([5 * cellSizePx]);
		expect(horizontalOffsets).toEqual([5 * cellSizePx]);
	});

	it("draws no thick gridline when a grid dimension is smaller than 5", () => {
		const width = 4;
		const height = 3;
		const nonogram = createNonogram(width, height, emptyCells(width, height));

		const svg = renderNonogramToSvg(nonogram, { cellSizePx: 20 });

		expect(extractThickLines(svg)).toHaveLength(0);
	});

	it("never thickens the outer border, even when the total width/height is an exact multiple of 5", () => {
		const width = 10;
		const height = 10;
		const cellSizePx = 20;
		const nonogram = createNonogram(width, height, emptyCells(width, height));

		const svg = renderNonogramToSvg(nonogram, { cellSizePx });

		const { width: totalWidth, height: totalHeight } = extractViewBoxSize(svg);
		const gridStartX = totalWidth - width * cellSizePx;
		const gridStartY = totalHeight - height * cellSizePx;
		const gridEndX = gridStartX + width * cellSizePx;
		const gridEndY = gridStartY + height * cellSizePx;

		const thickLines = extractThickLines(svg);
		const verticalOffsets = thickLines
			.filter((line) => line.x1 === line.x2)
			.map((line) => line.x1);
		const horizontalOffsets = thickLines
			.filter((line) => line.y1 === line.y2)
			.map((line) => line.y1);

		expect(verticalOffsets).not.toContain(gridStartX);
		expect(verticalOffsets).not.toContain(gridEndX);
		expect(verticalOffsets).toEqual([gridStartX + 5 * cellSizePx]);
		expect(horizontalOffsets).not.toContain(gridStartY);
		expect(horizontalOffsets).not.toContain(gridEndY);
		expect(horizontalOffsets).toEqual([gridStartY + 5 * cellSizePx]);
	});

	it("draws no thick gridline when a dimension is exactly 5, since index 5 sits on the outer edge, not an interior line", () => {
		const width = 5;
		const height = 5;
		const nonogram = createNonogram(width, height, emptyCells(width, height));

		const svg = renderNonogramToSvg(nonogram, { cellSizePx: 20 });

		expect(extractThickLines(svg)).toHaveLength(0);
	});

	it("packs the clue margin tighter than one full grid cell per clue slot, leaving more room for the grid", () => {
		const width = 6;
		const height = 3;
		const cells = [
			[true, false, true, false, true, false],
			[false, false, false, false, false, false],
			[false, false, false, false, false, false],
		];
		const nonogram = createNonogram(width, height, cells);
		const cellSizePx = 20;
		const { rowClues } = computeNonogramClues(nonogram);
		const leftMarginCells = Math.max(...rowClues.map((clues) => clues.length));

		const svg = renderNonogramToSvg(nonogram, { cellSizePx });
		const { width: totalWidth } = extractViewBoxSize(svg);
		const gridStartX = totalWidth - width * cellSizePx;

		expect(leftMarginCells).toBeGreaterThan(1);
		expect(gridStartX).toBeLessThan(leftMarginCells * cellSizePx);
	});

	it("keeps clue slots wide enough relative to the font size that adjacent numbers cannot touch", () => {
		const width = 6;
		const height = 2;
		const cells = [
			[true, false, true, false, true, false],
			[false, false, false, false, false, false],
		];
		const nonogram = createNonogram(width, height, cells);
		const cellSizePx = 24;

		const svg = renderNonogramToSvg(nonogram, { cellSizePx });
		const fontSizeMatch = svg.match(/font-size="([\d.]+)"/);
		if (!fontSizeMatch) {
			throw new Error("SVG has no font-size attribute");
		}
		const fontSizePx = Number(fontSizeMatch[1]);

		const { width: totalWidth, height: totalHeight } = extractViewBoxSize(svg);
		const gridStartX = totalWidth - width * cellSizePx;
		const gridStartY = totalHeight - height * cellSizePx;
		const rowClueTexts = extractTexts(svg)
			.filter((text) => text.x < gridStartX && text.y >= gridStartY)
			.sort((a, b) => a.x - b.x);
		const slotSpacing = rowClueTexts[1].x - rowClueTexts[0].x;

		expect(slotSpacing).toBeLessThan(cellSizePx);
		expect(slotSpacing).toBeGreaterThan(fontSizePx * 1.15);
	});
});
