import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Nonogram } from "../domain/nonogram-grid.js";
import { connectToRemarkable } from "../infrastructure/remarkable-auth.js";
import { uploadPdf } from "../infrastructure/remarkable-upload.js";
import type {
	NonogramStore,
	SavedNonogram,
	SaveNonogramInput,
} from "./nonogram-store.js";
import type {
	CredentialStore,
	RemarkableCredentials,
} from "./remarkable-credential-store.js";
import { sendNonogramToRemarkable } from "./send-nonogram.js";

vi.mock("../infrastructure/remarkable-auth.js", () => ({
	connectToRemarkable: vi.fn(),
}));
vi.mock("../infrastructure/remarkable-upload.js", () => ({
	uploadPdf: vi.fn(),
}));

const connectToRemarkableMock = vi.mocked(connectToRemarkable);
const uploadPdfMock = vi.mocked(uploadPdf);

const sampleNonogram: Nonogram = {
	width: 2,
	height: 2,
	cells: [
		[true, false],
		[false, true],
	],
};

class InMemoryNonogramStore implements NonogramStore {
	private saved: SavedNonogram | null;

	constructor(initial: SavedNonogram | null) {
		this.saved = initial;
	}

	async list() {
		return [];
	}

	async load(id: string): Promise<SavedNonogram | null> {
		return this.saved && this.saved.id === id ? this.saved : null;
	}

	async save(input: SaveNonogramInput): Promise<SavedNonogram> {
		this.saved = {
			id: input.id ?? "generated-id",
			name: input.name,
			nonogram: input.nonogram,
			createdAt: "now",
			updatedAt: "now",
		};
		return this.saved;
	}

	async delete(): Promise<void> {
		this.saved = null;
	}
}

class InMemoryCredentialStore implements CredentialStore {
	constructor(private credentials: RemarkableCredentials | null) {}

	async load(): Promise<RemarkableCredentials | null> {
		return this.credentials;
	}

	async save(credentials: RemarkableCredentials): Promise<void> {
		this.credentials = credentials;
	}
}

beforeEach(() => {
	connectToRemarkableMock.mockReset();
	uploadPdfMock.mockReset();
});

describe("sendNonogramToRemarkable", () => {
	it("returns not_found when the nonogram does not exist", async () => {
		const nonogramStore = new InMemoryNonogramStore(null);
		const credentialStore = new InMemoryCredentialStore(null);

		const result = await sendNonogramToRemarkable(
			nonogramStore,
			credentialStore,
			"missing-id",
		);

		expect(result).toEqual({ outcome: "not_found" });
		expect(connectToRemarkableMock).not.toHaveBeenCalled();
		expect(uploadPdfMock).not.toHaveBeenCalled();
	});

	it("returns not_authenticated when no credentials are stored", async () => {
		const nonogramStore = new InMemoryNonogramStore({
			id: "puzzle-1",
			name: "My puzzle",
			nonogram: sampleNonogram,
			createdAt: "now",
			updatedAt: "now",
		});
		const credentialStore = new InMemoryCredentialStore(null);

		const result = await sendNonogramToRemarkable(
			nonogramStore,
			credentialStore,
			"puzzle-1",
		);

		expect(result).toEqual({ outcome: "not_authenticated" });
		expect(connectToRemarkableMock).not.toHaveBeenCalled();
	});

	it("returns auth_failed with the error message when re-authentication fails", async () => {
		const nonogramStore = new InMemoryNonogramStore({
			id: "puzzle-1",
			name: "My puzzle",
			nonogram: sampleNonogram,
			createdAt: "now",
			updatedAt: "now",
		});
		const credentialStore = new InMemoryCredentialStore({
			deviceToken: "existing-token",
		});
		connectToRemarkableMock.mockRejectedValue(new Error("session expired"));

		const result = await sendNonogramToRemarkable(
			nonogramStore,
			credentialStore,
			"puzzle-1",
		);

		expect(result).toEqual({
			outcome: "auth_failed",
			message: "session expired",
		});
		expect(uploadPdfMock).not.toHaveBeenCalled();
	});

	it("returns upload_failed with the error message when the upload fails", async () => {
		const nonogramStore = new InMemoryNonogramStore({
			id: "puzzle-1",
			name: "My puzzle",
			nonogram: sampleNonogram,
			createdAt: "now",
			updatedAt: "now",
		});
		const credentialStore = new InMemoryCredentialStore({
			deviceToken: "existing-token",
		});
		// biome-ignore lint/suspicious/noExplicitAny: partial fake of the opaque core session type
		connectToRemarkableMock.mockResolvedValue({} as any);
		uploadPdfMock.mockRejectedValue(new Error("upload exploded"));

		const result = await sendNonogramToRemarkable(
			nonogramStore,
			credentialStore,
			"puzzle-1",
		);

		expect(result).toEqual({
			outcome: "upload_failed",
			message: "upload exploded",
		});
	});

	it("uploads the rendered PDF and returns the saved name on success", async () => {
		const nonogramStore = new InMemoryNonogramStore({
			id: "puzzle-1",
			name: "My puzzle",
			nonogram: sampleNonogram,
			createdAt: "now",
			updatedAt: "now",
		});
		const credentialStore = new InMemoryCredentialStore({
			deviceToken: "existing-token",
		});
		// biome-ignore lint/suspicious/noExplicitAny: partial fake of the opaque core session type
		const fakeSession = { fake: "session" } as any;
		connectToRemarkableMock.mockResolvedValue(fakeSession);
		uploadPdfMock.mockResolvedValue(undefined);

		const result = await sendNonogramToRemarkable(
			nonogramStore,
			credentialStore,
			"puzzle-1",
			{ folder: "Puzzles" },
		);

		expect(result).toEqual({ outcome: "sent", visibleName: "My puzzle" });
		expect(uploadPdfMock).toHaveBeenCalledWith(
			fakeSession,
			expect.any(Uint8Array),
			"My puzzle",
			{ folder: "Puzzles" },
		);
	});
});
