import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	authenticate,
	type Nonogram,
	uploadPdf,
} from "@remarkable-nonogram-generator/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFileNonogramStore } from "./nonogram-store.js";
import { buildServer } from "./server.js";

vi.mock("@remarkable-nonogram-generator/core", async (importOriginal) => {
	const actual =
		await importOriginal<
			typeof import("@remarkable-nonogram-generator/core")
		>();
	return {
		...actual,
		authenticate: vi.fn(),
		uploadPdf: vi.fn(),
	};
});

const authenticateMock = vi.mocked(authenticate);
const uploadPdfMock = vi.mocked(uploadPdf);

let workDir: string;
let credentialsPath: string;
let nonogramsPath: string;

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
		join(tmpdir(), "remarkable-nonogram-web-routes-test-"),
	);
	credentialsPath = join(workDir, "credentials.json");
	nonogramsPath = join(workDir, "nonograms");
	authenticateMock.mockReset();
	uploadPdfMock.mockReset();
});

afterEach(async () => {
	await rm(workDir, { recursive: true, force: true });
});

describe("GET /api/remarkable/status", () => {
	it("reports not authenticated when no credentials are stored", async () => {
		const app = buildServer({ credentialsPath });

		const response = await app.inject({
			method: "GET",
			url: "/api/remarkable/status",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({ authenticated: false });
	});

	it("reports authenticated when credentials are already stored", async () => {
		await writeFile(
			credentialsPath,
			JSON.stringify({ deviceToken: "existing-token" }),
		);
		const app = buildServer({ credentialsPath });

		const response = await app.inject({
			method: "GET",
			url: "/api/remarkable/status",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({ authenticated: true });
	});
});

describe("POST /api/remarkable/pair", () => {
	it("pairs successfully with a valid pairing code", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: partial fake of the opaque core session type
		authenticateMock.mockResolvedValue({} as any);
		const app = buildServer({ credentialsPath });

		const response = await app.inject({
			method: "POST",
			url: "/api/remarkable/pair",
			payload: { pairingCode: "12345678" },
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({ authenticated: true });
		expect(authenticateMock).toHaveBeenCalledWith(
			expect.anything(),
			"12345678",
		);
	});

	it("returns 400 when the pairing code is missing", async () => {
		const app = buildServer({ credentialsPath });

		const response = await app.inject({
			method: "POST",
			url: "/api/remarkable/pair",
			payload: {},
		});

		expect(response.statusCode).toBe(400);
		expect(authenticateMock).not.toHaveBeenCalled();
	});

	it("returns 400 when the pairing code is rejected by reMarkable Cloud", async () => {
		authenticateMock.mockRejectedValue(
			new Error("Invalid or expired pairing code."),
		);
		const app = buildServer({ credentialsPath });

		const response = await app.inject({
			method: "POST",
			url: "/api/remarkable/pair",
			payload: { pairingCode: "bad-code" },
		});

		expect(response.statusCode).toBe(400);
		expect(response.json()).toEqual({
			error: "Invalid or expired pairing code.",
		});
	});
});

describe("POST /api/nonograms/:id/send", () => {
	it("returns 409 not_authenticated when no credentials are stored", async () => {
		const store = createFileNonogramStore(nonogramsPath);
		const saved = await store.save({
			name: "My puzzle",
			nonogram: sampleNonogram,
		});
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: `/api/nonograms/${saved.id}/send`,
			payload: {},
		});

		expect(response.statusCode).toBe(409);
		expect(response.json()).toEqual({ error: "not_authenticated" });
		expect(authenticateMock).not.toHaveBeenCalled();
		expect(uploadPdfMock).not.toHaveBeenCalled();
	});

	it("returns 404 for an unknown nonogram id without attempting authentication", async () => {
		await writeFile(
			credentialsPath,
			JSON.stringify({ deviceToken: "existing-token" }),
		);
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/does-not-exist/send",
			payload: {},
		});

		expect(response.statusCode).toBe(404);
		expect(authenticateMock).not.toHaveBeenCalled();
		expect(uploadPdfMock).not.toHaveBeenCalled();
	});

	it("uploads the rendered PDF and returns the saved name when already authenticated", async () => {
		const store = createFileNonogramStore(nonogramsPath);
		const saved = await store.save({
			name: "My puzzle",
			nonogram: sampleNonogram,
		});
		await writeFile(
			credentialsPath,
			JSON.stringify({ deviceToken: "existing-token" }),
		);
		// biome-ignore lint/suspicious/noExplicitAny: partial fake of the opaque core session type
		const fakeSession = { fake: "session" } as any;
		authenticateMock.mockResolvedValue(fakeSession);
		uploadPdfMock.mockResolvedValue(undefined);
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: `/api/nonograms/${saved.id}/send`,
			payload: {},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({ visibleName: "My puzzle" });
		expect(uploadPdfMock).toHaveBeenCalledWith(
			fakeSession,
			expect.any(String),
			"My puzzle",
			expect.objectContaining({ folder: undefined }),
		);
	});

	it("forwards the requested folder to the upload step", async () => {
		const store = createFileNonogramStore(nonogramsPath);
		const saved = await store.save({
			name: "My puzzle",
			nonogram: sampleNonogram,
		});
		await writeFile(
			credentialsPath,
			JSON.stringify({ deviceToken: "existing-token" }),
		);
		// biome-ignore lint/suspicious/noExplicitAny: partial fake of the opaque core session type
		authenticateMock.mockResolvedValue({} as any);
		uploadPdfMock.mockResolvedValue(undefined);
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: `/api/nonograms/${saved.id}/send`,
			payload: { folder: "Puzzles" },
		});

		expect(response.statusCode).toBe(200);
		expect(uploadPdfMock).toHaveBeenCalledWith(
			expect.anything(),
			expect.any(String),
			"My puzzle",
			expect.objectContaining({ folder: "Puzzles" }),
		);
	});
});
