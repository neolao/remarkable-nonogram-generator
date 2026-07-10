import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { authenticate } from "@remarkable-nonogram-generator/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildServer } from "./server.js";

vi.mock("@remarkable-nonogram-generator/core", async (importOriginal) => {
	const actual =
		await importOriginal<
			typeof import("@remarkable-nonogram-generator/core")
		>();
	return {
		...actual,
		authenticate: vi.fn(),
	};
});

const authenticateMock = vi.mocked(authenticate);

let workDir: string;
let credentialsPath: string;

beforeEach(async () => {
	workDir = await mkdtemp(
		join(tmpdir(), "remarkable-nonogram-web-routes-test-"),
	);
	credentialsPath = join(workDir, "credentials.json");
	authenticateMock.mockReset();
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
