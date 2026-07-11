import { extractCluesFromImage, type OcrEngine } from "./nonogram-clue-ocr.js";
import type { Nonogram } from "./nonogram-grid.js";
import { solveNonogramFromClues } from "./nonogram-line-solver.js";

export type SupportedImageImportType = "nonograms.org";

export interface ImportNonogramFromImageOptions {
	readonly width: number;
	readonly height: number;
	readonly ocrEngine?: OcrEngine;
}

export async function importNonogramFromImage(
	imageType: SupportedImageImportType,
	imageBuffer: Uint8Array,
	options: ImportNonogramFromImageOptions,
): Promise<Nonogram> {
	if (imageType !== "nonograms.org") {
		throw new Error(`Unsupported image import type: ${imageType}`);
	}

	const clues = await extractCluesFromImage(imageBuffer, options);
	return solveNonogramFromClues(options.width, options.height, clues);
}
