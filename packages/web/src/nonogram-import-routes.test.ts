import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Nonogram } from "@remarkable-nonogram-generator/core";
import FormData from "form-data";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFileNonogramStore } from "./file-nonogram-store.js";
import { buildServer } from "./server.js";

let workDir: string;
let nonogramsPath: string;
let credentialsPath: string;

const fakeImage = Buffer.from([1, 2, 3, 4]);

const sampleNonogram: Nonogram = {
	width: 2,
	height: 2,
	cells: [
		[true, false],
		[false, true],
	],
};

async function fakeImportFn(
	imageType: string,
	_imageBuffer: Uint8Array,
	options: { width: number; height: number },
): Promise<Nonogram> {
	if (imageType !== "nonograms.org") {
		throw new Error(`Unsupported image import type: ${imageType}`);
	}
	if (!Number.isInteger(options.width) || !Number.isInteger(options.height)) {
		throw new Error(
			`Nonogram width and height must be positive integers, got width=${options.width}, height=${options.height}`,
		);
	}
	return sampleNonogram;
}

async function failingImportFn(): Promise<Nonogram> {
	throw new Error("Could not fully solve this puzzle from its clues alone");
}

function buildImportRequestForm(fields: Record<string, string>): FormData {
	const form = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		form.append(key, value);
	}
	form.append("image", fakeImage, {
		filename: "puzzle.png",
		contentType: "image/png",
	});
	return form;
}

beforeEach(async () => {
	workDir = await mkdtemp(
		join(tmpdir(), "remarkable-nonogram-web-import-routes-test-"),
	);
	nonogramsPath = join(workDir, "nonograms");
	credentialsPath = join(workDir, "credentials.json");
});

afterEach(async () => {
	await rm(workDir, { recursive: true, force: true });
});

describe("POST /api/nonograms/import-image", () => {
	it("creates and persists a nonogram from the imported image", async () => {
		const app = buildServer({
			credentialsPath,
			nonogramsPath,
			importNonogramFromImageFn: fakeImportFn,
		});
		const form = buildImportRequestForm({
			type: "nonograms.org",
			width: "2",
			height: "2",
		});

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/import-image",
			payload: form.getBuffer(),
			headers: form.getHeaders(),
		});

		expect(response.statusCode).toBe(201);
		const body = response.json();
		expect(body.id).toEqual(expect.any(String));
		expect(body.nonogram).toEqual(sampleNonogram);

		const store = createFileNonogramStore(nonogramsPath);
		const persisted = await store.load(body.id);
		expect(persisted?.nonogram).toEqual(sampleNonogram);
	});

	it("returns 400 with a clear error for an unsupported image type", async () => {
		const app = buildServer({
			credentialsPath,
			nonogramsPath,
			importNonogramFromImageFn: fakeImportFn,
		});
		const form = buildImportRequestForm({
			type: "some-other-site",
			width: "2",
			height: "2",
		});

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/import-image",
			payload: form.getBuffer(),
			headers: form.getHeaders(),
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().error).toMatch(/unsupported image import type/i);

		const store = createFileNonogramStore(nonogramsPath);
		expect(await store.list()).toEqual([]);
	});

	it("returns 400 with a clear error when width or height is missing", async () => {
		const app = buildServer({
			credentialsPath,
			nonogramsPath,
			importNonogramFromImageFn: fakeImportFn,
		});
		const form = new FormData();
		form.append("type", "nonograms.org");
		form.append("image", fakeImage, {
			filename: "puzzle.png",
			contentType: "image/png",
		});

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/import-image",
			payload: form.getBuffer(),
			headers: form.getHeaders(),
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().error).toMatch(/positive integer/i);
	});

	it("returns 400 with a clear error when no image file is uploaded", async () => {
		const app = buildServer({
			credentialsPath,
			nonogramsPath,
			importNonogramFromImageFn: fakeImportFn,
		});
		const form = new FormData();
		form.append("type", "nonograms.org");
		form.append("width", "2");
		form.append("height", "2");

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/import-image",
			payload: form.getBuffer(),
			headers: form.getHeaders(),
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().error).toMatch(/image file is required/i);
	});

	it("returns 400 with the pipeline's error message when the image can't be turned into a puzzle", async () => {
		const app = buildServer({
			credentialsPath,
			nonogramsPath,
			importNonogramFromImageFn: failingImportFn,
		});
		const form = buildImportRequestForm({
			type: "nonograms.org",
			width: "2",
			height: "2",
		});

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/import-image",
			payload: form.getBuffer(),
			headers: form.getHeaders(),
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().error).toMatch(/could not fully solve/i);

		const store = createFileNonogramStore(nonogramsPath);
		expect(await store.list()).toEqual([]);
	});
});
