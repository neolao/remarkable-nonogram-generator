import { computeNonogramClues } from "./nonogram-clues.js";
import type { Nonogram } from "./nonogram-grid.js";

const DEFAULT_CELL_SIZE_PX = 20;
const STROKE_WIDTH_PX = 1;
const FONT_SIZE_RATIO = 0.55;

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
	rowClues: ReadonlyArray<ReadonlyArray<number>>,
	gridStartX: number,
	gridStartY: number,
	cellSizePx: number,
	fontSizePx: number,
): string {
	return rowClues
		.map((clues, row) => {
			return clues
				.map((clue, slot) => {
					const slotX = gridStartX - (clues.length - slot) * cellSizePx;
					const centerX = slotX + cellSizePx / 2;
					const centerY = gridStartY + row * cellSizePx + cellSizePx / 2;
					return renderClueText(clue, centerX, centerY, fontSizePx);
				})
				.join("");
		})
		.join("");
}

function renderColumnClues(
	columnClues: ReadonlyArray<ReadonlyArray<number>>,
	gridStartX: number,
	gridStartY: number,
	cellSizePx: number,
	fontSizePx: number,
): string {
	return columnClues
		.map((clues, column) => {
			return clues
				.map((clue, slot) => {
					const slotY = gridStartY - (clues.length - slot) * cellSizePx;
					const centerX = gridStartX + column * cellSizePx + cellSizePx / 2;
					const centerY = slotY + cellSizePx / 2;
					return renderClueText(clue, centerX, centerY, fontSizePx);
				})
				.join("");
		})
		.join("");
}

function renderCells(
	nonogram: Nonogram,
	gridStartX: number,
	gridStartY: number,
	cellSizePx: number,
): string {
	let markup = "";

	for (let row = 0; row < nonogram.height; row++) {
		for (let column = 0; column < nonogram.width; column++) {
			const x = gridStartX + column * cellSizePx;
			const y = gridStartY + row * cellSizePx;
			const fill = nonogram.cells[row][column] ? "black" : "white";
			markup += `<rect x="${x}" y="${y}" width="${cellSizePx}" height="${cellSizePx}" fill="${fill}" stroke="black" stroke-width="${STROKE_WIDTH_PX}" />`;
		}
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
	const leftMarginCells = Math.max(...rowClues.map((clues) => clues.length));
	const topMarginCells = Math.max(...columnClues.map((clues) => clues.length));
	const fontSizePx = cellSizePx * FONT_SIZE_RATIO;

	const gridStartX = leftMarginCells * cellSizePx;
	const gridStartY = topMarginCells * cellSizePx;
	const width = gridStartX + nonogram.width * cellSizePx;
	const height = gridStartY + nonogram.height * cellSizePx;

	const background = `<rect x="0" y="0" width="${width}" height="${height}" fill="white" />`;
	const cells = renderCells(nonogram, gridStartX, gridStartY, cellSizePx);
	const rowCluesMarkup = renderRowClues(
		rowClues,
		gridStartX,
		gridStartY,
		cellSizePx,
		fontSizePx,
	);
	const columnCluesMarkup = renderColumnClues(
		columnClues,
		gridStartX,
		gridStartY,
		cellSizePx,
		fontSizePx,
	);

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${background}${cells}${rowCluesMarkup}${columnCluesMarkup}</svg>`;
}
