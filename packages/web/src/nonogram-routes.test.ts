import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Nonogram } from "@remarkable-nonogram-generator/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFileNonogramStore } from "./nonogram-store.js";
import { buildServer } from "./server.js";

let workDir: string;
let nonogramsPath: string;
let credentialsPath: string;

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
		join(tmpdir(), "remarkable-nonogram-web-nonogram-routes-test-"),
	);
	nonogramsPath = join(workDir, "nonograms");
	credentialsPath = join(workDir, "credentials.json");
});

afterEach(async () => {
	await rm(workDir, { recursive: true, force: true });
});

describe("GET /api/nonograms", () => {
	it("returns 200 with an empty array when no nonograms are saved", async () => {
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({ method: "GET", url: "/api/nonograms" });

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual([]);
	});

	it("returns id, name, width, height, and updatedAt for each saved nonogram", async () => {
		const store = createFileNonogramStore(nonogramsPath);
		const first = await store.save({
			name: "First puzzle",
			nonogram: sampleNonogram,
		});
		const second = await store.save({
			name: "Second puzzle",
			nonogram: { width: 3, height: 1, cells: [[true, true, false]] },
		});
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({ method: "GET", url: "/api/nonograms" });

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(
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

	it("does not include the full cell grid in the listing response", async () => {
		const store = createFileNonogramStore(nonogramsPath);
		await store.save({ name: "First puzzle", nonogram: sampleNonogram });
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({ method: "GET", url: "/api/nonograms" });

		const [summary] = response.json();
		expect(summary.nonogram).toBeUndefined();
		expect(summary.cells).toBeUndefined();
	});
});
