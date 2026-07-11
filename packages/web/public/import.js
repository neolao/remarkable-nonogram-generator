// Mirrors packages/web/src/nonogram-import-request.ts (tested there) - the
// static frontend has no build step to import it, see CLAUDE.md.
function buildNonogramImportRequest(imageType, hasImageFile, width, height) {
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

function initImportForm() {
	const form = document.getElementById("import-form");
	const typeSelect = document.getElementById("import-type");
	const fileInput = document.getElementById("import-file");
	const widthInput = document.getElementById("import-width");
	const heightInput = document.getElementById("import-height");
	const submitButton = document.getElementById("import-submit");
	const errorElement = document.getElementById("import-error");

	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		errorElement.textContent = "";

		const file = fileInput.files[0];
		const result = buildNonogramImportRequest(
			typeSelect.value,
			Boolean(file),
			widthInput.value,
			heightInput.value,
		);

		if (!result.ok) {
			errorElement.textContent = result.error;
			return;
		}

		const formData = new FormData();
		formData.append("type", result.request.fields.type);
		formData.append("width", result.request.fields.width);
		formData.append("height", result.request.fields.height);
		formData.append("image", file);

		submitButton.disabled = true;
		let response;
		try {
			response = await fetch(result.request.url, {
				method: result.request.method,
				body: formData,
			});
		} catch {
			errorElement.textContent =
				"Could not reach the server. Check your connection and try again.";
			submitButton.disabled = false;
			return;
		}

		if (!response.ok) {
			const body = await response.json().catch(() => ({}));
			errorElement.textContent = body.error ?? "Failed to import this image";
			submitButton.disabled = false;
			return;
		}

		const saved = await response.json();
		window.location.href = `./editor.html?id=${encodeURIComponent(saved.id)}`;
	});
}

initImportForm();
