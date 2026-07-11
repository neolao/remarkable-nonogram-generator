import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type {
	NonogramStore,
	NonogramSummary,
	SavedNonogram,
	SaveNonogramInput,
} from "@remarkable-nonogram-generator/core";

export const DEFAULT_NONOGRAMS_DIR = join(
	homedir(),
	".config",
	"remarkable-nonogram-generator",
	"nonograms",
);

const VALID_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

function assertValidId(id: string): void {
	if (!VALID_ID_PATTERN.test(id)) {
		throw new Error(`Invalid nonogram id: ${id}`);
	}
}

function filePathFor(directoryPath: string, id: string): string {
	assertValidId(id);
	return join(directoryPath, `${id}.json`);
}

async function readSavedNonogram(
	filePath: string,
): Promise<SavedNonogram | null> {
	let raw: string;
	try {
		raw = await readFile(filePath, "utf8");
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
		throw error;
	}

	try {
		return JSON.parse(raw) as SavedNonogram;
	} catch (cause) {
		throw new Error(`Corrupted nonogram file: ${filePath}`, { cause });
	}
}

export function createFileNonogramStore(directoryPath: string): NonogramStore {
	return {
		async list(): Promise<NonogramSummary[]> {
			let entries: string[];
			try {
				entries = await readdir(directoryPath);
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
				throw error;
			}

			const jsonFiles = entries.filter((entry) => entry.endsWith(".json"));
			const saved = await Promise.all(
				jsonFiles.map(async (entry) => {
					try {
						return await readSavedNonogram(join(directoryPath, entry));
					} catch (error) {
						if ((error as { cause?: unknown }).cause instanceof SyntaxError) {
							return null;
						}
						throw error;
					}
				}),
			);

			return saved
				.filter((entry): entry is SavedNonogram => entry !== null)
				.map(({ id, name, nonogram, createdAt, updatedAt }) => ({
					id,
					name,
					width: nonogram.width,
					height: nonogram.height,
					createdAt,
					updatedAt,
				}));
		},

		async load(id: string): Promise<SavedNonogram | null> {
			return readSavedNonogram(filePathFor(directoryPath, id));
		},

		async save(input: SaveNonogramInput): Promise<SavedNonogram> {
			const now = new Date().toISOString();
			const existing = input.id
				? await readSavedNonogram(filePathFor(directoryPath, input.id))
				: null;

			const saved: SavedNonogram = {
				id: input.id ?? randomUUID(),
				name: input.name,
				nonogram: input.nonogram,
				createdAt: existing?.createdAt ?? now,
				updatedAt: now,
			};

			await mkdir(directoryPath, { recursive: true });
			await writeFile(
				filePathFor(directoryPath, saved.id),
				JSON.stringify(saved),
			);

			return saved;
		},

		async delete(id: string): Promise<void> {
			try {
				await rm(filePathFor(directoryPath, id));
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
				throw error;
			}
		},
	};
}
