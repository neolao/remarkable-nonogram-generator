import {
	authenticate,
	type CredentialStore,
} from "@remarkable-nonogram-generator/core";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

interface PairRequestBody {
	pairingCode?: string;
}

async function handleGetStatus(store: CredentialStore) {
	const credentials = await store.load();
	return { authenticated: credentials !== null };
}

async function handlePair(
	store: CredentialStore,
	request: FastifyRequest<{ Body: PairRequestBody }>,
	reply: FastifyReply,
) {
	const pairingCode = request.body?.pairingCode?.trim();

	if (!pairingCode) {
		reply.code(400);
		return { error: "A pairing code is required" };
	}

	try {
		await authenticate(store, pairingCode);
	} catch (error) {
		reply.code(400);
		return { error: (error as Error).message };
	}

	return { authenticated: true };
}

export function registerRemarkableRoutes(
	app: FastifyInstance,
	store: CredentialStore,
): void {
	app.get("/api/remarkable/status", () => handleGetStatus(store));
	app.post<{ Body: PairRequestBody }>(
		"/api/remarkable/pair",
		(request, reply) => handlePair(store, request, reply),
	);
}
