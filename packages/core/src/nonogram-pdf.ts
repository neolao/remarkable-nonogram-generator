import {
	PDFDocument,
	type PDFFont,
	type PDFPage,
	rgb,
	StandardFonts,
} from "pdf-lib";
import { computeNonogramClues } from "./nonogram-clues.js";
import {
	type Nonogram,
	REMARKABLE_2_PAGE_HEIGHT_PX,
	REMARKABLE_2_PAGE_WIDTH_PX,
} from "./nonogram-grid.js";

export const REMARKABLE_2_PAGE_WIDTH_PT =
	(REMARKABLE_2_PAGE_WIDTH_PX / 226) * 72;
export const REMARKABLE_2_PAGE_HEIGHT_PT =
	(REMARKABLE_2_PAGE_HEIGHT_PX / 226) * 72;

const PAGE_MARGIN_PT = 24;
const STROKE_COLOR = rgb(0, 0, 0);
const STROKE_WIDTH_PT = 1;
const FILL_COLOR_FILLED = rgb(0, 0, 0);
const FILL_COLOR_EMPTY = rgb(1, 1, 1);
const TEXT_COLOR = rgb(0, 0, 0);
const CLUE_FONT_SIZE_RATIO = 0.55;

type Clues = ReadonlyArray<ReadonlyArray<number>>;

interface NonogramPdfLayout {
	cellSize: number;
	leftOffset: number;
	topOffset: number;
	leftMarginCells: number;
	topMarginCells: number;
}

function validateNonogram(nonogram: Nonogram): void {
	const { width, height, cells } = nonogram;

	if (
		!Number.isInteger(width) ||
		!Number.isInteger(height) ||
		width <= 0 ||
		height <= 0
	) {
		throw new Error(
			`Cannot render a nonogram with invalid dimensions width=${width}, height=${height}`,
		);
	}

	if (cells.length !== height || cells.some((row) => row.length !== width)) {
		throw new Error(
			`Nonogram cells do not match declared dimensions ${width}x${height}`,
		);
	}
}

// Mirrors the sibling maze project's maze-pdf.ts: shrink the cell size until
// the grid plus its clue margins fits the fixed reMarkable 2 page, then
// center the result, so any grid up to the domain model's MAX_GRID_WIDTH /
// MAX_GRID_HEIGHT is guaranteed to fit without clipping.
function computeLayout(
	nonogram: Nonogram,
	rowClues: Clues,
	columnClues: Clues,
): NonogramPdfLayout {
	const leftMarginCells = Math.max(...rowClues.map((clues) => clues.length));
	const topMarginCells = Math.max(...columnClues.map((clues) => clues.length));

	const drawableWidth = REMARKABLE_2_PAGE_WIDTH_PT - 2 * PAGE_MARGIN_PT;
	const drawableHeight = REMARKABLE_2_PAGE_HEIGHT_PT - 2 * PAGE_MARGIN_PT;

	const totalWidthCells = leftMarginCells + nonogram.width;
	const totalHeightCells = topMarginCells + nonogram.height;

	const cellSize = Math.min(
		drawableWidth / totalWidthCells,
		drawableHeight / totalHeightCells,
	);

	const gridWidthPt = totalWidthCells * cellSize;
	const gridHeightPt = totalHeightCells * cellSize;

	return {
		cellSize,
		leftOffset: PAGE_MARGIN_PT + (drawableWidth - gridWidthPt) / 2,
		topOffset: PAGE_MARGIN_PT + (drawableHeight - gridHeightPt) / 2,
		leftMarginCells,
		topMarginCells,
	};
}

// Converts a top-left-origin, Y-down local coordinate (matching the SVG
// renderer's coordinate system) into the bottom-left Y that pdf-lib expects.
function toPdfRectY(
	layout: NonogramPdfLayout,
	localY: number,
	height: number,
): number {
	return REMARKABLE_2_PAGE_HEIGHT_PT - layout.topOffset - localY - height;
}

