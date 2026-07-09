import type { Nonogram } from "./nonogram-grid.js";

export interface NonogramClues {
	readonly rowClues: ReadonlyArray<ReadonlyArray<number>>;
	readonly columnClues: ReadonlyArray<ReadonlyArray<number>>;
}

function computeLineClues(line: ReadonlyArray<boolean>): number[] {
	const clues: number[] = [];
	let currentRunLength = 0;

	for (const cell of line) {
		if (cell) {
			currentRunLength += 1;
			continue;
		}
		if (currentRunLength > 0) {
			clues.push(currentRunLength);
			currentRunLength = 0;
		}
	}
	if (currentRunLength > 0) {
		clues.push(currentRunLength);
	}

	return clues.length > 0 ? clues : [0];
}

export function computeNonogramClues(nonogram: Nonogram): NonogramClues {
	const rowClues = nonogram.cells.map((row) => computeLineClues(row));

	const columnClues = Array.from({ length: nonogram.width }, (_, columnIndex) =>
		computeLineClues(nonogram.cells.map((row) => row[columnIndex])),
	);

	return { rowClues, columnClues };
}
