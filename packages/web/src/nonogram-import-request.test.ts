import { describe, expect, it } from "vitest";
import { buildNonogramImportRequest } from "./nonogram-import-request.js";

describe("buildNonogramImportRequest", () => {
	it("builds a POST request to the import endpoint with the trimmed type and integer width/height fields", () => {
		const result = buildNonogramImportRequest(
			"nonograms.org",
			true,
			"20",
			"20",
		);

		expect(result).toEqual({
			ok: true,
			request: {
				method: "POST",
				url: "/api/nonograms/import-image",
				fields: { type: "nonograms.org", width: "20", height: "20" },
			},
		});
	});

	it("returns an error when no image file was selected", () => {
		const result = buildNonogramImportRequest(
			"nonograms.org",
			false,
			"20",
			"20",
		);

		expect(result).toEqual({
			ok: false,
			error: "An image file is required",
		});
	});

	it("returns an error when the image type is blank", () => {
		const result = buildNonogramImportRequest("", true, "20", "20");

		expect(result).toEqual({
			ok: false,
			error: "An image type is required",
		});
	});

	it("returns an error when width or height is zero, negative, or not a whole number", () => {
		expect(
			buildNonogramImportRequest("nonograms.org", true, "0", "20"),
		).toEqual({
			ok: false,
			error: "Width and height must be positive whole numbers",
		});
		expect(
			buildNonogramImportRequest("nonograms.org", true, "20", "-3"),
		).toEqual({
			ok: false,
			error: "Width and height must be positive whole numbers",
		});
		expect(
			buildNonogramImportRequest("nonograms.org", true, "2.5", "20"),
		).toEqual({
			ok: false,
			error: "Width and height must be positive whole numbers",
		});
	});

	it("returns an error when width or height is blank or not a number", () => {
		expect(buildNonogramImportRequest("nonograms.org", true, "", "20")).toEqual(
			{
				ok: false,
				error: "Width and height must be positive whole numbers",
			},
		);
		expect(
			buildNonogramImportRequest("nonograms.org", true, "abc", "20"),
		).toEqual({
			ok: false,
			error: "Width and height must be positive whole numbers",
		});
	});
});
