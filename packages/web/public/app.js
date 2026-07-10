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

initRemarkableConnection();
