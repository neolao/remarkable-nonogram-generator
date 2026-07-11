import { describe, expect, it } from "vitest";
import { buildNonogramUrlImportRequest } from "./nonogram-url-import-request.js";

describe("buildNonogramUrlImportRequest", () => {
	it("builds a POST request to the import-url endpoint with the trimmed url", () => {
		const result = buildNonogramUrlImportRequest(
			"  https://www.nonograms.org/nonograms/i/81801  ",
		);

		expect(result).toEqual({
			ok: true,
			request: {
				method: "POST",
				url: "/api/nonograms/import-url",
				body: { url: "https://www.nonograms.org/nonograms/i/81801" },
			},
		});
	});

	it("returns an error when the url is blank", () => {
		expect(buildNonogramUrlImportRequest("")).toEqual({
			ok: false,
			error: "A puzzle url is required",
		});
		expect(buildNonogramUrlImportRequest("   ")).toEqual({
			ok: false,
			error: "A puzzle url is required",
		});
	});

	it("returns an error when the url is not a well-formed URL", () => {
		expect(buildNonogramUrlImportRequest("not a url")).toEqual({
			ok: false,
			error: "This doesn't look like a valid URL",
		});
	});
});
