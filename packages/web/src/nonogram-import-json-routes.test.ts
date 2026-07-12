import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFileNonogramStore } from "./file-nonogram-store.js";
import { buildServer } from "./server.js";

let workDir: string;
let nonogramsPath: string;
let credentialsPath: string;

beforeEach(async () => {
	workDir = await mkdtemp(
		join(tmpdir(), "remarkable-nonogram-web-import-json-routes-test-"),
	);
	nonogramsPath = join(workDir, "nonograms");
	credentialsPath = join(workDir, "credentials.json");
});

afterEach(async () => {
	await rm(workDir, { recursive: true, force: true });
});

describe("POST /api/nonograms/import-json", () => {
	it("creates and persists a nonogram from a well-formed export file", async () => {
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/import-json",
			payload: JSON.stringify({
				name: "Imported puzzle",
				width: 2,
				height: 2,
				cells: [
					[true, false],
					[false, true],
				],
			}),
			headers: { "content-type": "application/json" },
		});

		expect(response.statusCode).toBe(201);
		const body = response.json();
		expect(body.id).toEqual(expect.any(String));
		expect(body.name).toBe("Imported puzzle");
		expect(body.nonogram).toEqual({
			width: 2,
			height: 2,
			cells: [
				[true, false],
				[false, true],
			],
		});

		const store = createFileNonogramStore(nonogramsPath);
		const persisted = await store.load(body.id);
		expect(persisted?.nonogram).toEqual(body.nonogram);
	});

	it("returns 400 with a clear error for a malformed JSON file", async () => {
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/import-json",
			payload: "{ this is not valid json",
			headers: { "content-type": "application/json" },
		});

		expect(response.statusCode).toBe(400);

		const store = createFileNonogramStore(nonogramsPath);
		expect(await store.list()).toEqual([]);
	});

	it("returns 400 with a clear error when cells is missing", async () => {
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/import-json",
			payload: JSON.stringify({ name: "Broken", width: 2, height: 2 }),
			headers: { "content-type": "application/json" },
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().error).toMatch(/cells/i);

		const store = createFileNonogramStore(nonogramsPath);
		expect(await store.list()).toEqual([]);
	});

	it("returns 400 with a clear error when the grid is too large for a reMarkable 2 page", async () => {
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/import-json",
			payload: JSON.stringify({
				name: "Huge",
				width: 9999,
				height: 9999,
				cells: [],
			}),
			headers: { "content-type": "application/json" },
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().error).toMatch(/too large/i);

		const store = createFileNonogramStore(nonogramsPath);
		expect(await store.list()).toEqual([]);
	});
});
