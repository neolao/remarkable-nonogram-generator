// reMarkable 2 portrait screen/page: 1404x1872 px at 226 DPI.
export const REMARKABLE_2_PAGE_WIDTH_PX = 1404;
export const REMARKABLE_2_PAGE_HEIGHT_PX = 1872;

// Space reserved on each axis for row/column clue numbers, so the drawable
// grid area never overlaps the clues once rendering is implemented.
export const CLUE_AREA_MARGIN_PX = 150;

// Smallest cell size, in px, that stays legible/fillable once printed.
export const MIN_CELL_SIZE_PX = 20;

export const MAX_GRID_WIDTH = Math.floor(
	(REMARKABLE_2_PAGE_WIDTH_PX - CLUE_AREA_MARGIN_PX) / MIN_CELL_SIZE_PX,
);
export const MAX_GRID_HEIGHT = Math.floor(
	(REMARKABLE_2_PAGE_HEIGHT_PX - CLUE_AREA_MARGIN_PX) / MIN_CELL_SIZE_PX,
);

export interface Nonogram {
	readonly width: number;
	readonly height: number;
	readonly cells: ReadonlyArray<ReadonlyArray<boolean>>;
}

export function createNonogram(
	width: number,
	height: number,
	cells: ReadonlyArray<ReadonlyArray<boolean>>,
): Nonogram {
	if (
		!Number.isInteger(width) ||
		!Number.isInteger(height) ||
		width <= 0 ||
		height <= 0
	) {
		throw new Error(
			`Nonogram width and height must be positive integers, got width=${width}, height=${height}`,
		);
	}

	if (width > MAX_GRID_WIDTH || height > MAX_GRID_HEIGHT) {
		throw new Error(
			`Nonogram grid ${width}x${height} is too large for a reMarkable 2 page (max ${MAX_GRID_WIDTH}x${MAX_GRID_HEIGHT})`,
		);
	}

	if (cells.length !== height || cells.some((row) => row.length !== width)) {
		throw new Error(
			`Nonogram cells must match declared dimensions ${width}x${height}`,
		);
	}

	return { width, height, cells };
}
