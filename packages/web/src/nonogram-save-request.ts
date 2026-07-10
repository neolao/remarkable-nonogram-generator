import type { Nonogram } from "@remarkable-nonogram-generator/core";

export interface NonogramSaveRequest {
	readonly method: "POST" | "PUT";
	readonly url: string;
	readonly body: { readonly name: string; readonly nonogram: Nonogram };
}

export type NonogramSaveRequestResult =
	| { readonly ok: true; readonly request: NonogramSaveRequest }
	| { readonly ok: false; readonly error: string };

export function buildNonogramSaveRequest(
	currentId: string | null,
	name: string,
	nonogram: Nonogram,
): NonogramSaveRequestResult {
	const trimmedName = name.trim();
	if (!trimmedName) {
		return { ok: false, error: "A name is required to save this nonogram" };
	}

	const body = { name: trimmedName, nonogram };

	if (currentId) {
		return {
			ok: true,
			request: { method: "PUT", url: `/api/nonograms/${currentId}`, body },
		};
	}

	return {
		ok: true,
		request: { method: "POST", url: "/api/nonograms", body },
	};
}
