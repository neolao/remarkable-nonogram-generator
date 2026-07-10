import type { Nonogram } from "./nonogram-grid.js";

export interface NonogramSummary {
	readonly id: string;
	readonly name: string;
	readonly width: number;
	readonly height: number;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface SavedNonogram {
	readonly id: string;
	readonly name: string;
	readonly nonogram: Nonogram;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface SaveNonogramInput {
	readonly id?: string;
	readonly name: string;
	readonly nonogram: Nonogram;
}

export interface NonogramStore {
	list(): Promise<NonogramSummary[]>;
	load(id: string): Promise<SavedNonogram | null>;
	save(input: SaveNonogramInput): Promise<SavedNonogram>;
	delete(id: string): Promise<void>;
}
