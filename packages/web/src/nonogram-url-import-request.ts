export interface NonogramUrlImportRequest {
	readonly method: "POST";
	readonly url: string;
	readonly body: { readonly url: string };
}

export type NonogramUrlImportRequestResult =
	| { readonly ok: true; readonly request: NonogramUrlImportRequest }
	| { readonly ok: false; readonly error: string };

export function buildNonogramUrlImportRequest(
	puzzleUrl: string,
): NonogramUrlImportRequestResult {
	const trimmed = puzzleUrl.trim();
	if (!trimmed) {
		return { ok: false, error: "A puzzle url is required" };
	}

	try {
		new URL(trimmed);
	} catch {
		return { ok: false, error: "This doesn't look like a valid URL" };
	}

	return {
		ok: true,
		request: {
			method: "POST",
			url: "/api/nonograms/import-url",
			body: { url: trimmed },
		},
	};
}
