import path from "node:path";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import { CORE_VERSION } from "@remarkable-nonogram-generator/core";
import Fastify from "fastify";
import { registerNonogramRoutes } from "./nonogram-routes.js";
import {
	createFileNonogramStore,
	DEFAULT_NONOGRAMS_DIR,
} from "./nonogram-store.js";
import {
	createFileCredentialStore,
	DEFAULT_CREDENTIALS_PATH,
} from "./remarkable-credential-store.js";
import { registerRemarkableRoutes } from "./remarkable-routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_PORT = 4279;

export function resolvePort(
	env: Record<string, string | undefined> = process.env,
): number {
	const raw = env.PORT;
	if (raw === undefined) {
		return DEFAULT_PORT;
	}

	const parsed = Number(raw);
	if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
		throw new Error(`Invalid PORT environment variable: "${raw}"`);
	}

	return parsed;
}

export interface BuildServerOptions {
	credentialsPath?: string;
	nonogramsPath?: string;
}

export function buildServer(options: BuildServerOptions = {}) {
	const app = Fastify({ logger: true });
	const credentialStore = createFileCredentialStore(
		options.credentialsPath ?? DEFAULT_CREDENTIALS_PATH,
	);
	const nonogramStore = createFileNonogramStore(
		options.nonogramsPath ?? DEFAULT_NONOGRAMS_DIR,
	);

	app.register(fastifyStatic, {
		root: path.join(__dirname, "../public"),
	});

	app.get("/api/version", async () => ({ core: CORE_VERSION }));
	registerRemarkableRoutes(app, credentialStore, nonogramStore);
	registerNonogramRoutes(app, nonogramStore);

	return app;
}

if (process.env.NODE_ENV !== "test") {
	const app = buildServer();
	app.listen({ port: resolvePort(), host: "0.0.0.0" });
}
