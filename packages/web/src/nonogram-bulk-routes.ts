import {
	createNonogramArchive,
	type NonogramStore,
	parseNonogramArchive,
} from "@remarkable-nonogram-generator/core";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

async function handleExportAll(store: NonogramStore, reply: FastifyReply) {
	const summaries = await store.list();
	const entries = await Promise.all(
		summaries.map(async (summary) => {
			const saved = await store.load(summary.id);
			// store.list() and store.load() read the same on-disk source of
			// truth; a summary can only go missing between the two calls if a
			// nonogram is deleted mid-export, in which case it's simply omitted.
			return saved ? { name: saved.name, nonogram: saved.nonogram } : null;
		}),
	);

	const archive = createNonogramArchive(
		entries.filter((entry) => entry !== null),
	);

	reply.type("application/zip");
	reply.header("content-disposition", 'attachment; filename="nonograms.zip"');
	return Buffer.from(archive);
}

async function handleImportZip(
	store: NonogramStore,
	request: FastifyRequest,
	reply: FastifyReply,
) {
	let results: ReturnType<typeof parseNonogramArchive>;
	try {
		results = parseNonogramArchive(request.body as Buffer);
	} catch (error) {
		reply.code(400);
		return { error: (error as Error).message };
	}

	const created = [];
	const errors: { fileName: string; error: string }[] = [];
	for (const result of results) {
		if (result.ok) {
			created.push(
				await store.save({ name: result.name, nonogram: result.nonogram }),
			);
		} else {
			errors.push({ fileName: result.fileName, error: result.error });
		}
	}

	reply.code(201);
	return { created, errors };
}

export function registerNonogramBulkRoutes(
	app: FastifyInstance,
	store: NonogramStore,
): void {
	app.get("/api/nonograms/export-all", (_request, reply) =>
		handleExportAll(store, reply),
	);
	app.post("/api/nonograms/import-zip", (request, reply) =>
		handleImportZip(store, request, reply),
	);
}
