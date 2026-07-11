import type { Nonogram } from "./nonogram-grid.js";
import { solveNonogramFromClues } from "./nonogram-line-solver.js";
import {
	extractCluesFromPage,
	type PageRenderer,
} from "./nonogram-page-clues.js";

export interface ImportNonogramFromUrlOptions {
	readonly pageRenderer?: PageRenderer;
}

export async function importNonogramFromUrl(
	url: string,
	options: ImportNonogramFromUrlOptions = {},
): Promise<Nonogram> {
	const { width, height, clues } = await extractCluesFromPage(
		url,
		options.pageRenderer,
	);
	return solveNonogramFromClues(width, height, clues);
}
