import {
	PDFDocument,
	type PDFFont,
	type PDFPage,
	rgb,
	StandardFonts,
} from "pdf-lib";
import { computeNonogramClues } from "../domain/nonogram-clues.js";
import {
	createNonogram,
	type Nonogram,
	REMARKABLE_2_PAGE_HEIGHT_PX,
	REMARKABLE_2_PAGE_WIDTH_PX,
} from "../domain/nonogram-grid.js";
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

export const REMARKABLE_2_PAGE_WIDTH_PT =
	(REMARKABLE_2_PAGE_WIDTH_PX / 226) * 72;
export const REMARKABLE_2_PAGE_HEIGHT_PT =
	(REMARKABLE_2_PAGE_HEIGHT_PX / 226) * 72;

const PAGE_MARGIN_PT = 24;
const STROKE_COLOR = rgb(0, 0, 0);
const STROKE_WIDTH_PT = 1;
const THICK_STROKE_WIDTH_PT = STROKE_WIDTH_PT * 2;
const FILL_COLOR_EMPTY = rgb(1, 1, 1);
const FILL_COLOR_FILLED = rgb(0, 0, 0);
const TEXT_COLOR = rgb(0, 0, 0);

export interface RenderNonogramToPdfOptions {
	includeSolution?: boolean;
}

// Mirrors the sibling maze project's maze-pdf.ts: shrink the cell size until
// the grid plus its clue margins fits the fixed reMarkable 2 page, then
// center the result, so any grid up to the domain model's MAX_GRID_WIDTH /
// MAX_GRID_HEIGHT is guaranteed to fit without clipping.
function computeLayout(
	nonogram: Nonogram,
	rowClues: Clues,
	columnClues: Clues,
): NonogramLayout {
	const { leftMarginCells, topMarginCells } = computeMarginCells(
		rowClues,
		columnClues,
	);

	const drawableWidth = REMARKABLE_2_PAGE_WIDTH_PT - 2 * PAGE_MARGIN_PT;
	const drawableHeight = REMARKABLE_2_PAGE_HEIGHT_PT - 2 * PAGE_MARGIN_PT;

	// Margin cells are narrower than grid cells (MARGIN_SLOT_RATIO), so they
	// are weighted accordingly when solving for the cell size that fits the
	// page — the space freed by the tighter margin grows the grid cells.
	const totalWidthCells = leftMarginCells * MARGIN_SLOT_RATIO + nonogram.width;
	const totalHeightCells = topMarginCells * MARGIN_SLOT_RATIO + nonogram.height;

	const cellSize = Math.min(
		drawableWidth / totalWidthCells,
		drawableHeight / totalHeightCells,
	);
	const marginSlotSize = cellSize * MARGIN_SLOT_RATIO;

	const gridWidthPt = totalWidthCells * cellSize;
	const gridHeightPt = totalHeightCells * cellSize;
	const leftOffset = PAGE_MARGIN_PT + (drawableWidth - gridWidthPt) / 2;
	const topOffset = PAGE_MARGIN_PT + (drawableHeight - gridHeightPt) / 2;

	return {
		cellSize,
		marginSlotSize,
		gridStartX: leftOffset + leftMarginCells * marginSlotSize,
		gridStartY: topOffset + topMarginCells * marginSlotSize,
		leftMarginCells,
		topMarginCells,
	};
}

// Converts a top-left-origin, Y-down local coordinate (matching the SVG
// renderer's coordinate system, and already including the page centering
// offset baked into the layout's gridStartX/gridStartY) into the bottom-left
// Y that pdf-lib expects.
function toPdfRectY(y: number, height: number): number {
	return REMARKABLE_2_PAGE_HEIGHT_PT - y - height;
}

// The first page is always the blank puzzle to solve on the device: every
// cell is rendered empty regardless of nonogram.cells. When a solution page
// is requested (see renderNonogramToPdf), it reuses this same function with
// showSolution=true so filled cells render black, matching the SVG preview.
function drawCells(
	page: PDFPage,
	nonogram: Nonogram,
	layout: NonogramLayout,
	showSolution: boolean,
): void {
	for (let row = 0; row < nonogram.height; row++) {
		for (let column = 0; column < nonogram.width; column++) {
			const { x, y, size } = cellRect(layout, row, column);
			const isFilled = showSolution && nonogram.cells[row][column];

			page.drawRectangle({
				x,
				y: toPdfRectY(y, size),
				width: size,
				height: size,
				color: isFilled ? FILL_COLOR_FILLED : FILL_COLOR_EMPTY,
				borderColor: STROKE_COLOR,
				borderWidth: STROKE_WIDTH_PT,
			});
		}
	}
}

