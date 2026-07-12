import {
	type Nonogram,
	type NonogramStore,
	parseNonogramImport,
} from "@remarkable-nonogram-generator/core";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

async function handleImportJson(
	store: NonogramStore,
	request: FastifyRequest,
	reply: FastifyReply,
) {
	let name: string;
	let nonogram: Nonogram;
	try {
		({ name, nonogram } = parseNonogramImport(request.body));
	} catch (error) {
		reply.code(400);
		return { error: (error as Error).message };
	}

	const saved = await store.save({ name, nonogram });
	reply.code(201);
	return saved;
}

export function registerNonogramImportJsonRoutes(
	app: FastifyInstance,
	store: NonogramStore,
): void {
	app.post("/api/nonograms/import-json", (request, reply) =>
		handleImportJson(store, request, reply),
	);
}
