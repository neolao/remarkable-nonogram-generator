export interface NonogramSendRequest {
	readonly method: "POST";
	readonly url: string;
	readonly body: { readonly folder?: string };
}

export type NonogramSendRequestResult =
	| { readonly ok: true; readonly request: NonogramSendRequest }
	| { readonly ok: false; readonly error: string };

export function buildNonogramSendRequest(
	currentId: string | null,
	folder: string,
): NonogramSendRequestResult {
	if (!currentId) {
		return {
			ok: false,
			error: "Save this nonogram before sending it to reMarkable",
		};
	}

	const trimmedFolder = folder.trim();
	const body = trimmedFolder ? { folder: trimmedFolder } : {};

	return {
		ok: true,
		request: {
			method: "POST",
			url: `/api/nonograms/${currentId}/send`,
			body,
		},
	};
}