function drawThickGridlines(
	page: PDFPage,
	nonogram: Nonogram,
	layout: NonogramLayout,
): void {
	const { gridStartX, gridStartY, cellSize } = layout;
	const gridEndX = gridStartX + nonogram.width * cellSize;
	const gridEndY = gridStartY + nonogram.height * cellSize;

	for (const column of thickGridlineColumns(nonogram.width)) {
		const x = gridStartX + column * cellSize;
		page.drawLine({
			start: { x, y: toPdfRectY(gridStartY, 0) },
			end: { x, y: toPdfRectY(gridEndY, 0) },
			thickness: THICK_STROKE_WIDTH_PT,
			color: STROKE_COLOR,
		});
	}

	for (const row of thickGridlineRows(nonogram.height)) {
		const y = gridStartY + row * cellSize;
		const pdfY = toPdfRectY(y, 0);
		page.drawLine({
			start: { x: gridStartX, y: pdfY },
			end: { x: gridEndX, y: pdfY },
			thickness: THICK_STROKE_WIDTH_PT,
			color: STROKE_COLOR,
		});
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
	layout: NonogramLayout,
	fontSize: number,
): void {
	rowClues.forEach((clues, row) => {
		clues.forEach((clue, slot) => {
			const { centerX, centerY } = rowClueSlotPosition(
				layout,
				row,
				clues.length,
				slot,
			);
			drawClueLabel(
				page,
				font,
				clue,
				centerX,
				toPdfRectY(centerY, 0),
				fontSize,
			);
		});
	});
}

function drawColumnClues(
	page: PDFPage,
	font: PDFFont,
	columnClues: Clues,
	layout: NonogramLayout,
	fontSize: number,
): void {
	columnClues.forEach((clues, column) => {
		clues.forEach((clue, slot) => {
			const { centerX, centerY } = columnClueSlotPosition(
				layout,
				column,
				clues.length,
				slot,
			);
			drawClueLabel(
				page,
				font,
				clue,
				centerX,
				toPdfRectY(centerY, 0),
				fontSize,
			);
		});
	});
}

interface DrawNonogramPageOptions {
	nonogram: Nonogram;
	rowClues: Clues;
	columnClues: Clues;
	layout: NonogramLayout;
	fontSize: number;
	showSolution: boolean;
}

function drawNonogramPage(
	document: PDFDocument,
	font: PDFFont,
	options: DrawNonogramPageOptions,
): void {
	const { nonogram, rowClues, columnClues, layout, fontSize, showSolution } =
		options;
	const page = document.addPage([
		REMARKABLE_2_PAGE_WIDTH_PT,
		REMARKABLE_2_PAGE_HEIGHT_PT,
	]);

	drawCells(page, nonogram, layout, showSolution);
	drawThickGridlines(page, nonogram, layout);
	drawRowClues(page, font, rowClues, layout, fontSize);
	drawColumnClues(page, font, columnClues, layout, fontSize);
}

export async function renderNonogramToPdf(
	nonogram: Nonogram,
	options: RenderNonogramToPdfOptions = {},
): Promise<Uint8Array> {
	createNonogram(nonogram.width, nonogram.height, nonogram.cells);

	const { rowClues, columnClues } = computeNonogramClues(nonogram);
	const layout = computeLayout(nonogram, rowClues, columnClues);
	const fontSize = layout.cellSize * CLUE_FONT_SIZE_RATIO;

	const document = await PDFDocument.create();
	document.setCreationDate(new Date(0));
	document.setModificationDate(new Date(0));
	const font = await document.embedFont(StandardFonts.Helvetica);

	drawNonogramPage(document, font, {
		nonogram,
		rowClues,
		columnClues,
		layout,
		fontSize,
		showSolution: false,
	});

	if (options.includeSolution) {
		drawNonogramPage(document, font, {
			nonogram,
			rowClues,
			columnClues,
			layout,
			fontSize,
			showSolution: true,
		});
	}

	return document.save();
}
