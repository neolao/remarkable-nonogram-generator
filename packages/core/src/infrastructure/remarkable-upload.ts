import { REMARKABLE_CLOUD_TIMEOUT_MS, withTimeout } from "./network-timeout.js";
import type { RemarkableSession } from "./remarkable-auth.js";

export interface UploadPdfOptions {
	folder?: string;
}

// Looking up a folder by name requires fetching metadata for every entry in the
// account. rmapi-js's own listItems() does this with unbounded concurrency
// (one to three requests per entry, all fired at once), which reliably causes
// connection timeouts on accounts with hundreds of entries. Walking entries
// with a small, fixed concurrency avoids that without needing a heavier fix
// upstream.
const FOLDER_LOOKUP_CONCURRENCY = 15;

const METADATA_TIMEOUT_MESSAGE =
	"Timed out while reading reMarkable Cloud entry metadata";

function fetchMetadata(
	session: RemarkableSession,
	entry: { id: string; hash: string },
): ReturnType<RemarkableSession["getMetadata"]> {
	return withTimeout(
		session.getMetadata(entry.id, entry.hash),
		REMARKABLE_CLOUD_TIMEOUT_MS,
		METADATA_TIMEOUT_MESSAGE,
	);
}

// A single slow entry among the potentially hundreds an account can hold
// shouldn't abort the whole folder lookup: retry once before giving up on it,
// to absorb a one-off slowdown from the reMarkable Cloud service.
async function getMetadataWithRetry(
	session: RemarkableSession,
	entry: { id: string; hash: string },
): ReturnType<RemarkableSession["getMetadata"]> {
	try {
		return await fetchMetadata(session, entry);
	} catch (cause) {
		if (
			!(cause instanceof Error) ||
			cause.message !== METADATA_TIMEOUT_MESSAGE
		) {
			throw cause;
		}
		return await fetchMetadata(session, entry);
	}
}

async function resolveFolderId(
	session: RemarkableSession,
	folderName: string,
): Promise<string> {
	const ids = await withTimeout(
		session.listIds(),
		REMARKABLE_CLOUD_TIMEOUT_MS,
		"Timed out while listing reMarkable Cloud entries",
	);
	let cursor = 0;
	let foundId: string | undefined;

	async function worker(): Promise<void> {
		while (cursor < ids.length && !foundId) {
			const entry = ids[cursor];
			cursor++;
			const metadata = await getMetadataWithRetry(session, entry);
			if (
				metadata.type === "CollectionType" &&
				metadata.visibleName === folderName &&
				!metadata.parent
			) {
				foundId = entry.id;
			}
		}
	}

	await Promise.all(
		Array.from(
			{ length: Math.min(FOLDER_LOOKUP_CONCURRENCY, ids.length) },
			() => worker(),
		),
	);

	if (!foundId) {
		throw new Error(
			`Folder "${folderName}" was not found on reMarkable Cloud. Create it first, then try again.`,
		);
	}
	return foundId;
}

export async function uploadPdf(
	session: RemarkableSession | undefined,
	pdfBytes: Uint8Array,
	visibleName: string,
	options: UploadPdfOptions = {},
): Promise<void> {
	if (!session) {
		throw new Error(
			"Cannot upload to reMarkable Cloud without a valid authenticated session",
		);
	}

	try {
		if (options.folder) {
			const folderId = await resolveFolderId(session, options.folder);
			await withTimeout(
				session.putPdf(visibleName, pdfBytes, { parent: folderId }),
				REMARKABLE_CLOUD_TIMEOUT_MS,
				"Timed out while uploading the PDF to reMarkable Cloud",
			);
		} else {
			await withTimeout(
				session.uploadPdf(visibleName, pdfBytes),
				REMARKABLE_CLOUD_TIMEOUT_MS,
				"Timed out while uploading the PDF to reMarkable Cloud",
			);
		}
	} catch (cause) {
		throw new Error(
			`Failed to upload the PDF to reMarkable Cloud: ${(cause as Error).message}`,
			{ cause },
		);
	}
}
