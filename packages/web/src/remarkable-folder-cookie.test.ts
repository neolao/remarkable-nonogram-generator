import { describe, expect, it } from "vitest";
import {
	buildRemarkableFolderCookieAssignment,
	REMARKABLE_FOLDER_COOKIE_NAME,
	readRemarkableFolderCookie,
} from "./remarkable-folder-cookie.js";

describe("buildRemarkableFolderCookieAssignment", () => {
	it("builds a long-lived cookie assignment storing the trimmed folder", () => {
		const assignment = buildRemarkableFolderCookieAssignment("  Puzzles  ");

		expect(assignment).toBe(
			`${REMARKABLE_FOLDER_COOKIE_NAME}=Puzzles; path=/; max-age=31536000`,
		);
	});

	it("percent-encodes folder values containing special characters", () => {
		const assignment = buildRemarkableFolderCookieAssignment("My Folder/Sub");

		expect(assignment).toBe(
			`${REMARKABLE_FOLDER_COOKIE_NAME}=My%20Folder%2FSub; path=/; max-age=31536000`,
		);
	});

	it("clears the cookie when the folder is empty", () => {
		const assignment = buildRemarkableFolderCookieAssignment("");

		expect(assignment).toBe(
			`${REMARKABLE_FOLDER_COOKIE_NAME}=; path=/; max-age=0`,
		);
	});

	it("clears the cookie when the folder is whitespace-only", () => {
		const assignment = buildRemarkableFolderCookieAssignment("   ");

		expect(assignment).toBe(
			`${REMARKABLE_FOLDER_COOKIE_NAME}=; path=/; max-age=0`,
		);
	});
});

describe("readRemarkableFolderCookie", () => {
	it("extracts and decodes the folder value from a raw cookie header", () => {
		const folder = readRemarkableFolderCookie(
			`${REMARKABLE_FOLDER_COOKIE_NAME}=My%20Folder%2FSub`,
		);

		expect(folder).toBe("My Folder/Sub");
	});

	it("finds the folder cookie among several other cookies", () => {
		const folder = readRemarkableFolderCookie(
			`session=abc123; ${REMARKABLE_FOLDER_COOKIE_NAME}=Puzzles; theme=dark`,
		);

		expect(folder).toBe("Puzzles");
	});

	it("returns an empty string when the cookie header is empty", () => {
		const folder = readRemarkableFolderCookie("");

		expect(folder).toBe("");
	});

	it("returns an empty string when the folder cookie is not present", () => {
		const folder = readRemarkableFolderCookie("session=abc123; theme=dark");

		expect(folder).toBe("");
	});

	it("returns an empty string when the cookie value has malformed percent-encoding", () => {
		const folder = readRemarkableFolderCookie(
			`${REMARKABLE_FOLDER_COOKIE_NAME}=%E0%A4%A`,
		);

		expect(folder).toBe("");
	});
});
