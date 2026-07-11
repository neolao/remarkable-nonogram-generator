import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { extractCluesFromImage, type OcrEngine } from "./nonogram-clue-ocr.js";

interface FixtureOptions {
	readonly cellSizePx: number;
	readonly marginPx: number;
}

const DEFAULT_FIXTURE_OPTIONS: FixtureOptions = {
	cellSizePx: 12,
	marginPx: 30,
};

/**
 * Builds a synthetic PNG matching the "nonograms.org" print layout's
 * geometry: an outer frame line, a blank clue margin, then a bordered grid
 * with full-length gridlines. The margin content itself is left blank -
 * these fixtures only need to exercise the crop-region/geometry logic,
 * since OCR itself is a fake in these tests.
 */
function buildPrintLayoutFixturePng(
	width: number,
	height: number,
	options: FixtureOptions = DEFAULT_FIXTURE_OPTIONS,
): Uint8Array {
	const { cellSizePx, marginPx } = options;
	// +1 so the closing gridline at the grid's right/bottom edge (position
	// marginPx + n*cellSizePx) falls on a valid pixel column/row.
	const imageWidth = marginPx + width * cellSizePx + 1;
	const imageHeight = marginPx + height * cellSizePx + 1;

	const png = new PNG({ width: imageWidth, height: imageHeight });

	const setPixel = (x: number, y: number, luminance: number) => {
		const idx = (imageWidth * y + x) << 2;
		png.data[idx] = luminance;
		png.data[idx + 1] = luminance;
		png.data[idx + 2] = luminance;
		png.data[idx + 3] = 255;
	};

	for (let y = 0; y < imageHeight; y++) {
		for (let x = 0; x < imageWidth; x++) {
			setPixel(x, y, 255);
		}
	}
	for (let y = 0; y < imageHeight; y++) {
		setPixel(0, y, 0);
	}
	for (let x = 0; x < imageWidth; x++) {
		setPixel(x, 0, 0);
	}
	for (let col = 0; col <= width; col++) {
		const x = marginPx + col * cellSizePx;
		for (let y = 0; y < imageHeight; y++) {
			setPixel(x, y, 0);
		}
	}
	for (let row = 0; row <= height; row++) {
		const y = marginPx + row * cellSizePx;
		for (let x = 0; x < imageWidth; x++) {
			setPixel(x, y, 0);
		}
	}

	return new Uint8Array(PNG.sync.write(png));
}

function buildSolidColorPng(width: number, height: number): Uint8Array {
	const png = new PNG({ width, height });
	for (let i = 0; i < png.data.length; i += 4) {
		png.data[i] = 255;
		png.data[i + 1] = 255;
		png.data[i + 2] = 255;
		png.data[i + 3] = 255;
	}
	return new Uint8Array(PNG.sync.write(png));
}

/**
 * A fake OcrEngine that returns canned responses in call order. Clue
 * numbers are read one grid-aligned slot at a time (see nonogram-clue-ocr.ts),
 * left-to-right per row then top-to-bottom per column, so callers list
 * responses in that same order - one entry per slot, "" for a blank slot.
 */
function createFakeOcrEngine(responses: string[]): OcrEngine {
	let callIndex = 0;
	return {
		async recognizeDigits(): Promise<string> {
			const response = responses[callIndex];
			callIndex += 1;
			return response ?? "";
		},
		async terminate(): Promise<void> {},
	};
}

describe("extractCluesFromImage", () => {
	it("reads each row's and column's clue numbers from their grid-aligned slots, right-aligned toward the grid", async () => {
		// 2x2 grid with marginPx=30, cellSizePx=12 -> 3 slots per margin.
		// Row0: slots ["", "2", "1"] -> [2, 1]. Row1: fully blank -> [0].
		// Col0: slots ["", "", "1"] -> [1]. Col1: slots ["", "3", "2"] -> [3, 2].
		const responses = [
			"",
			"2",
			"1", // row 0
			"",
			"",
			"", // row 1
			"",
			"",
			"1", // col 0
			"",
			"3",
			"2", // col 1
		];
		const engine = createFakeOcrEngine(responses);
		const image = buildPrintLayoutFixturePng(2, 2);

		const clues = await extractCluesFromImage(image, {
			width: 2,
			height: 2,
			ocrEngine: engine,
		});

		expect(clues.rowClues).toEqual([[2, 1], [0]]);
		expect(clues.columnClues).toEqual([[1], [3, 2]]);
	});

	it("reads a multi-digit number recognized within a single slot as one clue value, not split per digit", async () => {
		const responses = ["", "", "14", "", "", "12", "", "", "1", "", "", "1"];
		const engine = createFakeOcrEngine(responses);
		const image = buildPrintLayoutFixturePng(2, 2);

		const clues = await extractCluesFromImage(image, {
			width: 2,
			height: 2,
			ocrEngine: engine,
		});

		expect(clues.rowClues).toEqual([[14], [12]]);
		expect(clues.columnClues).toEqual([[1], [1]]);
	});

	it("treats a line whose slots all recognize as blank as the empty-line clue [0]", async () => {
		const responses = new Array(12).fill("");
		const engine = createFakeOcrEngine(responses);
		const image = buildPrintLayoutFixturePng(2, 2);

		const clues = await extractCluesFromImage(image, {
			width: 2,
			height: 2,
			ocrEngine: engine,
		});

		expect(clues.rowClues).toEqual([[0], [0]]);
		expect(clues.columnClues).toEqual([[0], [0]]);
	});

	it("throws a clear error when the buffer is not a valid PNG", async () => {
		const engine = createFakeOcrEngine([]);
		const notAPng = new Uint8Array([1, 2, 3, 4, 5]);

		await expect(
			extractCluesFromImage(notAPng, {
				width: 2,
				height: 2,
				ocrEngine: engine,
			}),
		).rejects.toThrow(/not a valid png/i);
	});

	it("throws a clear error when no grid border can be detected in the image", async () => {
		const engine = createFakeOcrEngine([]);
		const image = buildSolidColorPng(50, 50);

		await expect(
			extractCluesFromImage(image, {
				width: 2,
				height: 2,
				ocrEngine: engine,
			}),
		).rejects.toThrow(/could not detect a grid border/i);
	});

	it("throws a clear validation error when width or height is not a positive integer", async () => {
		const engine = createFakeOcrEngine([]);
		const image = buildPrintLayoutFixturePng(2, 2);

		await expect(
			extractCluesFromImage(image, {
				width: 0,
				height: 2,
				ocrEngine: engine,
			}),
		).rejects.toThrow(/positive integer/i);
	});
});
