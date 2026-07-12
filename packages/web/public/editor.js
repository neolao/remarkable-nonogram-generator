import { submitPairingCode } from "./remarkable-pairing.js";

function createEmptyCells(width, height) {
	return Array.from({ length: height }, () =>
		Array.from({ length: width }, () => false),
	);
}

// Mirrors the rules tested in packages/core/src/nonogram-clues.ts (via
// packages/web/src/nonogram-client-clues.ts); duplicated here because this
// static page runs unmodified in the browser, with no build step available
// to import the compiled/tested module.
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

// Mirrors packages/web/src/nonogram-client-grid-lines.ts; duplicated here
// because this static page runs unmodified in the browser, with no build
// step available to import the compiled/tested module.
function isThickGridlineIndex(index) {
	return index > 0 && index % 5 === 0;
}

// Mirrors the rules tested in packages/web/src/nonogram-send-request.ts;
// duplicated here because this static page runs unmodified in the browser,
// with no build step available to import the compiled/tested module.
function buildNonogramSendRequest(currentId, folder, includeSolution = false) {
	if (!currentId) {
		return {
			ok: false,
			error: "Save this nonogram before sending it to reMarkable",
		};
	}

	const trimmedFolder = folder.trim();
	const body = {
		...(trimmedFolder ? { folder: trimmedFolder } : {}),
		...(includeSolution ? { includeSolution: true } : {}),
	};

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

// Mirrors the rules tested in packages/web/src/remarkable-folder-cookie.ts;
// duplicated here because this static page runs unmodified in the browser,
// with no build step available to import the compiled/tested module.
const REMARKABLE_FOLDER_COOKIE_NAME = "remarkable-folder";
const REMARKABLE_FOLDER_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function buildRemarkableFolderCookieAssignment(folder) {
	const trimmedFolder = folder.trim();

	if (!trimmedFolder) {
		return `${REMARKABLE_FOLDER_COOKIE_NAME}=; path=/; max-age=0`;
	}

	return `${REMARKABLE_FOLDER_COOKIE_NAME}=${encodeURIComponent(trimmedFolder)}; path=/; max-age=${REMARKABLE_FOLDER_COOKIE_MAX_AGE_SECONDS}`;
}

function readRemarkableFolderCookie(cookieHeader) {
	const cookiePrefix = `${REMARKABLE_FOLDER_COOKIE_NAME}=`;
	const match = cookieHeader
		.split(";")
		.map((part) => part.trim())
		.find((part) => part.startsWith(cookiePrefix));

	if (!match) {
		return "";
	}

	const rawValue = match.slice(cookiePrefix.length);

	try {
		return decodeURIComponent(rawValue);
	} catch {
		return "";
	}
}

function queryEditorElements() {
	return {
		statusElement: document.getElementById("editor-status"),
		errorElement: document.getElementById("editor-error"),
		sizeSection: document.getElementById("size-section"),
		widthInput: document.getElementById("grid-width"),
		heightInput: document.getElementById("grid-height"),
		sizeSubmit: document.getElementById("size-submit"),
		sizeError: document.getElementById("size-error"),
		boardElement: document.getElementById("nonogram-board"),
		gridElement: document.getElementById("nonogram-grid"),
		rowCluesElement: document.getElementById("row-clues"),
		columnCluesElement: document.getElementById("column-clues"),
		editorActions: document.getElementById("editor-actions"),
		nameInput: document.getElementById("nonogram-name"),
		saveButton: document.getElementById("save-button"),
		saveError: document.getElementById("save-error"),
		saveStatus: document.getElementById("save-status"),
		previewCard: document.getElementById("preview-card"),
		previewImage: document.getElementById("nonogram-preview"),
		downloadButton: document.getElementById("download-button"),
		includeSolutionCheckbox: document.getElementById("include-solution"),
		remarkableFolderInput: document.getElementById("remarkable-folder"),
		sendButton: document.getElementById("send-button"),
		sendStatus: document.getElementById("send-status"),
		pairingSection: document.getElementById("pairing-section"),
		pairingCodeInput: document.getElementById("pairing-code"),
		pairingSubmit: document.getElementById("pairing-submit"),
		pairingError: document.getElementById("pairing-error"),
	};
}

function renderClues(elements, width, height, cells) {
	const { rowClues, columnClues } = computeClientNonogramClues(cells);

	elements.rowCluesElement.style.setProperty("--grid-rows", String(height));
	elements.rowCluesElement.innerHTML = "";
	for (const clues of rowClues) {
		const rowClueElement = document.createElement("div");
		rowClueElement.className = "row-clue";
		rowClueElement.textContent = clues.join(" ");
		elements.rowCluesElement.append(rowClueElement);
	}

	elements.columnCluesElement.style.setProperty(
		"--grid-columns",
		String(width),
	);
	elements.columnCluesElement.innerHTML = "";
	for (const clues of columnClues) {
		const columnClueElement = document.createElement("div");
		columnClueElement.className = "column-clue";
		columnClueElement.textContent = clues.join("\n");
		elements.columnCluesElement.append(columnClueElement);
	}
}

async function updatePreviewAndDownload(
	elements,
	downloadState,
	width,
	height,
	cells,
) {
	const nonogram = { width, height, cells };

	try {
		elements.errorElement.textContent = "";

		const previewResponse = await fetch("/api/nonograms/preview", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ nonogram }),
		});

		if (previewResponse.ok) {
			const svgMarkup = await previewResponse.text();
			elements.previewImage.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
			elements.previewImage.style.display = "block";
			elements.previewCard.style.display = "block";
		} else {
			const body = await previewResponse.json();
			elements.errorElement.textContent =
				body.error ?? "Could not refresh the preview";
		}

		const generateResponse = await fetch("/api/nonograms/generate", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				nonogram,
				includeSolution: elements.includeSolutionCheckbox.checked,
			}),
		});

		if (generateResponse.ok) {
			if (downloadState.objectUrl) {
				URL.revokeObjectURL(downloadState.objectUrl);
			}
			const pdfBlob = await generateResponse.blob();
			downloadState.objectUrl = URL.createObjectURL(pdfBlob);
			elements.downloadButton.style.display = "inline";
			elements.previewCard.style.display = "block";
		} else {
			const body = await generateResponse.json();
			elements.errorElement.textContent =
				body.error ?? "Could not generate the PDF";
		}
	} catch {
		elements.errorElement.textContent =
			"Could not reach the server to refresh the preview. Check your connection and try again.";
	}
}

