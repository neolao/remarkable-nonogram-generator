import { afterEach, describe, expect, it, vi } from "vitest";
import type { RemarkableSession } from "./remarkable-auth.js";
import { uploadPdf } from "./remarkable-upload.js";

const FAKE_PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46]);

interface FakeEntry {
	id: string;
	hash: string;
}

interface FakeMetadata {
	type: string;
	visibleName: string;
	parent: string;
}

interface FakeSessionOverrides {
	uploadPdf?: (name: string, buffer: Uint8Array) => Promise<unknown>;
	listIds?: () => Promise<FakeEntry[]>;
	getMetadata?: (id: string, hash: string) => Promise<FakeMetadata>;
	putPdf?: (
		name: string,
		buffer: Uint8Array,
		opts?: unknown,
	) => Promise<unknown>;
}

function createFakeSession(overrides: FakeSessionOverrides = {}) {
	return {
		uploadPdf: vi.fn(overrides.uploadPdf ?? (async () => ({}))),
		listIds: vi.fn(overrides.listIds ?? (async () => [])),
		getMetadata: vi.fn(
			overrides.getMetadata ??
				(async () => ({ type: "DocumentType", visibleName: "", parent: "" })),
		),
		putPdf: vi.fn(overrides.putPdf ?? (async () => ({}))),
	} as unknown as RemarkableSession;
}

describe("uploadPdf", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("retries a single entry's metadata lookup once after a timeout before giving up on it", async () => {
		vi.useFakeTimers();
		let attemptsForFolderEntry = 0;
		const session = createFakeSession({
			listIds: async () => [{ id: "id-0", hash: "hash-0" }],
			getMetadata: async (id) => {
				if (id !== "id-0") {
					return {
						type: "DocumentType",
						visibleName: "Something else",
						parent: "",
					};
				}
				attemptsForFolderEntry++;
				if (attemptsForFolderEntry === 1) {
					// simulate a stalled request that never settles, forcing withTimeout to fire
					return new Promise(() => {});
				}
				return { type: "CollectionType", visibleName: "Nonograms", parent: "" };
			},
		});

		const uploadPromise = uploadPdf(session, FAKE_PDF_BYTES, "My Nonogram", {
			folder: "Nonograms",
		});
		await vi.advanceTimersByTimeAsync(30_000);
		await uploadPromise;

		// biome-ignore lint/suspicious/noExplicitAny: accessing the fake session's mocked methods
		const fakeSession = session as any;
		expect(attemptsForFolderEntry).toBe(2);
		expect(fakeSession.putPdf).toHaveBeenCalledWith(
			"My Nonogram",
			FAKE_PDF_BYTES,
			{ parent: "id-0" },
		);
	});

	it("uploads the given PDF bytes under the visible name", async () => {
		const session = createFakeSession();

		await uploadPdf(session, FAKE_PDF_BYTES, "My Nonogram");

		// biome-ignore lint/suspicious/noExplicitAny: accessing the fake session's mocked methods
		expect((session as any).uploadPdf).toHaveBeenCalledWith(
			"My Nonogram",
			FAKE_PDF_BYTES,
		);
	});

	it("rejects without a valid session", async () => {
		await expect(
			uploadPdf(undefined, FAKE_PDF_BYTES, "My Nonogram"),
		).rejects.toThrow(/session/i);
	});

	it("wraps an upload failure with a clear error", async () => {
		const session = createFakeSession({
			uploadPdf: async () => {
				throw new Error("server exploded");
			},
		});

		await expect(
			uploadPdf(session, FAKE_PDF_BYTES, "My Nonogram"),
		).rejects.toThrow(/upload/i);
	});

	it("uploads into an existing folder by resolving its id, throttling the lookup", async () => {
		const entries: FakeEntry[] = Array.from({ length: 40 }, (_, i) => ({
			id: `id-${i}`,
			hash: `hash-${i}`,
		}));
		const session = createFakeSession({
			listIds: async () => entries,
			getMetadata: async (id) => {
				if (id === "id-20")
					return {
						type: "CollectionType",
						visibleName: "Nonograms",
						parent: "",
					};
				return {
					type: "DocumentType",
					visibleName: "Something else",
					parent: "",
				};
			},
		});

		await uploadPdf(session, FAKE_PDF_BYTES, "My Nonogram", {
			folder: "Nonograms",
		});

		// biome-ignore lint/suspicious/noExplicitAny: accessing the fake session's mocked methods
		const fakeSession = session as any;
		expect(fakeSession.putPdf).toHaveBeenCalledWith(
			"My Nonogram",
			FAKE_PDF_BYTES,
			{ parent: "id-20" },
		);
		expect(fakeSession.uploadPdf).not.toHaveBeenCalled();
	});

	it("rejects with a clear error when the named folder does not exist", async () => {
		const session = createFakeSession({
			listIds: async () => [{ id: "other-id", hash: "other-hash" }],
			getMetadata: async () => ({
				type: "CollectionType",
				visibleName: "Other Folder",
				parent: "",
			}),
		});

		await expect(
			uploadPdf(session, FAKE_PDF_BYTES, "My Nonogram", {
				folder: "Missing Folder",
			}),
		).rejects.toThrow(/folder/i);

		// biome-ignore lint/suspicious/noExplicitAny: accessing the fake session's mocked methods
		const fakeSession = session as any;
		expect(fakeSession.putPdf).not.toHaveBeenCalled();
	});

	it("uploads to the root when no folder is specified", async () => {
		const session = createFakeSession();

		await uploadPdf(session, FAKE_PDF_BYTES, "My Nonogram");

		// biome-ignore lint/suspicious/noExplicitAny: accessing the fake session's mocked methods
		const fakeSession = session as any;
		expect(fakeSession.listIds).not.toHaveBeenCalled();
		expect(fakeSession.uploadPdf).toHaveBeenCalledWith(
			"My Nonogram",
			FAKE_PDF_BYTES,
		);
	});

	it("wraps a folder resolution failure with a clear error", async () => {
		const session = createFakeSession({
			listIds: async () => {
				throw new Error("network blip");
			},
		});

		await expect(
			uploadPdf(session, FAKE_PDF_BYTES, "My Nonogram", {
				folder: "Nonograms",
			}),
		).rejects.toThrow(/upload/i);
	});
});
