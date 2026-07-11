import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	authenticate,
	type Nonogram,
	sendNonogramToRemarkable,
} from "@remarkable-nonogram-generator/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFileNonogramStore } from "./file-nonogram-store.js";
import { buildServer } from "./server.js";

vi.mock("@remarkable-nonogram-generator/core", async (importOriginal) => {
	const actual =
		await importOriginal<
			typeof import("@remarkable-nonogram-generator/core")
		>();
	return {
		...actual,
		authenticate: vi.fn(),
		sendNonogramToRemarkable: vi.fn(),
	};
});

const authenticateMock = vi.mocked(authenticate);
const sendNonogramToRemarkableMock = vi.mocked(sendNonogramToRemarkable);

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
	sendNonogramToRemarkableMock.mockReset();
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
	it("returns 409 not_authenticated when the use case reports not_authenticated", async () => {
		const store = createFileNonogramStore(nonogramsPath);
		const saved = await store.save({
			name: "My puzzle",
			nonogram: sampleNonogram,
		});
		sendNonogramToRemarkableMock.mockResolvedValue({
			outcome: "not_authenticated",
		});
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: `/api/nonograms/${saved.id}/send`,
			payload: {},
		});

		expect(response.statusCode).toBe(409);
		expect(response.json()).toEqual({ error: "not_authenticated" });
	});

	it("returns 404 when the use case reports not_found", async () => {
		sendNonogramToRemarkableMock.mockResolvedValue({ outcome: "not_found" });
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/does-not-exist/send",
			payload: {},
		});

		expect(response.statusCode).toBe(404);
		expect(response.json()).toEqual({ error: "Nonogram not found" });
	});

	it("returns 502 when the use case reports auth_failed", async () => {
		const store = createFileNonogramStore(nonogramsPath);
		const saved = await store.save({
			name: "My puzzle",
			nonogram: sampleNonogram,
		});
		sendNonogramToRemarkableMock.mockResolvedValue({
			outcome: "auth_failed",
			message: "Failed to authenticate with reMarkable Cloud",
		});
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: `/api/nonograms/${saved.id}/send`,
			payload: {},
		});

		expect(response.statusCode).toBe(502);
		expect(response.json()).toEqual({
			error: "Failed to authenticate with reMarkable Cloud",
		});
	});

	it("returns 502 when the use case reports upload_failed", async () => {
		const store = createFileNonogramStore(nonogramsPath);
		const saved = await store.save({
			name: "My puzzle",
			nonogram: sampleNonogram,
		});
		sendNonogramToRemarkableMock.mockResolvedValue({
			outcome: "upload_failed",
			message: "Failed to upload the PDF to reMarkable Cloud",
		});
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: `/api/nonograms/${saved.id}/send`,
			payload: {},
		});

		expect(response.statusCode).toBe(502);
		expect(response.json()).toEqual({
			error: "Failed to upload the PDF to reMarkable Cloud",
		});
	});

	it("returns the saved name when the use case reports sent", async () => {
		const store = createFileNonogramStore(nonogramsPath);
		const saved = await store.save({
			name: "My puzzle",
			nonogram: sampleNonogram,
		});
		sendNonogramToRemarkableMock.mockResolvedValue({
			outcome: "sent",
			visibleName: "My puzzle",
		});
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: `/api/nonograms/${saved.id}/send`,
			payload: {},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({ visibleName: "My puzzle" });
		expect(sendNonogramToRemarkableMock).toHaveBeenCalledWith(
			expect.anything(),
			expect.anything(),
			saved.id,
			{ folder: undefined, includeSolution: undefined },
		);
	});

	it("forwards the requested folder and includeSolution to the use case", async () => {
		const store = createFileNonogramStore(nonogramsPath);
		const saved = await store.save({
			name: "My puzzle",
			nonogram: sampleNonogram,
		});
		sendNonogramToRemarkableMock.mockResolvedValue({
			outcome: "sent",
			visibleName: "My puzzle",
		});
		const app = buildServer({ credentialsPath, nonogramsPath });

		const response = await app.inject({
			method: "POST",
			url: `/api/nonograms/${saved.id}/send`,
			payload: { folder: "Puzzles", includeSolution: true },
		});

		expect(response.statusCode).toBe(200);
		expect(sendNonogramToRemarkableMock).toHaveBeenCalledWith(
			expect.anything(),
			expect.anything(),
			saved.id,
			{ folder: "Puzzles", includeSolution: true },
		);
	});
});
