import { describe, expect, it } from "vitest";
import { setImportInProgress } from "./nonogram-import-progress.js";

describe("setImportInProgress", () => {
	it("disables the submit button and shows the progress indicator when starting", () => {
		const toggle = {
			submitButton: { disabled: false },
			progressElement: { hidden: true },
		};

		setImportInProgress(toggle, true);

		expect(toggle.submitButton.disabled).toBe(true);
		expect(toggle.progressElement.hidden).toBe(false);
	});

	it("re-enables the submit button and hides the progress indicator when finishing", () => {
		const toggle = {
			submitButton: { disabled: true },
			progressElement: { hidden: false },
		};

		setImportInProgress(toggle, false);

		expect(toggle.submitButton.disabled).toBe(false);
		expect(toggle.progressElement.hidden).toBe(true);
	});

	it("stays consistent across repeated calls with the same value", () => {
		const toggle = {
			submitButton: { disabled: false },
			progressElement: { hidden: true },
		};

		setImportInProgress(toggle, true);
		setImportInProgress(toggle, true);

		expect(toggle.submitButton.disabled).toBe(true);
		expect(toggle.progressElement.hidden).toBe(false);
	});
});
