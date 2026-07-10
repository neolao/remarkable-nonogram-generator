function initEditor() {
	const statusElement = document.getElementById("editor-status");
	const errorElement = document.getElementById("editor-error");

	const params = new URLSearchParams(window.location.search);
	const id = params.get("id");

	if (!id) {
		statusElement.textContent = "New nonogram — grid editor not built yet.";
		return;
	}

	const loadNonogram = async () => {
		const response = await fetch(`/api/nonograms/${id}`);

		if (!response.ok) {
			statusElement.textContent = "";
			errorElement.textContent = "This nonogram could not be found.";
			return;
		}

		const saved = await response.json();
		statusElement.textContent = `Editing "${saved.name}" (${saved.nonogram.width} × ${saved.nonogram.height}) — grid editor not built yet.`;
	};

	loadNonogram();
}

initEditor();
