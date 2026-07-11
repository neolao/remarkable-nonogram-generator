import { PNG } from "pngjs";
import { createWorker, PSM } from "tesseract.js";
import type { NonogramClues } from "./nonogram-clues.js";

export interface OcrEngine {
	recognizeDigits(imageRegion: Uint8Array): Promise<string>;
	terminate(): Promise<void>;
}

export interface ExtractCluesFromImageOptions {
	readonly width: number;
	readonly height: number;
	readonly ocrEngine?: OcrEngine;
}

interface LineBounds {
	readonly start: number;
	readonly end: number;
}

// A row/column is treated as a full-length gridline once this fraction of
// its pixels are darker than DARK_PIXEL_LUMINANCE_THRESHOLD.
const DARK_LINE_RATIO_THRESHOLD = 0.9;
const DARK_PIXEL_LUMINANCE_THRESHOLD = 200;
// Clue-number slot crops are upscaled by this factor before OCR - measured
// to noticeably improve tesseract's accuracy on glyphs this small.
const OCR_UPSCALE_FACTOR = 4;

export async function extractCluesFromImage(
	imageBuffer: Uint8Array,
	options: ExtractCluesFromImageOptions,
): Promise<NonogramClues> {
	const { width, height } = options;
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

	const png = decodePng(imageBuffer);
	const columnBounds = findLineBounds(scanColumns(png), width + 1);
	const rowBounds = findLineBounds(scanRows(png), height + 1);

	const cellWidthPx = (columnBounds.end - columnBounds.start) / width;
	const cellHeightPx = (rowBounds.end - rowBounds.start) / height;
	// Clue numbers are printed in a margin subdivided into grid-aligned
	// slots (one per potential number), right-aligned toward the grid -
	// e.g. a row needing only 2 numbers leaves its leftmost slots blank.
	const numRowSlots = Math.round(columnBounds.start / cellWidthPx);
	const numColumnSlots = Math.round(rowBounds.start / cellHeightPx);
	// Slots tile the margin's actual pixel span exactly (not a multiple of
	// cellWidthPx/cellHeightPx, which can overshoot into the grid's own
	// border on the slot closest to it and cause a false digit read there).
	const rowSlotWidthPx = columnBounds.start / numRowSlots;
	const columnSlotHeightPx = rowBounds.start / numColumnSlots;

	const engine = options.ocrEngine ?? createTesseractOcrEngine();
	const ownsEngine = options.ocrEngine === undefined;

	try {
		const rowClues: number[][] = [];
		for (let row = 0; row < height; row++) {
			const top = Math.round(rowBounds.start + row * cellHeightPx);
			const bottom = Math.round(rowBounds.start + (row + 1) * cellHeightPx);
			const values: number[] = [];
			for (let slot = 0; slot < numRowSlots; slot++) {
				const left = Math.round(slot * rowSlotWidthPx);
				const right = Math.round((slot + 1) * rowSlotWidthPx);
				const crop = cropRegion(png, left, top, right - left, bottom - top);
				const value = await recognizeSlotValue(engine, crop);
				if (value !== null) values.push(value);
			}
			rowClues.push(values.length > 0 ? values : [0]);
		}

		const columnClues: number[][] = [];
		for (let col = 0; col < width; col++) {
			const left = Math.round(columnBounds.start + col * cellWidthPx);
			const right = Math.round(columnBounds.start + (col + 1) * cellWidthPx);
			const values: number[] = [];
			for (let slot = 0; slot < numColumnSlots; slot++) {
				const top = Math.round(slot * columnSlotHeightPx);
				const bottom = Math.round((slot + 1) * columnSlotHeightPx);
				const crop = cropRegion(png, left, top, right - left, bottom - top);
				const value = await recognizeSlotValue(engine, crop);
				if (value !== null) values.push(value);
			}
			columnClues.push(values.length > 0 ? values : [0]);
		}

		return { rowClues, columnClues };
	} finally {
		if (ownsEngine) await engine.terminate();
	}
}

export function createTesseractOcrEngine(): OcrEngine {
	let workerPromise: ReturnType<typeof createWorker> | null = null;

	async function getWorker() {
		if (!workerPromise) {
			workerPromise = createWorker("eng").then(async (worker) => {
				await worker.setParameters({
					tessedit_char_whitelist: "0123456789",
					// Each crop is a single grid-aligned slot holding at most
					// one (possibly multi-digit) clue number.
					tessedit_pageseg_mode: PSM.SINGLE_LINE,
				});
				return worker;
			});
		}
		return workerPromise;
	}

	return {
		async recognizeDigits(imageRegion: Uint8Array): Promise<string> {
			const worker = await getWorker();
			// Clue-number slots are tiny (well under 30px tall); upscaling
			// measurably improves tesseract's accuracy on glyphs this small.
			const upscaled = upscalePng(
				PNG.sync.read(Buffer.from(imageRegion)),
				OCR_UPSCALE_FACTOR,
			);
			const {
				data: { text },
			} = await worker.recognize(Buffer.from(PNG.sync.write(upscaled)));
			return text;
		},
		async terminate(): Promise<void> {
			if (workerPromise) {
				const worker = await workerPromise;
				await worker.terminate();
			}
		},
	};
}