function renderGrid(elements, grid, downloadState, width, height, cells) {
	grid.width = width;
	grid.height = height;
	grid.cells = cells;

	elements.gridElement.innerHTML = "";
	elements.gridElement.style.setProperty("--grid-columns", String(width));
	elements.gridElement.style.setProperty("--grid-rows", String(height));

	for (let row = 0; row < height; row++) {
		for (let column = 0; column < width; column++) {
			const cell = document.createElement("button");
			cell.type = "button";
			cell.className = "nonogram-cell";
			cell.classList.toggle("filled", cells[row][column]);
			cell.classList.toggle("thick-left", isThickGridlineIndex(column));
			cell.classList.toggle("thick-top", isThickGridlineIndex(row));
			cell.setAttribute("aria-label", `Row ${row + 1}, column ${column + 1}`);
			cell.setAttribute("aria-pressed", String(cells[row][column]));

			cell.addEventListener("click", () => {
				cells[row][column] = !cells[row][column];
				cell.classList.toggle("filled", cells[row][column]);
				cell.setAttribute("aria-pressed", String(cells[row][column]));
				renderClues(elements, width, height, cells);
				updatePreviewAndDownload(elements, downloadState, width, height, cells);
			});

			elements.gridElement.append(cell);
		}
	}

	renderClues(elements, width, height, cells);
	elements.boardElement.classList.add("visible");
	updatePreviewAndDownload(elements, downloadState, width, height, cells);
}

function showGrid(elements, grid, downloadState, name, nonogram) {
	elements.statusElement.textContent = name
		? `Editing "${name}" (${nonogram.width} × ${nonogram.height})`
		: `New nonogram (${nonogram.width} × ${nonogram.height})`;
	elements.sizeSection.style.display = "none";
	elements.nameInput.value = name ?? "";
	elements.editorActions.style.display = "flex";
	renderGrid(
		elements,
		grid,
		downloadState,
		nonogram.width,
		nonogram.height,
		nonogram.cells.map((row) => [...row]),
	);
}

async function handleSave(elements, grid, editorState) {
	elements.saveError.textContent = "";
	elements.saveStatus.textContent = "";

	const result = buildNonogramSaveRequest(
		editorState.currentId,
		elements.nameInput.value,
		{
			width: grid.width,
			height: grid.height,
			cells: grid.cells,
		},
	);

	if (!result.ok) {
		elements.saveError.textContent = result.error;
		return;
	}

	let response;
	try {
		response = await fetch(result.request.url, {
			method: result.request.method,
			headers: { "content-type": "application/json" },
			body: JSON.stringify(result.request.body),
		});
	} catch {
		elements.saveError.textContent =
			"Could not reach the server. Check your connection and try again.";
		return;
	}

	if (!response.ok) {
		const body = await response.json();
		elements.saveError.textContent =
			body.error ?? "Failed to save this nonogram";
		return;
	}

	const saved = await response.json();
	editorState.currentId = saved.id;
	elements.saveStatus.textContent = "Saved.";
}

