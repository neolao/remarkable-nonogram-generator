import { describe, expect, it } from "vitest";
import { buildServer, DEFAULT_PORT, resolvePort } from "./server.js";

describe("web server", () => {
	it("responds with the core version on /api/version", async () => {
		const app = buildServer();
		const response = await app.inject({ method: "GET", url: "/api/version" });

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({ core: "0.1.0" });
	});

	it("no longer exposes the image-based import route", async () => {
		const app = buildServer();
		const response = await app.inject({
			method: "POST",
			url: "/api/nonograms/import-image",
		});

		expect(response.statusCode).toBe(404);
	});

	it("serves the import page with only the URL import form, not the image import form", async () => {
		const app = buildServer();
		const response = await app.inject({ method: "GET", url: "/import.html" });

		expect(response.statusCode).toBe(200);
		expect(response.body).not.toContain('id="import-form"');
		expect(response.body).toContain('id="import-url-form"');
	});
});

describe("resolvePort", () => {
	it("returns the default port when PORT is not set", () => {
		expect(resolvePort({})).toBe(DEFAULT_PORT);
	});

	it("returns the port from the PORT environment variable when set", () => {
		expect(resolvePort({ PORT: "8123" })).toBe(8123);
	});

	it("throws when PORT is not a number", () => {
		expect(() => resolvePort({ PORT: "not-a-number" })).toThrow(
			/invalid port/i,
		);
	});

	it("throws when PORT is out of the valid port range", () => {
		expect(() => resolvePort({ PORT: "0" })).toThrow(/invalid port/i);
		expect(() => resolvePort({ PORT: "70000" })).toThrow(/invalid port/i);
	});
});
