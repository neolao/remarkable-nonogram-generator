import type {
	Nonogram,
	NonogramStore,
} from "@remarkable-nonogram-generator/core";
import { importNonogramFromUrl } from "@remarkable-nonogram-generator/core";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export type ImportNonogramFromUrlFn = typeof importNonogramFromUrl;

interface ImportUrlRequestBody {
	url?: string;
}

async function handleImportUrl(
	store: NonogramStore,
	importFn: ImportNonogramFromUrlFn,
	request: FastifyRequest<{ Body: ImportUrlRequestBody }>,
	reply: FastifyReply,
) {
	const url = request.body?.url;
	if (!url) {
		reply.code(400);
		return { error: "A puzzle url is required" };
	}

	let nonogram: Nonogram;
	try {
		nonogram = await importFn(url);
	} catch (error) {
		reply.code(400);
		return { error: (error as Error).message };
	}

	const saved = await store.save({ name: "", nonogram });
	reply.code(201);
	return saved;
}

export function registerNonogramImportUrlRoutes(
	app: FastifyInstance,
	store: NonogramStore,
	importFn: ImportNonogramFromUrlFn = importNonogramFromUrl,
): void {
	app.post<{ Body: ImportUrlRequestBody }>(
		"/api/nonograms/import-url",
		(request, reply) => handleImportUrl(store, importFn, request, reply),
	);
}
