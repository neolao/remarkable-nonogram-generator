import type {
	Nonogram,
	NonogramStore,
	SupportedImageImportType,
} from "@remarkable-nonogram-generator/core";
import { importNonogramFromImage } from "@remarkable-nonogram-generator/core";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export type ImportNonogramFromImageFn = typeof importNonogramFromImage;

// Multipart fields are typed as MultipartFile | MultipartValue | (either)[];
// narrow down to a single field's string value, or undefined if absent.
function fieldValue(field: unknown): string | undefined {
	if (
		!field ||
		Array.isArray(field) ||
		(field as { type?: string }).type !== "field"
	) {
		return undefined;
	}
	return String((field as { value: unknown }).value);
}

async function handleImportImage(
	store: NonogramStore,
	importFn: ImportNonogramFromImageFn,
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const file = await request.file();
	if (!file) {
		reply.code(400);
		return { error: "An image file is required" };
	}

	const type = fieldValue(file.fields.type) ?? "";
	const width = Number(fieldValue(file.fields.width));
	const height = Number(fieldValue(file.fields.height));
	const imageBuffer = await file.toBuffer();

	let nonogram: Nonogram;
	try {
		nonogram = await importFn(
			type as SupportedImageImportType,
			new Uint8Array(imageBuffer),
			{ width, height },
		);
	} catch (error) {
		reply.code(400);
		return { error: (error as Error).message };
	}

	const saved = await store.save({ name: "", nonogram });
	reply.code(201);
	return saved;
}

export function registerNonogramImportRoutes(
	app: FastifyInstance,
	store: NonogramStore,
	importFn: ImportNonogramFromImageFn = importNonogramFromImage,
): void {
	app.post("/api/nonograms/import-image", (request, reply) =>
		handleImportImage(store, importFn, request, reply),
	);
}
