import { describe, expect, it } from "vitest";
import { computeNonogramClues } from "./nonogram-clues.js";
import { createNonogram } from "./nonogram-grid.js";
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
});
