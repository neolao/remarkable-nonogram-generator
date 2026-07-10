import {
	authenticate,
	type CredentialStore,
	type NonogramStore,
	renderNonogramToPdf,
	uploadPdf,
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
	const saved = await nonogramStore.load(request.params.id);
	if (!saved) {
		reply.code(404);
		return { error: "Nonogram not found" };
	}

	const existing = await credentialStore.load();
	if (!existing) {
		reply.code(409);
		return { error: "not_authenticated" };
	}

	let session: Awaited<ReturnType<typeof authenticate>>;
	try {
		session = await authenticate(credentialStore, "");
	} catch (error) {
		reply.code(502);
		return { error: (error as Error).message };
	}

	const pdfBytes = await renderNonogramToPdf(saved.nonogram, {
		includeSolution: request.body?.includeSolution,
	});
	const visibleName = saved.name;
	const folder = request.body?.folder;

	try {
		await uploadPdf(session, `${visibleName}.pdf`, visibleName, {
			readFile: async () => pdfBytes,
			folder,
		});
	} catch (error) {
		reply.code(502);
		return { error: (error as Error).message };
	}

	return { visibleName };
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
