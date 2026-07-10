import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	type Nonogram,
	renderNonogramToSvg,
} from "@remarkable-nonogram-generator/core";
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

describe("POST /api/nonograms", () => {
	it("creates a new nonogram and returns its id, name, and grid", async () => {
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms",
			payload: { name: "First puzzle", nonogram: sampleNonogram },
		});

		expect(response.statusCode).toBe(201);
		const body = response.json();
		expect(body.id).toEqual(expect.any(String));
		expect(body.name).toBe("First puzzle");
		expect(body.nonogram).toEqual(sampleNonogram);

		const store = createFileNonogramStore(nonogramsPath);
		const persisted = await store.load(body.id);
		expect(persisted?.name).toBe("First puzzle");
	});

	it("returns 400 with a clear error message when the grid dimensions are invalid", async () => {
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms",
			payload: {
				name: "Broken puzzle",
				nonogram: { width: 2, height: 2, cells: [[true, false]] },
			},
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().error).toMatch(/dimensions/i);

		const store = createFileNonogramStore(nonogramsPath);
		expect(await store.list()).toEqual([]);
	});
});

describe("GET /api/nonograms/:id", () => {
	it("returns the full saved grid and name for a known id", async () => {
		const store = createFileNonogramStore(nonogramsPath);
		const saved = await store.save({
			name: "First puzzle",
			nonogram: sampleNonogram,
		});
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "GET",
			url: `/api/nonograms/${saved.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({
			id: saved.id,
			name: "First puzzle",
			nonogram: sampleNonogram,
			createdAt: saved.createdAt,
			updatedAt: saved.updatedAt,
		});
	});

	it("returns 404 for an unknown id", async () => {
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "GET",
			url: "/api/nonograms/does-not-exist",
		});

		expect(response.statusCode).toBe(404);
	});
});

describe("PUT /api/nonograms/:id", () => {
	it("updates the stored grid and name, reflected by a subsequent GET", async () => {
		const store = createFileNonogramStore(nonogramsPath);
		const saved = await store.save({
			name: "First puzzle",
			nonogram: sampleNonogram,
		});
		const app = buildServer({ credentialsPath, nonogramsPath });
		const updatedNonogram: Nonogram = {
			width: 3,
			height: 1,
			cells: [[true, true, false]],
		};

		const putResponse = await app.inject({
			method: "PUT",
			url: `/api/nonograms/${saved.id}`,
			payload: { name: "Renamed puzzle", nonogram: updatedNonogram },
		});

		expect(putResponse.statusCode).toBe(200);

		const getResponse = await app.inject({
			method: "GET",
			url: `/api/nonograms/${saved.id}`,
		});
		expect(getResponse.json()).toEqual({
			id: saved.id,
			name: "Renamed puzzle",
			nonogram: updatedNonogram,
			createdAt: saved.createdAt,
			updatedAt: putResponse.json().updatedAt,
		});
	});

	it("returns 404 for an unknown id", async () => {
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "PUT",
			url: "/api/nonograms/does-not-exist",
			payload: { name: "Renamed puzzle", nonogram: sampleNonogram },
		});

		expect(response.statusCode).toBe(404);
	});

	it("returns 400 with a clear error message when the grid dimensions are invalid", async () => {
		const store = createFileNonogramStore(nonogramsPath);
		const saved = await store.save({
			name: "First puzzle",
			nonogram: sampleNonogram,
		});
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "PUT",
			url: `/api/nonograms/${saved.id}`,
			payload: {
				name: "Broken puzzle",
				nonogram: { width: 2, height: 2, cells: [[true, false]] },
			},
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().error).toMatch(/dimensions/i);

		const unchanged = await store.load(saved.id);
		expect(unchanged?.nonogram).toEqual(sampleNonogram);
	});
});

describe("POST /api/nonograms/preview", () => {
	it("returns 200 with the rendered SVG for a valid grid", async () => {
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/preview",
			payload: { nonogram: sampleNonogram },
		});

		expect(response.statusCode).toBe(200);
		expect(response.headers["content-type"]).toMatch(/image\/svg\+xml/);
		expect(response.body).toBe(renderNonogramToSvg(sampleNonogram));
	});

	it("returns 200 with a valid SVG for a minimal 1x1 grid", async () => {
		const app = buildServer({ credentialsPath, nonogramsPath });
		const tinyNonogram: Nonogram = { width: 1, height: 1, cells: [[true]] };

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/preview",
			payload: { nonogram: tinyNonogram },
		});

		expect(response.statusCode).toBe(200);
		expect(response.body).toBe(renderNonogramToSvg(tinyNonogram));
	});

	it("returns 200 with a valid SVG for an entirely empty grid", async () => {
		const app = buildServer({ credentialsPath, nonogramsPath });
		const emptyNonogram: Nonogram = {
			width: 2,
			height: 2,
			cells: [
				[false, false],
				[false, false],
			],
		};

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/preview",
			payload: { nonogram: emptyNonogram },
		});

		expect(response.statusCode).toBe(200);
		expect(response.body).toBe(renderNonogramToSvg(emptyNonogram));
	});

	it("returns 400 with a clear error message when the grid dimensions are invalid", async () => {
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/preview",
			payload: {
				nonogram: { width: 2, height: 2, cells: [[true, false]] },
			},
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().error).toMatch(/dimensions/i);
	});

	it("returns 400 with a clear error message when the grid is missing from the request body", async () => {
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/preview",
			payload: {},
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().error).toMatch(/required/i);
	});
});

describe("DELETE /api/nonograms/:id", () => {
	it("removes a known nonogram, so a subsequent GET returns 404", async () => {
		const store = createFileNonogramStore(nonogramsPath);
		const saved = await store.save({
			name: "First puzzle",
			nonogram: sampleNonogram,
		});
		const app = buildServer({ credentialsPath, nonogramsPath });

		const deleteResponse = await app.inject({
			method: "DELETE",
			url: `/api/nonograms/${saved.id}`,
		});

		expect(deleteResponse.statusCode).toBe(204);

		const getResponse = await app.inject({
			method: "GET",
			url: `/api/nonograms/${saved.id}`,
		});
		expect(getResponse.statusCode).toBe(404);
	});

	it("returns 404 rather than a server error for an unknown id", async () => {
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "DELETE",
			url: "/api/nonograms/does-not-exist",
		});

		expect(response.statusCode).toBe(404);
	});
});
