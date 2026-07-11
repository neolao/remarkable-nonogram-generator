import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import type { OcrEngine } from "./nonogram-clue-ocr.js";
import { importNonogramFromImage } from "./nonogram-image-import.js";

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
 * geometry (see nonogram-clue-ocr.test.ts for the same fixture). Only the
 * geometry matters here since OCR is faked.
 */
function buildPrintLayoutFixturePng(
	width: number,
	height: number,
	options: FixtureOptions = DEFAULT_FIXTURE_OPTIONS,
): Uint8Array {
	const { cellSizePx, marginPx } = options;
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

describe("importNonogramFromImage", () => {
	it("reconstructs the nonogram whose cross-referenced row/column clues match those read from the image", async () => {
		// A T-tetromino: cells [[T,T,T],[F,T,F],[F,T,F]] -> row clues
		// [[3],[1],[1]], column clues [[1],[3],[1]]. 3x3 grid with the
		// default fixture -> 3 slots per margin, right-aligned.
		const responses = [
			"",
			"",
			"3", // row 0
			"",
			"",
			"1", // row 1
			"",
			"",
			"1", // row 2
			"",
			"",
			"1", // col 0
			"",
			"",
			"3", // col 1
			"",
			"",
			"1", // col 2
		];
		const engine = createFakeOcrEngine(responses);
		const image = buildPrintLayoutFixturePng(3, 3);

		const nonogram = await importNonogramFromImage("nonograms.org", image, {
			width: 3,
			height: 3,
			ocrEngine: engine,
		});

		expect(nonogram.width).toBe(3);
		expect(nonogram.height).toBe(3);
		expect(nonogram.cells).toEqual([
			[true, true, true],
			[false, true, false],
			[false, true, false],
		]);
	});

	it("reconstructs a minimal 1x1 grid with a single filled cell", async () => {
		// 3 slots per margin (default fixture): clue [1] -> right-aligned.
		const responses = ["", "", "1", "", "", "1"];
		const engine = createFakeOcrEngine(responses);
		const image = buildPrintLayoutFixturePng(1, 1);

		const nonogram = await importNonogramFromImage("nonograms.org", image, {
			width: 1,
			height: 1,
			ocrEngine: engine,
		});

		expect(nonogram.cells).toEqual([[true]]);
	});

	it("reconstructs an entirely empty grid when every clue reads as blank", async () => {
		const responses = new Array(12).fill("");
		const engine = createFakeOcrEngine(responses);
		const image = buildPrintLayoutFixturePng(2, 2);

		const nonogram = await importNonogramFromImage("nonograms.org", image, {
			width: 2,
			height: 2,
			ocrEngine: engine,
		});

		expect(nonogram.cells).toEqual([
			[false, false],
			[false, false],
		]);
	});

	it("throws when the image type is not supported", async () => {
		const engine = createFakeOcrEngine([]);
		const image = buildPrintLayoutFixturePng(1, 1);

		await expect(
			importNonogramFromImage(
				// biome-ignore lint/suspicious/noExplicitAny: exercising an invalid type on purpose
				"unknown-type" as any,
				image,
				{ width: 1, height: 1, ocrEngine: engine },
			),
		).rejects.toThrow(/unsupported image import type/i);
	});

	it("propagates a clear error when the read clues can't be fully solved by logic alone", async () => {
		// Classic ambiguous 2x2 case (both diagonals satisfy the clues).
		// 3 slots per margin (default fixture): row/col clue [1] -> right-aligned.
		const responses = [
			"",
			"",
			"1", // row 0
			"",
			"",
			"1", // row 1
			"",
			"",
			"1", // col 0
			"",
			"",
			"1", // col 1
		];
		const engine = createFakeOcrEngine(responses);
		const image = buildPrintLayoutFixturePng(2, 2);

		await expect(
			importNonogramFromImage("nonograms.org", image, {
				width: 2,
				height: 2,
				ocrEngine: engine,
			}),
		).rejects.toThrow(/could not fully solve/i);
	});

	it("throws a clear validation error when width or height is not a positive integer", async () => {
		const engine = createFakeOcrEngine([]);
		const image = buildPrintLayoutFixturePng(1, 1);

		await expect(
			importNonogramFromImage("nonograms.org", image, {
				width: 0,
				height: 1,
				ocrEngine: engine,
			}),
		).rejects.toThrow(/positive integer/i);
	});
});
