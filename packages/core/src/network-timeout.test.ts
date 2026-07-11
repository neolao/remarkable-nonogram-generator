import { afterEach, describe, expect, it, vi } from "vitest";
import { withTimeout } from "./network-timeout.js";

afterEach(() => {
	vi.useRealTimers();
});

describe("withTimeout", () => {
	it("resolves with the wrapped promise's value when it settles before the timeout", async () => {
		await expect(
			withTimeout(Promise.resolve("done"), 1000, "timed out"),
		).resolves.toBe("done");
	});

	it("rejects with the wrapped promise's own reason when it rejects before the timeout", async () => {
		await expect(
			withTimeout(Promise.reject(new Error("boom")), 1000, "timed out"),
		).rejects.toThrow("boom");
	});

	it("rejects with a timeout error when the wrapped promise takes longer than the timeout", async () => {
		vi.useFakeTimers();
		const neverSettles = new Promise<string>(() => {});

		const result = withTimeout(neverSettles, 1000, "timed out");
		const assertion = expect(result).rejects.toThrow("timed out");
		await vi.advanceTimersByTimeAsync(1000);
		await assertion;
	});
});
