export const CORE_VERSION = "0.1.0";

export type {
	NonogramStore,
	NonogramSummary,
	SavedNonogram,
	SaveNonogramInput,
} from "./application/nonogram-store.js";
export type { ImportNonogramFromUrlOptions } from "./application/nonogram-url-import.js";
export { importNonogramFromUrl } from "./application/nonogram-url-import.js";
export type {
	CredentialStore,
	RemarkableCredentials,
} from "./application/remarkable-credential-store.js";
export type {
	SendNonogramOptions,
	SendNonogramResult,
} from "./application/send-nonogram.js";
export { sendNonogramToRemarkable } from "./application/send-nonogram.js";
export type { NonogramClues } from "./domain/nonogram-clues.js";
export { computeNonogramClues } from "./domain/nonogram-clues.js";
export type { Nonogram } from "./domain/nonogram-grid.js";
export {
	CLUE_AREA_MARGIN_PX,
	createNonogram,
	MAX_GRID_HEIGHT,
	MAX_GRID_WIDTH,
	MIN_CELL_SIZE_PX,
	REMARKABLE_2_PAGE_HEIGHT_PX,
	REMARKABLE_2_PAGE_WIDTH_PX,
} from "./domain/nonogram-grid.js";
export type {
	NonogramExport,
	NonogramImportResult,
} from "./domain/nonogram-json-transfer.js";
export {
	parseNonogramImport,
	serializeNonogramExport,
} from "./domain/nonogram-json-transfer.js";
export { solveNonogramFromClues } from "./domain/nonogram-line-solver.js";
export type { PageRenderer } from "./infrastructure/nonogram-page-clues.js";
export { createPuppeteerPageRenderer } from "./infrastructure/nonogram-page-clues.js";
export {
	REMARKABLE_2_PAGE_HEIGHT_PT,
	REMARKABLE_2_PAGE_WIDTH_PT,
	renderNonogramToPdf,
} from "./infrastructure/nonogram-pdf.js";
export type { RenderNonogramToSvgOptions } from "./infrastructure/nonogram-svg.js";
export { renderNonogramToSvg } from "./infrastructure/nonogram-svg.js";
export type {
	RemarkableAuthOptions,
	RemarkableSession,
} from "./infrastructure/remarkable-auth.js";
export { authenticate } from "./infrastructure/remarkable-auth.js";
export type { UploadPdfOptions } from "./infrastructure/remarkable-upload.js";
export { uploadPdf } from "./infrastructure/remarkable-upload.js";
