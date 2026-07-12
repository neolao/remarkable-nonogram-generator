import { unzipSync, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { MAX_GRID_WIDTH } from "../domain/nonogram-grid.js";
import {
	createNonogramArchive,
	parseNonogramArchive,
} from "./nonogram-archive.js";

describe("createNonogramArchive", () => {
	it("zips one JSON export file per entry, readable back as the same export data", () => {
		const entries = [
			{
				name: "Cat",
				nonogram: { width: 2, height: 1, cells: [[true, false]] },
			},
			{
				name: "Dog",
				nonogram: { width: 1, height: 2, cells: [[true], [false]] },
			},
		];

		const archive = createNonogramArchive(entries);
		const unzipped = unzipSync(archive);
		const fileNames = Object.keys(unzipped);

		expect(fileNames).toHaveLength(2);
		expect(fileNames.every((fileName) => fileName.endsWith(".json"))).toBe(
			true,
		);

		const parsedFiles = fileNames
			.map((fileName) =>
				JSON.parse(Buffer.from(unzipped[fileName]).toString("utf-8")),
			)
			.sort((a, b) => a.name.localeCompare(b.name));

		expect(parsedFiles).toEqual([
			{ name: "Cat", width: 2, height: 1, cells: [[true, false]] },
			{ name: "Dog", width: 1, height: 2, cells: [[true], [false]] },
		]);
	});

	it("gives each entry a distinct file name even when names collide", () => {
		const entries = [
			{ name: "Puzzle", nonogram: { width: 1, height: 1, cells: [[true]] } },
			{ name: "Puzzle", nonogram: { width: 1, height: 1, cells: [[false]] } },
		];

		const archive = createNonogramArchive(entries);
		const fileNames = Object.keys(unzipSync(archive));

		expect(new Set(fileNames).size).toBe(2);
	});

	it("returns a valid empty zip archive when there are no entries", () => {
		const archive = createNonogramArchive([]);
		const unzipped = unzipSync(archive);

		expect(Object.keys(unzipped)).toHaveLength(0);
	});
});

describe("parseNonogramArchive", () => {
	it("returns a successful result for every valid JSON export entry", () => {
		const archive = zipSync({
			"1-cat.json": new TextEncoder().encode(
				JSON.stringify({
					name: "Cat",
					width: 2,
					height: 1,
					cells: [[true, false]],
				}),
			),
			"2-dog.json": new TextEncoder().encode(
				JSON.stringify({
					name: "Dog",
					width: 1,
					height: 2,
					cells: [[true], [false]],
				}),
			),
		});

		const results = parseNonogramArchive(archive);

		expect(results).toEqual([
			{
				ok: true,
				fileName: "1-cat.json",
				name: "Cat",
				nonogram: { width: 2, height: 1, cells: [[true, false]] },
			},
			{
				ok: true,
				fileName: "2-dog.json",
				name: "Dog",
				nonogram: { width: 1, height: 2, cells: [[true], [false]] },
			},
		]);
	});

	it("returns a per-entry error for a non-JSON file inside the archive", () => {
		const archive = zipSync({
			"readme.txt": new TextEncoder().encode("not a nonogram"),
		});

		const results = parseNonogramArchive(archive);

		expect(results).toEqual([
			{
				ok: false,
				fileName: "readme.txt",
				error: expect.stringMatching(/\.json/i),
			},
		]);
	});

	it("returns a per-entry error for a JSON file describing an invalid grid, without failing the other entries", () => {
		const archive = zipSync({
			"good.json": new TextEncoder().encode(
				JSON.stringify({
					name: "Good",
					width: 1,
					height: 1,
					cells: [[true]],
				}),
			),
			"bad.json": new TextEncoder().encode(
				JSON.stringify({ name: "Bad", width: 2, height: 2, cells: [[true]] }),
			),
		});

		const results = parseNonogramArchive(archive);

		expect(results).toEqual([
			{
				ok: true,
				fileName: "good.json",
				name: "Good",
				nonogram: { width: 1, height: 1, cells: [[true]] },
			},
			{
				ok: false,
				fileName: "bad.json",
				error: expect.stringMatching(/match declared dimensions/i),
			},
		]);
	});

	it("returns a per-entry error for a grid too large for a reMarkable 2 page", () => {
		const oversizedCells = Array.from({ length: 1 }, () =>
			Array.from({ length: MAX_GRID_WIDTH + 1 }, () => false),
		);
		const archive = zipSync({
			"huge.json": new TextEncoder().encode(
				JSON.stringify({
					name: "Huge",
					width: MAX_GRID_WIDTH + 1,
					height: 1,
					cells: oversizedCells,
				}),
			),
		});

		const results = parseNonogramArchive(archive);

		expect(results).toEqual([
			{
				ok: false,
				fileName: "huge.json",
				error: expect.stringMatching(/too large/i),
			},
		]);
	});

	it("throws a clear error when the archive itself is not a valid zip", () => {
		const notAZip = new TextEncoder().encode("this is definitely not a zip");

		expect(() => parseNonogramArchive(notAZip)).toThrow(
			/not a valid zip archive/i,
		);
	});

	it("returns an empty result list for a valid empty archive", () => {
		const archive = zipSync({});

		expect(parseNonogramArchive(archive)).toEqual([]);
	});
});
