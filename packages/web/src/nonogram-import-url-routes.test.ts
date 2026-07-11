import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Nonogram } from "@remarkable-nonogram-generator/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFileNonogramStore } from "./file-nonogram-store.js";
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

async function fakeImportFn(url: string): Promise<Nonogram> {
	if (!url.startsWith("https://www.nonograms.org/")) {
		throw new Error(`This is not a nonograms.org puzzle URL: ${url}`);
	}
	return sampleNonogram;
}

async function failingImportFn(): Promise<Nonogram> {
	throw new Error("Could not fully solve this puzzle from its clues alone");
}

beforeEach(async () => {
	workDir = await mkdtemp(
		join(tmpdir(), "remarkable-nonogram-web-import-url-routes-test-"),
	);
	nonogramsPath = join(workDir, "nonograms");
	credentialsPath = join(workDir, "credentials.json");
});

afterEach(async () => {
	await rm(workDir, { recursive: true, force: true });
});

describe("POST /api/nonograms/import-url", () => {
	it("creates and persists a nonogram from the imported puzzle URL", async () => {
		const app = buildServer({
			credentialsPath,
			nonogramsPath,
			importNonogramFromUrlFn: fakeImportFn,
		});

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/import-url",
			payload: { url: "https://www.nonograms.org/nonograms/i/81801" },
		});

		expect(response.statusCode).toBe(201);
		const body = response.json();
		expect(body.id).toEqual(expect.any(String));
		expect(body.nonogram).toEqual(sampleNonogram);

		const store = createFileNonogramStore(nonogramsPath);
		const persisted = await store.load(body.id);
		expect(persisted?.nonogram).toEqual(sampleNonogram);
	});

	it("returns 400 with a clear error when the url field is missing", async () => {
		const app = buildServer({
			credentialsPath,
			nonogramsPath,
			importNonogramFromUrlFn: fakeImportFn,
		});

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/import-url",
			payload: {},
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().error).toMatch(/url is required/i);
	});

	it("returns 400 with the pipeline's error message for a non-nonograms.org URL", async () => {
		const app = buildServer({
			credentialsPath,
			nonogramsPath,
			importNonogramFromUrlFn: fakeImportFn,
		});

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/import-url",
			payload: { url: "https://example.com/not-a-puzzle" },
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().error).toMatch(/not a nonograms\.org puzzle url/i);

		const store = createFileNonogramStore(nonogramsPath);
		expect(await store.list()).toEqual([]);
	});

	it("returns 400 with the pipeline's error message when the puzzle can't be turned into a grid", async () => {
		const app = buildServer({
			credentialsPath,
			nonogramsPath,
			importNonogramFromUrlFn: failingImportFn,
		});

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/import-url",
			payload: { url: "https://www.nonograms.org/nonograms/i/81801" },
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().error).toMatch(/could not fully solve/i);

		const store = createFileNonogramStore(nonogramsPath);
		expect(await store.list()).toEqual([]);
	});
});
