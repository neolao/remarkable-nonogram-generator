import { computeNonogramClues } from "../domain/nonogram-clues.js";
import type { Nonogram } from "../domain/nonogram-grid.js";

const DEFAULT_CELL_SIZE_PX = 20;
const STROKE_WIDTH_PX = 1;
const THICK_STROKE_WIDTH_PX = STROKE_WIDTH_PX * 2;
const THICK_GRIDLINE_INTERVAL = 5;
const FONT_SIZE_RATIO = 0.55;
// Clue numbers stack in a margin slot narrower than a full grid cell (they
// only need to fit their own digits, not a full puzzle cell), so the margin
// takes less of the page while the numbers themselves keep the same size.
const MARGIN_SLOT_RATIO = 0.75;

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
	marginSlotSizePx: number,
	fontSizePx: number,
): string {
	return rowClues
		.map((clues, row) => {
			return clues
				.map((clue, slot) => {
					const slotX = gridStartX - (clues.length - slot) * marginSlotSizePx;
					const centerX = slotX + marginSlotSizePx / 2;
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
	marginSlotSizePx: number,
	fontSizePx: number,
): string {
	return columnClues
		.map((clues, column) => {
			return clues
				.map((clue, slot) => {
					const slotY = gridStartY - (clues.length - slot) * marginSlotSizePx;
					const centerX = gridStartX + column * cellSizePx + cellSizePx / 2;
					const centerY = slotY + marginSlotSizePx / 2;
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

// Interior lines only, at indices that are a multiple of THICK_GRIDLINE_INTERVAL
// and strictly between 0 and the grid's width/height: the outer border always
// stays at the regular stroke width, regardless of the grid's total size.
function renderThickGridlines(
	nonogram: Nonogram,
	gridStartX: number,
	gridStartY: number,
	cellSizePx: number,
): string {
	const gridEndX = gridStartX + nonogram.width * cellSizePx;
	const gridEndY = gridStartY + nonogram.height * cellSizePx;
	let markup = "";

	for (
		let column = THICK_GRIDLINE_INTERVAL;
		column < nonogram.width;
		column += THICK_GRIDLINE_INTERVAL
	) {
		const x = gridStartX + column * cellSizePx;
		markup += `<line x1="${x}" y1="${gridStartY}" x2="${x}" y2="${gridEndY}" stroke="black" stroke-width="${THICK_STROKE_WIDTH_PX}" />`;
	}

	for (
		let row = THICK_GRIDLINE_INTERVAL;
		row < nonogram.height;
		row += THICK_GRIDLINE_INTERVAL
	) {
		const y = gridStartY + row * cellSizePx;
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
	const leftMarginCells = Math.max(...rowClues.map((clues) => clues.length));
	const topMarginCells = Math.max(...columnClues.map((clues) => clues.length));
	const fontSizePx = cellSizePx * FONT_SIZE_RATIO;
	const marginSlotSizePx = cellSizePx * MARGIN_SLOT_RATIO;

	const gridStartX = leftMarginCells * marginSlotSizePx;
	const gridStartY = topMarginCells * marginSlotSizePx;
	const width = gridStartX + nonogram.width * cellSizePx;
	const height = gridStartY + nonogram.height * cellSizePx;

	const background = `<rect x="0" y="0" width="${width}" height="${height}" fill="white" />`;
	const cells = renderCells(nonogram, gridStartX, gridStartY, cellSizePx);
	const thickGridlines = renderThickGridlines(
		nonogram,
		gridStartX,
		gridStartY,
		cellSizePx,
	);
	const rowCluesMarkup = renderRowClues(
		rowClues,
		gridStartX,
		gridStartY,
		cellSizePx,
		marginSlotSizePx,
		fontSizePx,
	);
	const columnCluesMarkup = renderColumnClues(
		columnClues,
		gridStartX,
		gridStartY,
		cellSizePx,
		marginSlotSizePx,
		fontSizePx,
	);

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${background}${cells}${thickGridlines}${rowCluesMarkup}${columnCluesMarkup}</svg>`;
}
