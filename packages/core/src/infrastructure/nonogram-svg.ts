import { computeNonogramClues } from "../domain/nonogram-clues.js";
import type { Nonogram } from "../domain/nonogram-grid.js";
import {
	CLUE_FONT_SIZE_RATIO,
	type Clues,
	cellRect,
	columnClueSlotPosition,
	computeMarginCells,
	MARGIN_SLOT_RATIO,
	type NonogramLayout,
	rowClueSlotPosition,
	thickGridlineColumns,
	thickGridlineRows,
} from "./nonogram-layout.js";

const DEFAULT_CELL_SIZE_PX = 20;
const STROKE_WIDTH_PX = 1;
const THICK_STROKE_WIDTH_PX = STROKE_WIDTH_PX * 2;

export interface RenderNonogramToSvgOptions {
	cellSizePx?: number;
}

function renderClueText(
	value: number,
	centerX: number,
	centerY: number,
	fontSizePx: number,
): string {
	return `<text x="${centerX}" y="${centerY}" font-size="${fontSizePx}" text-anchor="middle" dominant-baseline="central">${value}</text>`;
}

function renderRowClues(
	rowClues: Clues,
	layout: NonogramLayout,
	fontSizePx: number,
): string {
	return rowClues
		.map((clues, row) => {
			return clues
				.map((clue, slot) => {
					const { centerX, centerY } = rowClueSlotPosition(
						layout,
						row,
						clues.length,
						slot,
					);
					return renderClueText(clue, centerX, centerY, fontSizePx);
				})
				.join("");
		})
		.join("");
}

function renderColumnClues(
	columnClues: Clues,
	layout: NonogramLayout,
	fontSizePx: number,
): string {
	return columnClues
		.map((clues, column) => {
			return clues
				.map((clue, slot) => {
					const { centerX, centerY } = columnClueSlotPosition(
						layout,
						column,
						clues.length,
						slot,
					);
					return renderClueText(clue, centerX, centerY, fontSizePx);
				})
				.join("");
		})
		.join("");
}

function renderCells(nonogram: Nonogram, layout: NonogramLayout): string {
	let markup = "";

	for (let row = 0; row < nonogram.height; row++) {
		for (let column = 0; column < nonogram.width; column++) {
			const { x, y, size } = cellRect(layout, row, column);
			const fill = nonogram.cells[row][column] ? "black" : "white";
			markup += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${fill}" stroke="black" stroke-width="${STROKE_WIDTH_PX}" />`;
		}
	}

	return markup;
}

function renderThickGridlines(
	nonogram: Nonogram,
	layout: NonogramLayout,
): string {
	const { gridStartX, gridStartY, cellSize } = layout;
	const gridEndX = gridStartX + nonogram.width * cellSize;
	const gridEndY = gridStartY + nonogram.height * cellSize;
	let markup = "";

	for (const column of thickGridlineColumns(nonogram.width)) {
		const x = gridStartX + column * cellSize;
		markup += `<line x1="${x}" y1="${gridStartY}" x2="${x}" y2="${gridEndY}" stroke="black" stroke-width="${THICK_STROKE_WIDTH_PX}" />`;
	}

	for (const row of thickGridlineRows(nonogram.height)) {
		const y = gridStartY + row * cellSize;
		markup += `<line x1="${gridStartX}" y1="${y}" x2="${gridEndX}" y2="${y}" stroke="black" stroke-width="${THICK_STROKE_WIDTH_PX}" />`;
	}

	return markup;
}

export function renderNonogramToSvg(
	nonogram: Nonogram,
	options: RenderNonogramToSvgOptions = {},
): string {
	const cellSizePx = options.cellSizePx ?? DEFAULT_CELL_SIZE_PX;
	if (!Number.isFinite(cellSizePx) || cellSizePx <= 0) {
		throw new Error(`cellSizePx must be a positive number, got ${cellSizePx}`);
	}

	const { rowClues, columnClues } = computeNonogramClues(nonogram);
	const { leftMarginCells, topMarginCells } = computeMarginCells(
		rowClues,
		columnClues,
	);
	const fontSizePx = cellSizePx * CLUE_FONT_SIZE_RATIO;
	const marginSlotSizePx = cellSizePx * MARGIN_SLOT_RATIO;

	const layout: NonogramLayout = {
		cellSize: cellSizePx,
		marginSlotSize: marginSlotSizePx,
		gridStartX: leftMarginCells * marginSlotSizePx,
		gridStartY: topMarginCells * marginSlotSizePx,
		leftMarginCells,
		topMarginCells,
	};
	const width = layout.gridStartX + nonogram.width * cellSizePx;
	const height = layout.gridStartY + nonogram.height * cellSizePx;

	const background = `<rect x="0" y="0" width="${width}" height="${height}" fill="white" />`;
	const cells = renderCells(nonogram, layout);
	const thickGridlines = renderThickGridlines(nonogram, layout);
	const rowCluesMarkup = renderRowClues(rowClues, layout, fontSizePx);
	const columnCluesMarkup = renderColumnClues(columnClues, layout, fontSizePx);

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${background}${cells}${thickGridlines}${rowCluesMarkup}${columnCluesMarkup}</svg>`;
}
