// Mirrors packages/web/src/nonogram-url-import-request.ts (tested there) -
// the static frontend has no build step to import it, see CLAUDE.md.
function buildNonogramUrlImportRequest(puzzleUrl) {
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

// Mirrors packages/web/src/nonogram-import-progress.ts (tested there) - the
// static frontend has no build step to import it, see CLAUDE.md.
function setImportInProgress(toggle, inProgress) {
	toggle.submitButton.disabled = inProgress;
	toggle.progressElement.hidden = !inProgress;
}

function initImportUrlForm() {
	const form = document.getElementById("import-url-form");
	const urlInput = document.getElementById("import-url");
	const submitButton = document.getElementById("import-url-submit");
	const progressElement = document.getElementById("import-url-progress");
	const errorElement = document.getElementById("import-url-error");
	const progressToggle = { submitButton, progressElement };

	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		errorElement.textContent = "";

		const result = buildNonogramUrlImportRequest(urlInput.value);
		if (!result.ok) {
			errorElement.textContent = result.error;
			return;
		}

		setImportInProgress(progressToggle, true);
		let response;
		try {
			response = await fetch(result.request.url, {
				method: result.request.method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(result.request.body),
			});
		} catch {
			errorElement.textContent =
				"Could not reach the server. Check your connection and try again.";
			setImportInProgress(progressToggle, false);
			return;
		}

		if (!response.ok) {
			const body = await response.json().catch(() => ({}));
			errorElement.textContent = body.error ?? "Failed to import this puzzle";
			setImportInProgress(progressToggle, false);
			return;
		}

		const saved = await response.json();
		window.location.href = `./editor.html?id=${encodeURIComponent(saved.id)}`;
	});
}

initImportUrlForm();
