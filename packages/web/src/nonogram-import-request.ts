export interface NonogramImportRequest {
	readonly method: "POST";
	readonly url: string;
	readonly fields: {
		readonly type: string;
		readonly width: string;
		readonly height: string;
	};
}

export type NonogramImportRequestResult =
	| { readonly ok: true; readonly request: NonogramImportRequest }
	| { readonly ok: false; readonly error: string };

export function buildNonogramImportRequest(
	imageType: string,
	hasImageFile: boolean,
	width: string,
	height: string,
): NonogramImportRequestResult {
	if (!hasImageFile) {
		return { ok: false, error: "An image file is required" };
	}
	if (!imageType) {
		return { ok: false, error: "An image type is required" };
	}

	const widthNum = Number(width);
	const heightNum = Number(height);
	if (
		!Number.isInteger(widthNum) ||
		widthNum <= 0 ||
		!Number.isInteger(heightNum) ||
		heightNum <= 0
	) {
		return {
			ok: false,
			error: "Width and height must be positive whole numbers",
		};
	}

	return {
		ok: true,
		request: {
			method: "POST",
			url: "/api/nonograms/import-image",
			fields: {
				type: imageType,
				width: String(widthNum),
				height: String(heightNum),
			},
		},
	};
}
