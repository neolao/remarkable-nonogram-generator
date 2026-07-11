export const CORE_VERSION = "0.1.0";

export type { OcrEngine } from "./nonogram-clue-ocr.js";
export { createTesseractOcrEngine } from "./nonogram-clue-ocr.js";
export type { NonogramClues } from "./nonogram-clues.js";
export { computeNonogramClues } from "./nonogram-clues.js";
export type { Nonogram } from "./nonogram-grid.js";
export {
	CLUE_AREA_MARGIN_PX,
	createNonogram,
	MAX_GRID_HEIGHT,
	MAX_GRID_WIDTH,
	MIN_CELL_SIZE_PX,
	REMARKABLE_2_PAGE_HEIGHT_PX,
	REMARKABLE_2_PAGE_WIDTH_PX,
} from "./nonogram-grid.js";
export type {
	ImportNonogramFromImageOptions,
	SupportedImageImportType,
} from "./nonogram-image-import.js";
export { importNonogramFromImage } from "./nonogram-image-import.js";
export { solveNonogramFromClues } from "./nonogram-line-solver.js";
export {
	REMARKABLE_2_PAGE_HEIGHT_PT,
	REMARKABLE_2_PAGE_WIDTH_PT,
	renderNonogramToPdf,
} from "./nonogram-pdf.js";
export type {
	NonogramStore,
	NonogramSummary,
	SavedNonogram,
	SaveNonogramInput,
} from "./nonogram-store.js";
export type { RenderNonogramToSvgOptions } from "./nonogram-svg.js";
export { renderNonogramToSvg } from "./nonogram-svg.js";
export type {
	RemarkableAuthOptions,
	RemarkableSession,
} from "./remarkable-auth.js";
export { authenticate } from "./remarkable-auth.js";
export type {
	CredentialStore,
	RemarkableCredentials,
} from "./remarkable-credential-store.js";
export type { UploadPdfOptions } from "./remarkable-upload.js";
export { uploadPdf } from "./remarkable-upload.js";
export type {
	SendNonogramOptions,
	SendNonogramResult,
} from "./send-nonogram.js";
export { sendNonogramToRemarkable } from "./send-nonogram.js";
