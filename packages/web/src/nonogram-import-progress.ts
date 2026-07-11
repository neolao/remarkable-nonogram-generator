export interface ImportProgressToggle {
	submitButton: { disabled: boolean };
	progressElement: { hidden: boolean };
}

export function setImportInProgress(
	toggle: ImportProgressToggle,
	inProgress: boolean,
): void {
	toggle.submitButton.disabled = inProgress;
	toggle.progressElement.hidden = !inProgress;
}
