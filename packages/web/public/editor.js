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

	const params = new URLSearchParams(window.location.search);
	const id = params.get("id");

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

	const renderGrid = (width, height, cells) => {
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
				});

				gridElement.append(cell);
			}
		}

		renderClues(width, height, cells);
		boardElement.classList.add("visible");
	};

	const showGrid = (name, nonogram) => {
		statusElement.textContent = name
			? `Editing "${name}" (${nonogram.width} × ${nonogram.height})`
			: `New nonogram (${nonogram.width} × ${nonogram.height})`;
		sizeSection.style.display = "none";
		renderGrid(
			nonogram.width,
			nonogram.height,
			nonogram.cells.map((row) => [...row]),
		);
	};

	const loadExisting = async () => {
		const response = await fetch(`/api/nonograms/${id}`);

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

	if (id) {
		sizeSection.style.display = "none";
		loadExisting();
	} else {
		statusElement.textContent = "";
		sizeSection.style.display = "block";
		sizeSubmit.addEventListener("click", handleSizeSubmit);
	}
}

initEditor();