async function sendToRemarkable(elements, editorState) {
	const result = buildNonogramSendRequest(
		editorState.currentId,
		elements.remarkableFolderInput.value,
		elements.includeSolutionCheckbox.checked,
	);

	if (!result.ok) {
		elements.sendStatus.textContent = result.error;
		return;
	}

	// biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API isn't supported everywhere and this static page has no build step for a polyfill
	document.cookie = buildRemarkableFolderCookieAssignment(
		elements.remarkableFolderInput.value,
	);

	elements.sendStatus.textContent = "Sending to reMarkable...";
	elements.pairingSection.style.display = "none";

	let response;
	try {
		response = await fetch(result.request.url, {
			method: result.request.method,
			headers: { "content-type": "application/json" },
			body: JSON.stringify(result.request.body),
		});
	} catch {
		elements.sendStatus.textContent =
			"Could not reach the server. Check your connection and try again.";
		return;
	}

	if (response.ok) {
		elements.sendStatus.textContent = "Nonogram sent to reMarkable.";
		return;
	}

	const body = await response.json();

	if (body.error === "not_authenticated") {
		elements.sendStatus.textContent = "";
		elements.pairingSection.style.display = "block";
		return;
	}

	elements.sendStatus.textContent =
		body.error ?? "Failed to send this nonogram";
}

async function loadExisting(elements, grid, downloadState, editorState) {
	let response;
	try {
		response = await fetch(`/api/nonograms/${editorState.currentId}`);
	} catch {
		elements.statusElement.textContent = "";
		elements.errorElement.textContent =
			"Could not reach the server. Check your connection and try again.";
		return;
	}

	if (!response.ok) {
		elements.statusElement.textContent = "";
		elements.errorElement.textContent = "This nonogram could not be found.";
		return;
	}

	const saved = await response.json();
	showGrid(elements, grid, downloadState, saved.name, saved.nonogram);
}

async function handleSizeSubmit(elements, grid, downloadState) {
	elements.sizeError.textContent = "";
	const width = Number(elements.widthInput.value);
	const height = Number(elements.heightInput.value);
	const cells = createEmptyCells(width, height);

	let response;
	try {
		response = await fetch("/api/nonograms/preview", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ nonogram: { width, height, cells } }),
		});
	} catch {
		elements.sizeError.textContent =
			"Could not reach the server. Check your connection and try again.";
		return;
	}

	if (!response.ok) {
		const body = await response.json();
		elements.sizeError.textContent = body.error ?? "Invalid grid size";
		return;
	}

	showGrid(elements, grid, downloadState, null, { width, height, cells });
}

function initEditor() {
	const elements = queryEditorElements();
	const params = new URLSearchParams(window.location.search);
	const editorState = { currentId: params.get("id") };
	const downloadState = { objectUrl: null };
	const grid = { width: 0, height: 0, cells: [] };

	elements.remarkableFolderInput.value = readRemarkableFolderCookie(
		document.cookie,
	);

	elements.includeSolutionCheckbox.addEventListener("change", () => {
		if (grid.cells.length > 0) {
			updatePreviewAndDownload(
				elements,
				downloadState,
				grid.width,
				grid.height,
				grid.cells,
			);
		}
	});

	elements.downloadButton.addEventListener("click", () => {
		if (!downloadState.objectUrl) {
			return;
		}
		const temporaryLink = document.createElement("a");
		temporaryLink.href = downloadState.objectUrl;
		temporaryLink.download = "nonogram.pdf";
		temporaryLink.click();
	});

	elements.saveButton.addEventListener("click", () =>
		handleSave(elements, grid, editorState),
	);

	elements.sendButton.addEventListener("click", () =>
		sendToRemarkable(elements, editorState),
	);

	elements.pairingSubmit.addEventListener("click", () =>
		submitPairingCode(elements.pairingCodeInput, elements.pairingError, () =>
			sendToRemarkable(elements, editorState),
		),
	);

	if (editorState.currentId) {
		elements.sizeSection.style.display = "none";
		loadExisting(elements, grid, downloadState, editorState);
	} else {
		elements.statusElement.textContent = "";
		elements.sizeSection.style.display = "block";
		elements.sizeSubmit.addEventListener("click", () =>
			handleSizeSubmit(elements, grid, downloadState),
		);
	}
}

initEditor();
