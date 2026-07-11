import {
	computeNonogramClues,
	type Nonogram,
} from "@remarkable-nonogram-generator/core";

export interface ClientNonogramClues {
	readonly rowClues: ReadonlyArray<ReadonlyArray<number>>;
	readonly columnClues: ReadonlyArray<ReadonlyArray<number>>;
}

export function computeClientNonogramClues(
	cells: ReadonlyArray<ReadonlyArray<boolean>>,
): ClientNonogramClues {
	const width = cells[0]?.length ?? 0;
	const nonogram: Nonogram = { width, height: cells.length, cells };

	return computeNonogramClues(nonogram);
}
