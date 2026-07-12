import { unzipSync, zipSync } from "fflate";
import type { Nonogram } from "../domain/nonogram-grid.js";
import {
	parseNonogramImport,
	serializeNonogramExport,
} from "../domain/nonogram-json-transfer.js";

export interface NonogramArchiveEntry {
	readonly name: string;
	readonly nonogram: Nonogram;
}

// Caps the work a single import-zip request can trigger (one store.save()
// call per entry, processed sequentially) regardless of how large an
// uploaded archive claims to be.
export const MAX_ARCHIVE_ENTRIES = 500;

export type NonogramArchiveParseResult =
	| { ok: true; fileName: string; name: string; nonogram: Nonogram }
	| { ok: false; fileName: string; error: string };

function archiveFileName(name: string, index: number): string {
	const slug = name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return `${index + 1}-${slug || "nonogram"}.json`;
}

export function createNonogramArchive(
	entries: ReadonlyArray<NonogramArchiveEntry>,
): Uint8Array {
	const files: Record<string, Uint8Array> = {};
	entries.forEach((entry, index) => {
		const exportData = serializeNonogramExport(entry.name, entry.nonogram);
		files[archiveFileName(entry.name, index)] = new TextEncoder().encode(
			JSON.stringify(exportData),
		);
	});
	return zipSync(files);
}

export function parseNonogramArchive(
	data: Uint8Array,
): NonogramArchiveParseResult[] {
	let files: Record<string, Uint8Array>;
	try {
		files = unzipSync(data);
	} catch (error) {
		throw new Error("The uploaded file is not a valid zip archive", {
			cause: error,
		});
	}

	const entries = Object.entries(files);
	if (entries.length > MAX_ARCHIVE_ENTRIES) {
		throw new Error(
			`The uploaded archive has too many files (max ${MAX_ARCHIVE_ENTRIES})`,
		);
	}

	const decoder = new TextDecoder();
	return entries.map(([fileName, fileBytes]) => {
		if (!fileName.toLowerCase().endsWith(".json")) {
			return {
				ok: false,
				fileName,
				error: `File "${fileName}" is not a .json file`,
			};
		}

		try {
			const parsed = JSON.parse(decoder.decode(fileBytes));
			const { name, nonogram } = parseNonogramImport(parsed);
			return { ok: true, fileName, name, nonogram };
		} catch (error) {
			return { ok: false, fileName, error: (error as Error).message };
		}
	});
}
