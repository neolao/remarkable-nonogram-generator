function createEmptyCells(width, height) {
	return Array.from({ length: height }, () =>
		Array.from({ length: width }, () => false),
	);
}

// Mirrors the rules tested in packages/web/src/nonogram-client-clues.ts;
// duplicated here because this static page runs unmodified in the browser,
// with no build step available to import the compiled/tested module.
function computeLineClues(line) {
	const clues = [];
	let currentRunLength = 0;

	for (const cell of line) {
		if (cell) {
			currentRunLength += 1;
			continue;
		}
		if (currentRunLength > 0) {
			clues.push(currentRunLength);
			currentRunLength = 0;
		}
	}
	if (currentRunLength > 0) {
		clues.push(currentRunLength);
	}

	return clues.length > 0 ? clues : [0];
}

function computeClientNonogramClues(cells) {
	const width = cells[0]?.length ?? 0;
	const rowClues = cells.map((row) => computeLineClues(row));
	const columnClues = Array.from({ length: width }, (_, columnIndex) =>
		computeLineClues(cells.map((row) => row[columnIndex])),
	);

	return { rowClues, columnClues };
}

// Mirrors the rules tested in packages/web/src/nonogram-send-request.ts;
// duplicated here because this static page runs unmodified in the browser,
// with no build step available to import the compiled/tested module.
function buildNonogramSendRequest(currentId, folder) {
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

// Mirrors the rules tested in packages/web/src/nonogram-save-request.ts;
// duplicated here because this static page runs unmodified in the browser,
// with no build step available to import the compiled/tested module.
function buildNonogramSaveRequest(currentId, name, nonogram) {
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

function initEditor() {
	const statusElement = document.getElementById("editor-status");
	const errorElement = document.getElementById("editor-error");
	const sizeSection = document.getElementById("size-section");
	const widthInput = document.getElementById("grid-width");
	const heightInput = document.getElementById("grid-height");
	const sizeSubmit = document.getElementById("size-submit");
	const sizeError = document.getElementById("size-error");
	const boardElement = document.getElementById("nonogram-board");
	const gridElement = document.getElementById("nonogram-grid");
	const rowCluesElement = document.getElementById("row-clues");
	const columnCluesElement = document.getElementById("column-clues");
	const editorActions = document.getElementById("editor-actions");
	const nameInput = document.getElementById("nonogram-name");
	const saveButton = document.getElementById("save-button");
	const saveError = document.getElementById("save-error");
	const saveStatus = document.getElementById("save-status");
	const previewCard = document.getElementById("preview-card");
	const previewImage = document.getElementById("nonogram-preview");
	const downloadButton = document.getElementById("download-button");
	const remarkableFolderInput = document.getElementById("remarkable-folder");
	const sendButton = document.getElementById("send-button");
	const sendStatus = document.getElementById("send-status");
	const pairingSection = document.getElementById("pairing-section");
	const pairingCodeInput = document.getElementById("pairing-code");
	const pairingSubmit = document.getElementById("pairing-submit");
	const pairingError = document.getElementById("pairing-error");

	const params = new URLSearchParams(window.location.search);
	let currentId = params.get("id");
	let lastDownloadObjectUrl = null;
	const grid = { width: 0, height: 0, cells: [] };

	const renderClues = (width, height, cells) => {
		const { rowClues, columnClues } = computeClientNonogramClues(cells);

		rowCluesElement.style.setProperty("--grid-rows", String(height));
		rowCluesElement.innerHTML = "";
		for (const clues of rowClues) {
			const rowClueElement = document.createElement("div");
			rowClueElement.className = "row-clue";
			rowClueElement.textContent = clues.join(" ");
			rowCluesElement.append(rowClueElement);
		}

		columnCluesElement.style.setProperty("--grid-columns", String(width));
		columnCluesElement.innerHTML = "";
		for (const clues of columnClues) {
			const columnClueElement = document.createElement("div");
			columnClueElement.className = "column-clue";
			columnClueElement.textContent = clues.join("\n");
			columnCluesElement.append(columnClueElement);
		}
	};

	const updatePreviewAndDownload = async (width, height, cells) => {
		const nonogram = { width, height, cells };

		const previewResponse = await fetch("/api/nonograms/preview", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ nonogram }),
		});

		if (previewResponse.ok) {
			const svgMarkup = await previewResponse.text();
			previewImage.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
			previewImage.style.display = "block";
			previewCard.style.display = "block";
		}

		const generateResponse = await fetch("/api/nonograms/generate", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ nonogram }),
		});

		if (generateResponse.ok) {
			if (lastDownloadObjectUrl) {
				URL.revokeObjectURL(lastDownloadObjectUrl);
			}
			const pdfBlob = await generateResponse.blob();
			lastDownloadObjectUrl = URL.createObjectURL(pdfBlob);
			downloadButton.style.display = "inline";
			previewCard.style.display = "block";
		}
	};

	downloadButton.addEventListener("click", () => {
		if (!lastDownloadObjectUrl) {
			return;
		}
		const temporaryLink = document.createElement("a");
		temporaryLink.href = lastDownloadObjectUrl;
		temporaryLink.download = "nonogram.pdf";
		temporaryLink.click();
	});

	const renderGrid = (width, height, cells) => {
		grid.width = width;
		grid.height = height;
		grid.cells = cells;

		gridElement.innerHTML = "";
		gridElement.style.setProperty("--grid-columns", String(width));
		gridElement.style.setProperty("--grid-rows", String(height));

		for (let row = 0; row < height; row++) {
			for (let column = 0; column < width; column++) {
				const cell = document.createElement("button");
				cell.type = "button";
				cell.className = "nonogram-cell";
				cell.classList.toggle("filled", cells[row][column]);
				cell.setAttribute("aria-pressed", String(cells[row][column]));

				cell.addEventListener("click", () => {
					cells[row][column] = !cells[row][column];
					cell.classList.toggle("filled", cells[row][column]);
					cell.setAttribute("aria-pressed", String(cells[row][column]));
					renderClues(width, height, cells);
					updatePreviewAndDownload(width, height, cells);
				});

				gridElement.append(cell);
			}
		}

		renderClues(width, height, cells);
		boardElement.classList.add("visible");
		updatePreviewAndDownload(width, height, cells);
	};

	const showGrid = (name, nonogram) => {
		statusElement.textContent = name
			? `Editing "${name}" (${nonogram.width} × ${nonogram.height})`
			: `New nonogram (${nonogram.width} × ${nonogram.height})`;
		sizeSection.style.display = "none";
		nameInput.value = name ?? "";
		editorActions.style.display = "flex";
		renderGrid(
			nonogram.width,
			nonogram.height,
			nonogram.cells.map((row) => [...row]),
		);
	};

	const handleSave = async () => {
		saveError.textContent = "";
		saveStatus.textContent = "";

		const result = buildNonogramSaveRequest(currentId, nameInput.value, {
			width: grid.width,
			height: grid.height,
			cells: grid.cells,
		});

		if (!result.ok) {
			saveError.textContent = result.error;
			return;
		}

		const response = await fetch(result.request.url, {
			method: result.request.method,
			headers: { "content-type": "application/json" },
			body: JSON.stringify(result.request.body),
		});

		if (!response.ok) {
			const body = await response.json();
			saveError.textContent = body.error ?? "Failed to save this nonogram";
			return;
		}

		const saved = await response.json();
		currentId = saved.id;
		saveStatus.textContent = "Saved.";
	};

	saveButton.addEventListener("click", handleSave);

	const sendToRemarkable = async () => {
		const result = buildNonogramSendRequest(
			currentId,
			remarkableFolderInput.value,
		);

		if (!result.ok) {
			sendStatus.textContent = result.error;
			return;
		}

		sendStatus.textContent = "Sending to reMarkable...";
		pairingSection.style.display = "none";

		const response = await fetch(result.request.url, {
			method: result.request.method,
			headers: { "content-type": "application/json" },
			body: JSON.stringify(result.request.body),
		});

		if (response.ok) {
			sendStatus.textContent = "Nonogram sent to reMarkable.";
			return;
		}

		const body = await response.json();

		if (body.error === "not_authenticated") {
			sendStatus.textContent = "";
			pairingSection.style.display = "block";
			return;
		}

		sendStatus.textContent = body.error ?? "Failed to send this nonogram";
	};

	sendButton.addEventListener("click", () => {
		sendToRemarkable();
	});

	pairingSubmit.addEventListener("click", async () => {
		pairingError.textContent = "";
		const pairingCode = pairingCodeInput.value.trim();

		if (!pairingCode) {
			pairingError.textContent = "Pairing code is required";
			return;
		}

		const response = await fetch("/api/remarkable/pair", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ pairingCode }),
		});

		if (!response.ok) {
			const body = await response.json();
			pairingError.textContent = body.error ?? "Pairing failed";
			return;
		}

		pairingCodeInput.value = "";
		pairingError.textContent = "";
		await sendToRemarkable();
	});

	const loadExisting = async () => {
		const response = await fetch(`/api/nonograms/${currentId}`);

		if (!response.ok) {
			statusElement.textContent = "";
			errorElement.textContent = "This nonogram could not be found.";
			return;
		}

		const saved = await response.json();
		showGrid(saved.name, saved.nonogram);
	};

	const handleSizeSubmit = async () => {
		sizeError.textContent = "";
		const width = Number(widthInput.value);
		const height = Number(heightInput.value);
		const cells = createEmptyCells(width, height);

		const response = await fetch("/api/nonograms/preview", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ nonogram: { width, height, cells } }),
		});

		if (!response.ok) {
			const body = await response.json();
			sizeError.textContent = body.error ?? "Invalid grid size";
			return;
		}

		showGrid(null, { width, height, cells });
	};

	if (currentId) {
		sizeSection.style.display = "none";
		loadExisting();
	} else {
		statusElement.textContent = "";
		sizeSection.style.display = "block";
		sizeSubmit.addEventListener("click", handleSizeSubmit);
	}
}

initEditor();
