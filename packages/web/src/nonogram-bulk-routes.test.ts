import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { unzipSync, zipSync } from "fflate";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFileNonogramStore } from "./file-nonogram-store.js";
import { buildServer } from "./server.js";

let workDir: string;
let nonogramsPath: string;
let credentialsPath: string;

beforeEach(async () => {
	workDir = await mkdtemp(
		join(tmpdir(), "remarkable-nonogram-web-bulk-routes-test-"),
	);
	nonogramsPath = join(workDir, "nonograms");
	credentialsPath = join(workDir, "credentials.json");
});

afterEach(async () => {
	await rm(workDir, { recursive: true, force: true });
});

describe("GET /api/nonograms/export-all", () => {
	it("returns a zip archive containing every saved nonogram as a JSON export", async () => {
		const store = createFileNonogramStore(nonogramsPath);
		await store.save({
			name: "Cat",
			nonogram: { width: 2, height: 1, cells: [[true, false]] },
		});
		await store.save({
			name: "Dog",
			nonogram: { width: 1, height: 2, cells: [[true], [false]] },
		});
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "GET",
			url: "/api/nonograms/export-all",
		});

		expect(response.statusCode).toBe(200);
		expect(response.headers["content-type"]).toBe("application/zip");
		expect(response.headers["content-disposition"]).toMatch(
			/attachment; filename=".*\.zip"/,
		);

		const unzipped = unzipSync(response.rawPayload);
		const exported = Object.values(unzipped)
			.map((bytes) => JSON.parse(Buffer.from(bytes).toString("utf-8")))
			.sort((a, b) => a.name.localeCompare(b.name));

		expect(exported).toEqual([
			{ name: "Cat", width: 2, height: 1, cells: [[true, false]] },
			{ name: "Dog", width: 1, height: 2, cells: [[true], [false]] },
		]);
	});

	it("returns a valid empty zip archive when there are no saved nonograms", async () => {
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "GET",
			url: "/api/nonograms/export-all",
		});

		expect(response.statusCode).toBe(200);
		expect(Object.keys(unzipSync(response.rawPayload))).toHaveLength(0);
	});
});

describe("POST /api/nonograms/import-zip", () => {
	it("creates and persists a new saved nonogram for every valid entry in the archive", async () => {
		const archive = zipSync({
			"1-cat.json": new TextEncoder().encode(
				JSON.stringify({
					name: "Cat",
					width: 2,
					height: 1,
					cells: [[true, false]],
				}),
			),
			"2-dog.json": new TextEncoder().encode(
				JSON.stringify({
					name: "Dog",
					width: 1,
					height: 2,
					cells: [[true], [false]],
				}),
			),
		});
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/import-zip",
			payload: Buffer.from(archive),
			headers: { "content-type": "application/zip" },
		});

		expect(response.statusCode).toBe(201);
		const body = response.json();
		expect(body.created).toHaveLength(2);
		expect(body.errors).toEqual([]);

		const store = createFileNonogramStore(nonogramsPath);
		const saved = await store.list();
		expect(saved.map((s) => s.name).sort()).toEqual(["Cat", "Dog"]);
	});

	it("imports the valid entries and reports the invalid ones instead of failing the whole archive", async () => {
		const archive = zipSync({
			"good.json": new TextEncoder().encode(
				JSON.stringify({
					name: "Good",
					width: 1,
					height: 1,
					cells: [[true]],
				}),
			),
			"bad.json": new TextEncoder().encode(
				JSON.stringify({ name: "Bad", width: 2, height: 2, cells: [[true]] }),
			),
			"readme.txt": new TextEncoder().encode("not a nonogram"),
		});
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/import-zip",
			payload: Buffer.from(archive),
			headers: { "content-type": "application/zip" },
		});

		expect(response.statusCode).toBe(201);
		const body = response.json();
		expect(body.created).toHaveLength(1);
		expect(body.created[0].name).toBe("Good");
		expect(body.errors).toEqual([
			{ fileName: "bad.json", error: expect.any(String) },
			{ fileName: "readme.txt", error: expect.any(String) },
		]);

		const store = createFileNonogramStore(nonogramsPath);
		expect((await store.list()).map((s) => s.name)).toEqual(["Good"]);
	});

	it("returns 400 with a clear error when the uploaded file is not a valid zip", async () => {
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/import-zip",
			payload: Buffer.from("this is definitely not a zip"),
			headers: { "content-type": "application/zip" },
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().error).toMatch(/not a valid zip archive/i);

		const store = createFileNonogramStore(nonogramsPath);
		expect(await store.list()).toEqual([]);
	});

	it("always creates new saved nonograms rather than overwriting an existing one with the same name", async () => {
		const store = createFileNonogramStore(nonogramsPath);
		await store.save({
			name: "Cat",
			nonogram: { width: 1, height: 1, cells: [[true]] },
		});
		const archive = zipSync({
			"cat.json": new TextEncoder().encode(
				JSON.stringify({
					name: "Cat",
					width: 1,
					height: 1,
					cells: [[false]],
				}),
			),
		});
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/import-zip",
			payload: Buffer.from(archive),
			headers: { "content-type": "application/zip" },
		});

		expect(response.statusCode).toBe(201);
		const saved = await store.list();
		expect(saved.filter((s) => s.name === "Cat")).toHaveLength(2);
	});
});
