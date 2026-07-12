// Shared geometry for the SVG and PDF renderers. Both work in the same local,
// top-left-origin, Y-down coordinate system (the PDF renderer converts to
// pdf-lib's bottom-left origin only at the very last step, in nonogram-pdf.ts),
// so the positions computed here are consumed identically by both.

export type Clues = ReadonlyArray<ReadonlyArray<number>>;

export const THICK_GRIDLINE_INTERVAL = 5;
// Clue numbers stack in a margin slot narrower than a full grid cell (they
// only need to fit their own digits, not a full puzzle cell), so the margin
// takes less of the page while the numbers themselves keep the same size.
export const MARGIN_SLOT_RATIO = 0.75;
export const CLUE_FONT_SIZE_RATIO = 0.55;

export interface NonogramLayout {
	readonly cellSize: number;
	readonly marginSlotSize: number;
	readonly gridStartX: number;
	readonly gridStartY: number;
	readonly leftMarginCells: number;
	readonly topMarginCells: number;
}

export interface CellRect {
	readonly x: number;
	readonly y: number;
	readonly size: number;
}

export interface CluePosition {
	readonly centerX: number;
	readonly centerY: number;
}

export function computeMarginCells(
	rowClues: Clues,
	columnClues: Clues,
): { leftMarginCells: number; topMarginCells: number } {
	return {
		leftMarginCells: Math.max(...rowClues.map((clues) => clues.length)),
		topMarginCells: Math.max(...columnClues.map((clues) => clues.length)),
	};
}

export function cellRect(
	layout: NonogramLayout,
	row: number,
	column: number,
): CellRect {
	return {
		x: layout.gridStartX + column * layout.cellSize,
		y: layout.gridStartY + row * layout.cellSize,
		size: layout.cellSize,
	};
}

// Interior lines only, at indices that are a multiple of THICK_GRIDLINE_INTERVAL
// and strictly between 0 and the grid's width/height: the outer border always
// stays at the regular stroke width, regardless of the grid's total size.
export function thickGridlineColumns(width: number): number[] {
	const columns: number[] = [];
	for (
		let column = THICK_GRIDLINE_INTERVAL;
		column < width;
		column += THICK_GRIDLINE_INTERVAL
	) {
		columns.push(column);
	}
	return columns;
}

export function thickGridlineRows(height: number): number[] {
	const rows: number[] = [];
	for (
		let row = THICK_GRIDLINE_INTERVAL;
		row < height;
		row += THICK_GRIDLINE_INTERVAL
	) {
		rows.push(row);
	}
	return rows;
}

export function rowClueSlotPosition(
	layout: NonogramLayout,
	row: number,
	clueCount: number,
	slot: number,
): CluePosition {
	const slotX = layout.gridStartX - (clueCount - slot) * layout.marginSlotSize;
	return {
		centerX: slotX + layout.marginSlotSize / 2,
		centerY: layout.gridStartY + row * layout.cellSize + layout.cellSize / 2,
	};
}

export function columnClueSlotPosition(
	layout: NonogramLayout,
	column: number,
	clueCount: number,
	slot: number,
): CluePosition {
	const slotY = layout.gridStartY - (clueCount - slot) * layout.marginSlotSize;
	return {
		centerX: layout.gridStartX + column * layout.cellSize + layout.cellSize / 2,
		centerY: slotY + layout.marginSlotSize / 2,
	};
}
