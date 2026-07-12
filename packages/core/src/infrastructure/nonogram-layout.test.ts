import { describe, expect, it } from "vitest";
import {
	cellRect,
	columnClueSlotPosition,
	computeMarginCells,
	rowClueSlotPosition,
	thickGridlineColumns,
	thickGridlineRows,
} from "./nonogram-layout.js";

describe("computeMarginCells", () => {
	it("returns the longest clue count on each axis", () => {
		const rowClues = [[1], [2, 3]];
		const columnClues = [[0]];

		expect(computeMarginCells(rowClues, columnClues)).toEqual({
			leftMarginCells: 2,
			topMarginCells: 1,
		});
	});

	it("handles a single 1x1 grid with empty lines", () => {
		expect(computeMarginCells([[0]], [[0]])).toEqual({
			leftMarginCells: 1,
			topMarginCells: 1,
		});
	});
});

describe("cellRect", () => {
	const layout = {
		cellSize: 20,
		marginSlotSize: 15,
		gridStartX: 40,
		gridStartY: 30,
		leftMarginCells: 2,
		topMarginCells: 1,
	};

	it("positions the top-left cell at the grid origin", () => {
		expect(cellRect(layout, 0, 0)).toEqual({ x: 40, y: 30, size: 20 });
	});

	it("offsets by row and column multiplied by the cell size", () => {
		expect(cellRect(layout, 2, 3)).toEqual({ x: 100, y: 70, size: 20 });
	});
});

describe("thickGridlineColumns / thickGridlineRows", () => {
	it("returns interior multiples of 5 strictly inside the grid", () => {
		expect(thickGridlineColumns(12)).toEqual([5, 10]);
		expect(thickGridlineRows(12)).toEqual([5, 10]);
	});

	it("returns no lines for a grid no larger than the interval", () => {
		expect(thickGridlineColumns(5)).toEqual([]);
		expect(thickGridlineRows(4)).toEqual([]);
	});
});

describe("rowClueSlotPosition / columnClueSlotPosition", () => {
	const layout = {
		cellSize: 20,
		marginSlotSize: 15,
		gridStartX: 45,
		gridStartY: 0,
		leftMarginCells: 2,
		topMarginCells: 2,
	};

	it("stacks row clue slots right-aligned against the grid start", () => {
		expect(rowClueSlotPosition(layout, 0, 2, 0)).toEqual({
			centerX: 22.5,
			centerY: 10,
		});
		expect(rowClueSlotPosition(layout, 0, 2, 1)).toEqual({
			centerX: 37.5,
			centerY: 10,
		});
	});

	it("stacks column clue slots bottom-aligned against the grid start", () => {
		const verticalLayout = { ...layout, gridStartX: 0, gridStartY: 45 };

		expect(columnClueSlotPosition(verticalLayout, 0, 2, 0)).toEqual({
			centerX: 10,
			centerY: 22.5,
		});
		expect(columnClueSlotPosition(verticalLayout, 0, 2, 1)).toEqual({
			centerX: 10,
			centerY: 37.5,
		});
	});
});
