import { submitPairingCode } from "./remarkable-pairing.js";

function initNonogramList() {
	const listElement = document.getElementById("nonogram-list");
	const emptyElement = document.getElementById("nonogram-list-empty");
	const errorElement = document.getElementById("nonogram-list-error");

	const handleDelete = async (id, item) => {
		errorElement.textContent = "";

		let response;
		try {
			response = await fetch(`/api/nonograms/${id}`, { method: "DELETE" });
		} catch {
			errorElement.textContent =
				"Could not reach the server. Check your connection and try again.";
			return;
		}

		if (!response.ok) {
			errorElement.textContent = "Failed to delete this nonogram";
			return;
		}

		item.remove();
		if (listElement.children.length === 0) {
			emptyElement.style.display = "block";
		}
	};

	const renderItem = (nonogram) => {
		const item = document.createElement("li");
		item.className = "nonogram-item";

		const link = document.createElement("a");
		link.className = "nonogram-link";
		link.href = `./editor.html?id=${encodeURIComponent(nonogram.id)}`;

		const thumbnail = document.createElement("img");
		thumbnail.className = "nonogram-thumbnail";
		thumbnail.alt = "";
		thumbnail.src = `/api/nonograms/${encodeURIComponent(nonogram.id)}/preview`;

		const name = document.createElement("span");
		name.className = "nonogram-name";
		name.textContent = nonogram.name;

		const size = document.createElement("span");
		size.className = "nonogram-size";
		size.textContent = `${nonogram.width} × ${nonogram.height}`;

		link.append(thumbnail, name, size);

		const exportLink = document.createElement("a");
		exportLink.className = "button nonogram-export";
		exportLink.textContent = "Export";
		exportLink.href = `/api/nonograms/${encodeURIComponent(nonogram.id)}/export`;
		exportLink.download = "";

		const deleteButton = document.createElement("button");
		deleteButton.className = "button button-danger nonogram-delete";
		deleteButton.type = "button";
		deleteButton.textContent = "Delete";
		deleteButton.addEventListener("click", () =>
			handleDelete(nonogram.id, item),
		);

		const actions = document.createElement("div");
		actions.className = "nonogram-item-actions";
		actions.append(exportLink, deleteButton);

		item.append(link, actions);
		return item;
	};

	const loadList = async () => {
		errorElement.textContent = "";

		let response;
		try {
			response = await fetch("/api/nonograms");
		} catch {
			errorElement.textContent =
				"Could not reach the server. Check your connection and try again.";
			return;
		}

		if (!response.ok) {
			errorElement.textContent = "Failed to load saved nonograms";
			return;
		}

		const nonograms = await response.json();
		listElement.innerHTML = "";

		if (nonograms.length === 0) {
			emptyElement.style.display = "block";
			return;
		}

		emptyElement.style.display = "none";
		for (const nonogram of nonograms) {
			listElement.append(renderItem(nonogram));
		}
	};

	loadList();
}

function initRemarkableConnection() {
	const statusElement = document.getElementById("remarkable-status");
	const pairingSection = document.getElementById("pairing-section");
	const pairingCodeInput = document.getElementById("pairing-code");
	const pairingSubmit = document.getElementById("pairing-submit");
	const pairingError = document.getElementById("pairing-error");

	const showConnected = () => {
		statusElement.textContent = "Connected to reMarkable.";
		statusElement.dataset.connected = "true";
		pairingSection.style.display = "none";
	};

	const showDisconnected = () => {
		statusElement.textContent = "";
		statusElement.dataset.connected = "false";
		pairingSection.style.display = "block";
	};

	const refreshStatus = async () => {
		let response;
		try {
			response = await fetch("/api/remarkable/status");
		} catch {
			statusElement.textContent =
				"Could not reach the server. Check your connection and try again.";
			return;
		}

		const body = await response.json();

		if (body.authenticated) {
			showConnected();
		} else {
			showDisconnected();
		}
	};

	pairingSubmit.addEventListener("click", () =>
		submitPairingCode(pairingCodeInput, pairingError, showConnected),
	);

	refreshStatus();
}

initNonogramList();
initRemarkableConnection();
