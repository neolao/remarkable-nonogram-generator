import {
	type RemarkableApi,
	type RemarkableOptions,
	ResponseError,
	register,
	remarkable,
} from "rmapi-js";
import { withTimeout } from "./network-timeout.js";
import type { CredentialStore } from "./remarkable-credential-store.js";

export type RemarkableSession = RemarkableApi;

export type RemarkableAuthOptions = RemarkableOptions;

export interface RemarkableClient {
	register: typeof register;
	remarkable: typeof remarkable;
}

const defaultClient: RemarkableClient = { register, remarkable };

const PAIRING_INSTRUCTIONS_URL =
	"https://my.remarkable.com/device/browser/connect";

const REMARKABLE_CLOUD_TIMEOUT_MS = 30_000;

export async function authenticate(
	store: CredentialStore,
	pairingCode: string,
	options: RemarkableAuthOptions = {},
	client: RemarkableClient = defaultClient,
): Promise<RemarkableSession> {
	const existing = await store.load();
	let deviceToken: string;

	if (existing) {
		deviceToken = existing.deviceToken;
	} else {
		try {
			deviceToken = await withTimeout(
				client.register(pairingCode, { authHost: options.authHost }),
				REMARKABLE_CLOUD_TIMEOUT_MS,
				"Timed out while pairing with reMarkable Cloud",
			);
		} catch (cause) {
			if (
				cause instanceof ResponseError &&
				(cause.status === 400 || cause.status === 401)
			) {
				throw new Error(
					`Invalid or expired pairing code. Get a new one at ${PAIRING_INSTRUCTIONS_URL} and try again.`,
					{ cause },
				);
			}
			throw new Error(
				"Failed to reach reMarkable Cloud while pairing the device",
				{ cause },
			);
		}
		await store.save({ deviceToken });
	}

	try {
		return await withTimeout(
			client.remarkable(deviceToken, options),
			REMARKABLE_CLOUD_TIMEOUT_MS,
			"Timed out while authenticating with reMarkable Cloud",
		);
	} catch (cause) {
		throw new Error("Failed to authenticate with reMarkable Cloud", { cause });
	}
}
