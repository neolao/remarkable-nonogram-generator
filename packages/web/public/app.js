function initNonogramList() {
	const listElement = document.getElementById("nonogram-list");
	const emptyElement = document.getElementById("nonogram-list-empty");
	const errorElement = document.getElementById("nonogram-list-error");

	const handleDelete = async (id, item) => {
		errorElement.textContent = "";
		const response = await fetch(`/api/nonograms/${id}`, { method: "DELETE" });

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

		const name = document.createElement("span");
		name.className = "nonogram-name";
		name.textContent = nonogram.name;

		const size = document.createElement("span");
		size.className = "nonogram-size";
		size.textContent = `${nonogram.width} × ${nonogram.height}`;

		link.append(name, size);

		const deleteButton = document.createElement("button");
		deleteButton.className = "button button-danger nonogram-delete";
		deleteButton.type = "button";
		deleteButton.textContent = "Delete";
		deleteButton.addEventListener("click", () =>
			handleDelete(nonogram.id, item),
		);

		item.append(link, deleteButton);
		return item;
	};

	const loadList = async () => {
		errorElement.textContent = "";
		const response = await fetch("/api/nonograms");

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
		const response = await fetch("/api/remarkable/status");
		const body = await response.json();

		if (body.authenticated) {
			showConnected();
		} else {
			showDisconnected();
		}
	};

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
		showConnected();
	});

	refreshStatus();
}

initNonogramList();
initRemarkableConnection();
