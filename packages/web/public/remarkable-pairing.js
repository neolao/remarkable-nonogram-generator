export async function submitPairingCode(
	pairingCodeInput,
	pairingError,
	onSuccess,
) {
	pairingError.textContent = "";
	const pairingCode = pairingCodeInput.value.trim();

	if (!pairingCode) {
		pairingError.textContent = "Pairing code is required";
		return;
	}

	let response;
	try {
		response = await fetch("/api/remarkable/pair", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ pairingCode }),
		});
	} catch {
		pairingError.textContent =
			"Could not reach the server. Check your connection and try again.";
		return;
	}

	if (!response.ok) {
		const body = await response.json();
		pairingError.textContent = body.error ?? "Pairing failed";
		return;
	}

	pairingCodeInput.value = "";
	pairingError.textContent = "";
	await onSuccess();
}
