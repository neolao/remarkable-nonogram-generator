import { renderNonogramToPdf } from "../infrastructure/nonogram-pdf.js";
import { connectToRemarkable } from "../infrastructure/remarkable-auth.js";
import { uploadPdf } from "../infrastructure/remarkable-upload.js";
import type { NonogramStore } from "./nonogram-store.js";
import type { CredentialStore } from "./remarkable-credential-store.js";

export interface SendNonogramOptions {
	folder?: string;
	includeSolution?: boolean;
}

export type SendNonogramResult =
	| { outcome: "not_found" }
	| { outcome: "not_authenticated" }
	| { outcome: "auth_failed"; message: string }
	| { outcome: "upload_failed"; message: string }
	| { outcome: "sent"; visibleName: string };

export async function sendNonogramToRemarkable(
	nonogramStore: NonogramStore,
	credentialStore: CredentialStore,
	id: string,
	options: SendNonogramOptions = {},
): Promise<SendNonogramResult> {
	const saved = await nonogramStore.load(id);
	if (!saved) {
		return { outcome: "not_found" };
	}

	const existingCredentials = await credentialStore.load();
	if (!existingCredentials) {
		return { outcome: "not_authenticated" };
	}

	let session: Awaited<ReturnType<typeof connectToRemarkable>>;
	try {
		session = await connectToRemarkable(existingCredentials.deviceToken);
	} catch (error) {
		return { outcome: "auth_failed", message: (error as Error).message };
	}

	const pdfBytes = await renderNonogramToPdf(saved.nonogram, {
		includeSolution: options.includeSolution,
	});

	try {
		await uploadPdf(session, pdfBytes, saved.name, { folder: options.folder });
	} catch (error) {
		return { outcome: "upload_failed", message: (error as Error).message };
	}

	return { outcome: "sent", visibleName: saved.name };
}
