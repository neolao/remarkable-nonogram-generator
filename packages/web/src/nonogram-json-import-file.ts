export type ValidateNonogramJsonImportFileResult =
	| { ok: true }
	| { ok: false; error: string };

export function validateNonogramJsonImportFile(
	file: { name: string } | null | undefined,
): ValidateNonogramJsonImportFileResult {
	if (!file) {
		return { ok: false, error: "Please choose a JSON file to import" };
	}
	return { ok: true };
}
