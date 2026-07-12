import { createNonogram, type Nonogram } from "./nonogram-grid.js";

export interface NonogramExport {
	readonly name: string;
	readonly width: number;
	readonly height: number;
	readonly cells: ReadonlyArray<ReadonlyArray<boolean>>;
}

export interface NonogramImportResult {
	readonly name: string;
	readonly nonogram: Nonogram;
}

export function serializeNonogramExport(
	name: string,
	nonogram: Nonogram,
): NonogramExport {
	return {
		name,
		width: nonogram.width,
		height: nonogram.height,
		cells: nonogram.cells,
	};
}

export function parseNonogramImport(data: unknown): NonogramImportResult {
	if (typeof data !== "object" || data === null) {
		throw new Error("Imported file must be a JSON object");
	}

	const { name, width, height, cells } = data as Record<string, unknown>;

	if (!Array.isArray(cells)) {
		throw new Error("Imported file must include a cells grid");
	}

	const nonogram = createNonogram(
		width as number,
		height as number,
		cells as boolean[][],
	);

	return { name: typeof name === "string" ? name : "", nonogram };
}
