import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Nonogram } from "@remarkable-nonogram-generator/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFileNonogramStore } from "./file-nonogram-store.js";

let workDir: string;

const sampleNonogram: Nonogram = {
	width: 2,
	height: 2,
	cells: [
		[true, false],
		[false, true],
	],
};

beforeEach(async () => {
	workDir = await mkdtemp(
		join(tmpdir(), "remarkable-nonogram-web-store-test-"),
	);
});

afterEach(async () => {
	vi.useRealTimers();
	await rm(workDir, { recursive: true, force: true });
});

describe("createFileNonogramStore", () => {
	it("returns an empty list when the nonograms directory does not exist yet", async () => {
		const store = createFileNonogramStore(join(workDir, "nonograms"));

		await expect(store.list()).resolves.toEqual([]);
	});

	it("creates a JSON file on disk and returns a generated id when saving a new nonogram", async () => {
		const directoryPath = join(workDir, "nonograms");
		const store = createFileNonogramStore(directoryPath);

		const saved = await store.save({
			name: "First puzzle",
			nonogram: sampleNonogram,
		});

		expect(typeof saved.id).toBe("string");
		expect(saved.id.length).toBeGreaterThan(0);
		const stats = await stat(join(directoryPath, `${saved.id}.json`));
		expect(stats.isFile()).toBe(true);
	});

	it("returns the previously saved grid, name, and timestamps unchanged when loading by id", async () => {
		const store = createFileNonogramStore(join(workDir, "nonograms"));

		const saved = await store.save({
			name: "First puzzle",
			nonogram: sampleNonogram,
		});

		await expect(store.load(saved.id)).resolves.toEqual(saved);
	});

	it("lists summaries for all saved nonograms without needing each one loaded individually", async () => {
		const store = createFileNonogramStore(join(workDir, "nonograms"));

		const first = await store.save({
			name: "First puzzle",
			nonogram: sampleNonogram,
		});
		const second = await store.save({
			name: "Second puzzle",
			nonogram: { width: 3, height: 1, cells: [[true, true, false]] },
		});

		const summaries = await store.list();

		expect(summaries).toHaveLength(2);
		expect(summaries).toEqual(
			expect.arrayContaining([
				{
					id: first.id,
					name: "First puzzle",
					width: 2,
					height: 2,
					createdAt: first.createdAt,
					updatedAt: first.updatedAt,
				},
				{
					id: second.id,
					name: "Second puzzle",
					width: 3,
					height: 1,
					createdAt: second.createdAt,
					updatedAt: second.updatedAt,
				},
			]),
		);
	});

	it("returns null when loading an id that does not exist", async () => {
		const store = createFileNonogramStore(join(workDir, "nonograms"));

		await expect(store.load("missing-id")).resolves.toBeNull();
	});

	it("preserves the original createdAt but updates updatedAt when saving over an existing id", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
		const store = createFileNonogramStore(join(workDir, "nonograms"));

		const created = await store.save({
			name: "First puzzle",
			nonogram: sampleNonogram,
		});

		vi.setSystemTime(new Date("2026-01-02T00:00:00.000Z"));
		const updated = await store.save({
			id: created.id,
			name: "First puzzle renamed",
			nonogram: sampleNonogram,
		});

		expect(updated.createdAt).toBe("2026-01-01T00:00:00.000Z");
		expect(updated.updatedAt).toBe("2026-01-02T00:00:00.000Z");
		expect(updated.name).toBe("First puzzle renamed");
	});

	it("removes the file so it no longer appears in listing or load results after deleting", async () => {
		const store = createFileNonogramStore(join(workDir, "nonograms"));
		const saved = await store.save({
			name: "First puzzle",
			nonogram: sampleNonogram,
		});

		await store.delete(saved.id);

		await expect(store.load(saved.id)).resolves.toBeNull();
		await expect(store.list()).resolves.toEqual([]);
	});

	it("does nothing when deleting an id that does not exist", async () => {
		const store = createFileNonogramStore(join(workDir, "nonograms"));

		await expect(store.delete("missing-id")).resolves.toBeUndefined();
	});

	it("skips a corrupted JSON file when listing instead of failing the whole listing", async () => {
		const directoryPath = join(workDir, "nonograms");
		const store = createFileNonogramStore(directoryPath);
		const saved = await store.save({
			name: "First puzzle",
			nonogram: sampleNonogram,
		});
		await mkdir(directoryPath, { recursive: true });
		await writeFile(join(directoryPath, "corrupt.json"), "{ not valid json");

		const summaries = await store.list();

		expect(summaries).toEqual([
			{
				id: saved.id,
				name: "First puzzle",
				width: 2,
				height: 2,
				createdAt: saved.createdAt,
				updatedAt: saved.updatedAt,
			},
		]);
	});

	it("reports the corrupted file path when loading a nonogram with invalid JSON", async () => {
		const directoryPath = join(workDir, "nonograms");
		const store = createFileNonogramStore(directoryPath);
		await mkdir(directoryPath, { recursive: true });
		const corruptFilePath = join(directoryPath, "corrupt-id.json");
		await writeFile(corruptFilePath, "{ not valid json");

		await expect(store.load("corrupt-id")).rejects.toThrow(corruptFilePath);
	});

	it("rejects an id containing path separators to prevent escaping the store directory", async () => {
		const directoryPath = join(workDir, "nonograms");
		const store = createFileNonogramStore(directoryPath);
		const outsideFile = join(workDir, "secret.json");
		await writeFile(outsideFile, JSON.stringify({ secret: true }));

		await expect(store.load("../secret")).rejects.toThrow(
			/invalid nonogram id/i,
		);
		await expect(store.delete("../secret")).rejects.toThrow(
			/invalid nonogram id/i,
		);
		await expect(
			store.save({ id: "../evil", name: "x", nonogram: sampleNonogram }),
		).rejects.toThrow(/invalid nonogram id/i);

		await expect(stat(outsideFile)).resolves.toBeDefined();
	});
});
