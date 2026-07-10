import { createNonogram } from "@remarkable-nonogram-generator/core";
import { describe, expect, it } from "vitest";
import { buildNonogramSaveRequest } from "./nonogram-save-request.js";

describe("buildNonogramSaveRequest", () => {
	const nonogram = createNonogram(2, 2, [
		[true, false],
		[false, true],
	]);

	it("builds a create request when there is no current id", () => {
		const result = buildNonogramSaveRequest(null, "My grid", nonogram);

		expect(result).toEqual({
			ok: true,
			request: {
				method: "POST",
				url: "/api/nonograms",
				body: { name: "My grid", nonogram },
			},
		});
	});

	it("builds an update request targeting the current id", () => {
		const result = buildNonogramSaveRequest(
			"b528d20c-8a99-4127-bc27-2240c3dd3d9a",
			"My grid",
			nonogram,
		);

		expect(result).toEqual({
			ok: true,
			request: {
				method: "PUT",
				url: "/api/nonograms/b528d20c-8a99-4127-bc27-2240c3dd3d9a",
				body: { name: "My grid", nonogram },
			},
		});
	});

	it("rejects a blank name without producing a request", () => {
		const result = buildNonogramSaveRequest(null, "", nonogram);

		expect(result).toEqual({
			ok: false,
			error: "A name is required to save this nonogram",
		});
	});

	it("rejects a whitespace-only name", () => {
		const result = buildNonogramSaveRequest(null, "   ", nonogram);

		expect(result).toEqual({
			ok: false,
			error: "A name is required to save this nonogram",
		});
	});

	it("trims surrounding whitespace from the name before including it in the request", () => {
		const result = buildNonogramSaveRequest(null, "  My grid  ", nonogram);

		expect(result).toEqual({
			ok: true,
			request: {
				method: "POST",
				url: "/api/nonograms",
				body: { name: "My grid", nonogram },
			},
		});
	});
});