function drawCells(
	page: PDFPage,
	nonogram: Nonogram,
	layout: NonogramPdfLayout,
): void {
	const { cellSize, leftOffset, leftMarginCells, topMarginCells } = layout;
	const gridStartX = leftOffset + leftMarginCells * cellSize;
	const gridStartYLocal = topMarginCells * cellSize;

	for (let row = 0; row < nonogram.height; row++) {
		for (let column = 0; column < nonogram.width; column++) {
			const x = gridStartX + column * cellSize;
			const localY = gridStartYLocal + row * cellSize;

			page.drawRectangle({
				x,
				y: toPdfRectY(layout, localY, cellSize),
				width: cellSize,
				height: cellSize,
				color: nonogram.cells[row][column]
					? FILL_COLOR_FILLED
					: FILL_COLOR_EMPTY,
				borderColor: STROKE_COLOR,
				borderWidth: STROKE_WIDTH_PT,
			});
		}
	}
}

function drawClueLabel(
	page: PDFPage,
	font: PDFFont,
	value: number,
	centerX: number,
	centerY: number,
	fontSize: number,
): void {
	const text = String(value);
	const textWidth = font.widthOfTextAtSize(text, fontSize);

	page.drawText(text, {
		x: centerX - textWidth / 2,
		y: centerY - fontSize * 0.35,
		size: fontSize,
		font,
		color: TEXT_COLOR,
	});
}

function drawRowClues(
	page: PDFPage,
	font: PDFFont,
	rowClues: Clues,
	layout: NonogramPdfLayout,
	fontSize: number,
): void {
	const { cellSize, leftOffset, leftMarginCells, topMarginCells } = layout;
	const gridStartYLocal = topMarginCells * cellSize;

	rowClues.forEach((clues, row) => {
		clues.forEach((clue, slot) => {
			const slotXLocal =
				leftMarginCells * cellSize - (clues.length - slot) * cellSize;
			const centerX = leftOffset + slotXLocal + cellSize / 2;
			const localY = gridStartYLocal + row * cellSize;
			const centerY = toPdfRectY(layout, localY, cellSize) + cellSize / 2;
			drawClueLabel(page, font, clue, centerX, centerY, fontSize);
		});
	});
}

function drawColumnClues(
	page: PDFPage,
	font: PDFFont,
	columnClues: Clues,
	layout: NonogramPdfLayout,
	fontSize: number,
): void {
	const { cellSize, leftOffset, leftMarginCells, topMarginCells } = layout;
	const gridStartX = leftOffset + leftMarginCells * cellSize;

	columnClues.forEach((clues, column) => {
		clues.forEach((clue, slot) => {
			const slotYLocal =
				topMarginCells * cellSize - (clues.length - slot) * cellSize;
			const centerX = gridStartX + column * cellSize + cellSize / 2;
			const centerY = toPdfRectY(layout, slotYLocal, cellSize) + cellSize / 2;
			drawClueLabel(page, font, clue, centerX, centerY, fontSize);
		});
	});
}

export async function renderNonogramToPdf(
	nonogram: Nonogram,
): Promise<Uint8Array> {
	validateNonogram(nonogram);

	const { rowClues, columnClues } = computeNonogramClues(nonogram);
	const layout = computeLayout(nonogram, rowClues, columnClues);
	const fontSize = layout.cellSize * CLUE_FONT_SIZE_RATIO;

	const document = await PDFDocument.create();
	document.setCreationDate(new Date(0));
	document.setModificationDate(new Date(0));
	const font = await document.embedFont(StandardFonts.Helvetica);
	const page = document.addPage([
		REMARKABLE_2_PAGE_WIDTH_PT,
		REMARKABLE_2_PAGE_HEIGHT_PT,
	]);

	drawCells(page, nonogram, layout);
	drawRowClues(page, font, rowClues, layout, fontSize);
	drawColumnClues(page, font, columnClues, layout, fontSize);

	return document.save();
}