// Returns the recognized number for a single clue-number slot, or null if
// the slot is blank (a line using fewer than the maximum slot count).
async function recognizeSlotValue(
	engine: OcrEngine,
	crop: Uint8Array,
): Promise<number | null> {
	const text = await engine.recognizeDigits(crop);
	const match = text.match(/\d+/);
	return match ? Number(match[0]) : null;
}

function cropRegion(
	png: PNG,
	x: number,
	y: number,
	width: number,
	height: number,
): Uint8Array {
	const crop = new PNG({ width, height });
	for (let row = 0; row < height; row++) {
		for (let col = 0; col < width; col++) {
			const srcIdx = (png.width * (y + row) + (x + col)) << 2;
			const dstIdx = (width * row + col) << 2;
			crop.data[dstIdx] = png.data[srcIdx];
			crop.data[dstIdx + 1] = png.data[srcIdx + 1];
			crop.data[dstIdx + 2] = png.data[srcIdx + 2];
			crop.data[dstIdx + 3] = png.data[srcIdx + 3];
		}
	}
	return new Uint8Array(PNG.sync.write(crop));
}

function upscalePng(source: PNG, factor: number): PNG {
	const width = source.width * factor;
	const height = source.height * factor;
	const scaled = new PNG({ width, height });
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const srcIdx =
				(source.width * Math.floor(y / factor) + Math.floor(x / factor)) << 2;
			const dstIdx = (width * y + x) << 2;
			scaled.data[dstIdx] = source.data[srcIdx];
			scaled.data[dstIdx + 1] = source.data[srcIdx + 1];
			scaled.data[dstIdx + 2] = source.data[srcIdx + 2];
			scaled.data[dstIdx + 3] = source.data[srcIdx + 3];
		}
	}
	return scaled;
}

function decodePng(imageBuffer: Uint8Array): PNG {
	try {
		return PNG.sync.read(Buffer.from(imageBuffer));
	} catch (cause) {
		throw new Error("Could not decode image: not a valid PNG", { cause });
	}
}

function pixelLuminance(png: PNG, x: number, y: number): number {
	const idx = (png.width * y + x) << 2;
	return (png.data[idx] + png.data[idx + 1] + png.data[idx + 2]) / 3;
}

function scanColumns(png: PNG): number[] {
	const strongColumns: number[] = [];
	for (let x = 0; x < png.width; x++) {
		let darkCount = 0;
		for (let y = 0; y < png.height; y++) {
			if (pixelLuminance(png, x, y) < DARK_PIXEL_LUMINANCE_THRESHOLD) {
				darkCount++;
			}
		}
		if (darkCount / png.height > DARK_LINE_RATIO_THRESHOLD) {
			strongColumns.push(x);
		}
	}
	return strongColumns;
}

function scanRows(png: PNG): number[] {
	const strongRows: number[] = [];
	for (let y = 0; y < png.height; y++) {
		let darkCount = 0;
		for (let x = 0; x < png.width; x++) {
			if (pixelLuminance(png, x, y) < DARK_PIXEL_LUMINANCE_THRESHOLD) {
				darkCount++;
			}
		}
		if (darkCount / png.width > DARK_LINE_RATIO_THRESHOLD) {
			strongRows.push(y);
		}
	}
	return strongRows;
}

// Groups adjacent indices (anti-aliased lines can span more than one
// pixel) into a single representative position per line.
function clusterAdjacentIndices(indices: number[]): number[] {
	const clusters: number[] = [];
	let currentCluster: number[] = [];

	for (const index of indices) {
		const last = currentCluster[currentCluster.length - 1];
		if (currentCluster.length === 0 || index - last <= 1) {
			currentCluster.push(index);
		} else {
			clusters.push(average(currentCluster));
			currentCluster = [index];
		}
	}
	if (currentCluster.length > 0) {
		clusters.push(average(currentCluster));
	}
	return clusters;
}

function average(values: number[]): number {
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// The grid itself always needs exactly `expectedLineCount` (width+1 or
// height+1) evenly-spaced gridlines. Any earlier detected lines are the
// image's outer frame and/or clue margin decoration, not part of the grid -
// so the grid's own lines are the last `expectedLineCount` clusters found.
function findLineBounds(
	strongIndices: number[],
	expectedLineCount: number,
): LineBounds {
	const clusters = clusterAdjacentIndices(strongIndices);
	if (clusters.length < expectedLineCount) {
		throw new Error(
			"Could not detect a grid border in this image; is this a nonograms.org-style image?",
		);
	}

	const gridLines = clusters.slice(-expectedLineCount);
	return { start: gridLines[0], end: gridLines[gridLines.length - 1] };
}
