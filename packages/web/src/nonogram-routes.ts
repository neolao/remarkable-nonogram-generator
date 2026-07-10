import type { NonogramStore } from "@remarkable-nonogram-generator/core";
import type { FastifyInstance } from "fastify";

export function registerNonogramRoutes(
	app: FastifyInstance,
	store: NonogramStore,
): void {
	app.get("/api/nonograms", () => store.list());
}
