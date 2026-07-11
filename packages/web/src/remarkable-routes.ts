import {
	authenticate,
	type CredentialStore,
	type NonogramStore,
	sendNonogramToRemarkable,
} from "@remarkable-nonogram-generator/core";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

interface PairRequestBody {
	pairingCode?: string;
}

interface SendNonogramRequestBody {
	folder?: string;
	includeSolution?: boolean;
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

async function handleSendNonogram(
	credentialStore: CredentialStore,
	nonogramStore: NonogramStore,
	request: FastifyRequest<{
		Params: { id: string };
		Body: SendNonogramRequestBody;
	}>,
	reply: FastifyReply,
) {
	const result = await sendNonogramToRemarkable(
		nonogramStore,
		credentialStore,
		request.params.id,
		{
			folder: request.body?.folder,
			includeSolution: request.body?.includeSolution,
		},
	);

	switch (result.outcome) {
		case "not_found":
			reply.code(404);
			return { error: "Nonogram not found" };
		case "not_authenticated":
			reply.code(409);
			return { error: "not_authenticated" };
		case "auth_failed":
		case "upload_failed":
			reply.code(502);
			return { error: result.message };
		case "sent":
			return { visibleName: result.visibleName };
	}
}

export function registerRemarkableRoutes(
	app: FastifyInstance,
	credentialStore: CredentialStore,
	nonogramStore: NonogramStore,
): void {
	app.get("/api/remarkable/status", () => handleGetStatus(credentialStore));
	app.post<{ Body: PairRequestBody }>(
		"/api/remarkable/pair",
		(request, reply) => handlePair(credentialStore, request, reply),
	);
	app.post<{ Params: { id: string }; Body: SendNonogramRequestBody }>(
		"/api/nonograms/:id/send",
		(request, reply) =>
			handleSendNonogram(credentialStore, nonogramStore, request, reply),
	);
}
