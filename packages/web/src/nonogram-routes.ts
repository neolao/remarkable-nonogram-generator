import {
	createNonogram,
	type Nonogram,
	type NonogramStore,
	renderNonogramToPdf,
	renderNonogramToSvg,
} from "@remarkable-nonogram-generator/core";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

interface SaveNonogramRequestBody {
	name?: string;
	nonogram?: Nonogram;
}

interface PreviewNonogramRequestBody {
	nonogram?: Nonogram;
}

interface GenerateNonogramRequestBody {
	nonogram?: Nonogram;
	includeSolution?: boolean;
}

function validateNonogram(nonogram: Nonogram | undefined): Nonogram {
	if (!nonogram) {
		throw new Error("A nonogram grid is required");
	}
	return createNonogram(nonogram.width, nonogram.height, nonogram.cells);
}

async function handleCreate(
	store: NonogramStore,
	request: FastifyRequest<{ Body: SaveNonogramRequestBody }>,
	reply: FastifyReply,
) {
	let nonogram: Nonogram;
	try {
		nonogram = validateNonogram(request.body?.nonogram);
	} catch (error) {
		reply.code(400);
		return { error: (error as Error).message };
	}

	const saved = await store.save({
		name: request.body?.name ?? "",
		nonogram,
	});
	reply.code(201);
	return saved;
}

async function handlePreview(
	request: FastifyRequest<{ Body: PreviewNonogramRequestBody }>,
	reply: FastifyReply,
) {
	let nonogram: Nonogram;
	try {
		nonogram = validateNonogram(request.body?.nonogram);
	} catch (error) {
		reply.code(400);
		return { error: (error as Error).message };
	}

	reply.type("image/svg+xml");
	return renderNonogramToSvg(nonogram);
}

async function handleGenerate(
	request: FastifyRequest<{ Body: GenerateNonogramRequestBody }>,
	reply: FastifyReply,
) {
	let nonogram: Nonogram;
	try {
		nonogram = validateNonogram(request.body?.nonogram);
	} catch (error) {
		reply.code(400);
		return { error: (error as Error).message };
	}

	const pdfBytes = await renderNonogramToPdf(nonogram, {
		includeSolution: request.body?.includeSolution,
	});
	reply.type("application/pdf");
	return Buffer.from(pdfBytes);
}

async function handleGet(
	store: NonogramStore,
	request: FastifyRequest<{ Params: { id: string } }>,
	reply: FastifyReply,
) {
	const saved = await store.load(request.params.id);
	if (!saved) {
		reply.code(404);
		return { error: "Nonogram not found" };
	}
	return saved;
}

async function handleUpdate(
	store: NonogramStore,
	request: FastifyRequest<{
		Params: { id: string };
		Body: SaveNonogramRequestBody;
	}>,
	reply: FastifyReply,
) {
	const existing = await store.load(request.params.id);
	if (!existing) {
		reply.code(404);
		return { error: "Nonogram not found" };
	}

	let nonogram: Nonogram;
	try {
		nonogram = validateNonogram(request.body?.nonogram);
	} catch (error) {
		reply.code(400);
		return { error: (error as Error).message };
	}

	return store.save({
		id: request.params.id,
		name: request.body?.name ?? existing.name,
		nonogram,
	});
}

async function handleDelete(
	store: NonogramStore,
	request: FastifyRequest<{ Params: { id: string } }>,
	reply: FastifyReply,
) {
	const existing = await store.load(request.params.id);
	if (!existing) {
		reply.code(404);
		return { error: "Nonogram not found" };
	}

	await store.delete(request.params.id);
	reply.code(204);
}

export function registerNonogramRoutes(
	app: FastifyInstance,
	store: NonogramStore,
): void {
	app.get("/api/nonograms", () => store.list());
	app.post<{ Body: SaveNonogramRequestBody }>(
		"/api/nonograms",
		(request, reply) => handleCreate(store, request, reply),
	);
	app.post<{ Body: PreviewNonogramRequestBody }>(
		"/api/nonograms/preview",
		(request, reply) => handlePreview(request, reply),
	);
	app.post<{ Body: GenerateNonogramRequestBody }>(
		"/api/nonograms/generate",
		(request, reply) => handleGenerate(request, reply),
	);
	app.get<{ Params: { id: string } }>("/api/nonograms/:id", (request, reply) =>
		handleGet(store, request, reply),
	);
	app.put<{ Params: { id: string }; Body: SaveNonogramRequestBody }>(
		"/api/nonograms/:id",
		(request, reply) => handleUpdate(store, request, reply),
	);
	app.delete<{ Params: { id: string } }>(
		"/api/nonograms/:id",
		(request, reply) => handleDelete(store, request, reply),
	);
}
