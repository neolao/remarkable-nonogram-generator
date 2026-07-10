export interface ClientNonogramClues {
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

export function computeClientNonogramClues(
	cells: ReadonlyArray<ReadonlyArray<boolean>>,
): ClientNonogramClues {
	const width = cells[0]?.length ?? 0;
	const rowClues = cells.map((row) => computeLineClues(row));

	const columnClues = Array.from({ length: width }, (_, columnIndex) =>
		computeLineClues(cells.map((row) => row[columnIndex])),
	);

	return { rowClues, columnClues };
}
