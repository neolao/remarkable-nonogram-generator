import { describe, expect, it } from "vitest";
import { buildNonogramSendRequest } from "./nonogram-send-request.js";

describe("buildNonogramSendRequest", () => {
	it("builds a send request targeting the current id, with the trimmed folder included", () => {
		const result = buildNonogramSendRequest(
			"b528d20c-8a99-4127-bc27-2240c3dd3d9a",
			"  Puzzles  ",
		);

		expect(result).toEqual({
			ok: true,
			request: {
				method: "POST",
				url: "/api/nonograms/b528d20c-8a99-4127-bc27-2240c3dd3d9a/send",
				body: { folder: "Puzzles" },
			},
		});
	});

	it("omits the folder from the request body when it is empty", () => {
		const result = buildNonogramSendRequest(
			"b528d20c-8a99-4127-bc27-2240c3dd3d9a",
			"",
		);

		expect(result).toEqual({
			ok: true,
			request: {
				method: "POST",
				url: "/api/nonograms/b528d20c-8a99-4127-bc27-2240c3dd3d9a/send",
				body: {},
			},
		});
	});

	it("omits the folder from the request body when it is whitespace-only", () => {
		const result = buildNonogramSendRequest(
			"b528d20c-8a99-4127-bc27-2240c3dd3d9a",
			"   ",
		);

		expect(result).toEqual({
			ok: true,
			request: {
				method: "POST",
				url: "/api/nonograms/b528d20c-8a99-4127-bc27-2240c3dd3d9a/send",
				body: {},
			},
		});
	});

	it("rejects sending without a saved id, without producing a request", () => {
		const result = buildNonogramSendRequest(null, "Puzzles");

		expect(result).toEqual({
			ok: false,
			error: "Save this nonogram before sending it to reMarkable",
		});
	});
});
