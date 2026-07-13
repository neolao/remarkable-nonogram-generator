import type { NonogramClues } from "./nonogram-clues.js";
import { createNonogram, type Nonogram } from "./nonogram-grid.js";

type CellState = boolean | null;

export function solveNonogramFromClues(
	width: number,
	height: number,
	clues: NonogramClues,
): Nonogram {
	if (
		!Number.isInteger(width) ||
		!Number.isInteger(height) ||
		width <= 0 ||
		height <= 0
	) {
		throw new Error(
			`Nonogram width and height must be positive integers, got width=${width}, height=${height}`,
		);
	}

	if (clues.rowClues.length !== height) {
		throw new Error(
			`Row clues must have exactly ${height} entries, got ${clues.rowClues.length}`,
		);
	}
	if (clues.columnClues.length !== width) {
		throw new Error(
			`Column clues must have exactly ${width} entries, got ${clues.columnClues.length}`,
		);
	}

	const grid: CellState[][] = Array.from({ length: height }, () =>
		new Array<CellState>(width).fill(null),
	);

	// Impossible-per-line clues (e.g. a clue too long for the declared width)
	// are a malformed-input error, not a "needs guessing" situation, so this
	// initial propagation is allowed to throw straight out of the function.
	propagateToFixpoint(width, height, clues, grid);

	if (!hasUndeterminedCell(grid)) {
		return createNonogram(width, height, grid as boolean[][]);
	}

	// Pure per-line propagation stalled with cells still undetermined. Some
	// puzzles are only solvable by hypothesizing a cell's state and rejecting
	// the hypothesis if it leads to a line with no valid placement
	// (contradiction) — this is still "solving by logic alone" (not guessing
	// at random), so each surviving deduction is sound. It deliberately stops
	// at this single level rather than a full recursive backtracking search:
	// each round tests every still-undetermined cell once (bounded work), and
	// stops once a round makes no further progress, rather than branching
	// exponentially over combinations of cells — a puzzle that only yields to
	// deeper multi-cell backtracking is reported as "requires guessing", same
	// as a genuinely ambiguous one, instead of risking runaway search cost.
	solveByProbing(width, height, clues, grid);

	if (hasUndeterminedCell(grid)) {
		throw new Error(
			"Could not fully solve this puzzle from its clues alone (it requires guessing)",
		);
	}

	return createNonogram(width, height, grid as boolean[][]);
}

function hasUndeterminedCell(grid: ReadonlyArray<CellState[]>): boolean {
	return grid.some((row) => row.some((cell) => cell === null));
}

// Mutates `grid` in place, propagating row/column deductions until no line
// yields any new information. Throws if a line's clue can't be satisfied at
// all given the cells already fixed.
function propagateToFixpoint(
	width: number,
	height: number,
	clues: NonogramClues,
	grid: CellState[][],
): void {
	let changed = true;
	while (changed) {
		changed = false;

		for (let row = 0; row < height; row++) {
			const known = grid[row];
			const solved = solveLine(width, clues.rowClues[row], known, "row", row);
			if (applyLine(known, solved)) changed = true;
		}

		for (let col = 0; col < width; col++) {
			const known = grid.map((row) => row[col]);
			const solved = solveLine(
				height,
				clues.columnClues[col],
				known,
				"column",
				col,
			);
			if (applyLine(known, solved)) {
				changed = true;
				for (let row = 0; row < height; row++) {
					grid[row][col] = known[row];
				}
			}
		}
	}
}

// Repeatedly scans every still-undetermined cell and tests each of its two
// states by cloning the grid, setting the cell, and propagating: a state that
// leads to a line with no valid placement is a contradiction, so the cell
// must be the other state. Deductions found in a round are committed and
// propagated together before the next round starts. Stops once a round finds
// no new deduction — remaining nulls at that point mean the puzzle needs
// genuine multi-cell backtracking (or is ambiguous), which this function
// deliberately does not attempt. Bounded to at most `width * height` rounds,
// each doing at most `width * height` probes, since a round that determines
// no cell stops the loop and there are only that many cells left to resolve.
function solveByProbing(
	width: number,
	height: number,
	clues: NonogramClues,
	grid: CellState[][],
): void {
	let madeProgress = true;
	while (madeProgress && hasUndeterminedCell(grid)) {
		madeProgress = false;

		for (let row = 0; row < height; row++) {
			for (let col = 0; col < width; col++) {
				if (grid[row][col] !== null) continue;

				const canBeFilled = isConsistentGuess(
					width,
					height,
					clues,
					grid,
					row,
					col,
					true,
				);
				const canBeEmpty = isConsistentGuess(
					width,
					height,
					clues,
					grid,
					row,
					col,
					false,
				);

				if (canBeFilled && !canBeEmpty) {
					grid[row][col] = true;
					madeProgress = true;
				} else if (canBeEmpty && !canBeFilled) {
					grid[row][col] = false;
					madeProgress = true;
				} else if (!canBeFilled && !canBeEmpty) {
					// Neither state can produce a valid line: the puzzle as a
					// whole is unsolvable given these clues.
					throw new Error(
						"Could not fully solve this puzzle from its clues alone (it requires guessing)",
					);
				}
			}
		}

		if (madeProgress) propagateToFixpoint(width, height, clues, grid);
	}
}

function isConsistentGuess(
	width: number,
	height: number,
	clues: NonogramClues,
	grid: ReadonlyArray<CellState[]>,
	row: number,
	col: number,
	value: boolean,
): boolean {
	const branch = grid.map((line) => line.slice());
	branch[row][col] = value;
	try {
		propagateToFixpoint(width, height, clues, branch);
		return true;
	} catch {
		return false;
	}
}

// Merges newly-deduced cells into `known` in place; returns whether anything changed.
function applyLine(known: CellState[], solved: CellState[]): boolean {
	let changed = false;
	for (let i = 0; i < known.length; i++) {
		if (known[i] === null && solved[i] !== null) {
			known[i] = solved[i];
			changed = true;
		}
	}
	return changed;
}

// For each cell, determines whether it is filled/empty in every valid
// placement of `blocks` on a line of `length` consistent with the currently
// `known` cells — without ever enumerating those placements. The block set
// is pushed as far left as it will go, then as far right as it will go; a
// cell that lands in the same block (by position, tracked via `markRunIds`)
// in both extremes must hold that state in every placement in between, since
// there's no room for it to be anything else. Runs in time proportional to
// line length x number of blocks, whereas the placement count this replaces
// can reach into the hundreds of millions for a single line on a real,
// densely-clued 45x45 puzzle (nonograms.org #80350), exhausting the Node.js
// heap before hypothesis-testing is even reached.
function solveLine(
	length: number,
	clue: ReadonlyArray<number>,
	known: ReadonlyArray<CellState>,
	lineKind: "row" | "column",
	lineIndex: number,
): CellState[] {
	const blocks = clue.length === 1 && clue[0] === 0 ? [] : [...clue];

	if (blocks.length === 0) {
		if (known.some((cell) => cell === true)) {
			throw impossibleLineError(length, lineKind, lineIndex);
		}
		return new Array(length).fill(false);
	}

	const line = known.map(toPushCell);
	const leftmost = pushLeft(line, blocks);
	if (!leftmost) {
		throw impossibleLineError(length, lineKind, lineIndex);
	}
	// The reversed line/blocks describe the exact same set of valid
	// placements read backwards, so this cannot fail now that `leftmost` did.
	const rightmost = pushLeft([...line].reverse(), [...blocks].reverse());
	rightmost.reverse();

	markRunIds(leftmost);
	markRunIds(rightmost);

	return leftmost.map((value, i) =>
		value === rightmost[i] ? value % 2 === 1 : known[i],
	);
}

function impossibleLineError(
	length: number,
	lineKind: "row" | "column",
	lineIndex: number,
): Error {
	return new Error(
		`${lineKind === "row" ? "Row" : "Column"} ${lineIndex} clue is impossible to satisfy for a line of length ${length}`,
	);
}

// -1 = known-empty, 0 = unknown, 1 = known-filled: the encoding `pushLeft`
// operates on internally (distinct from `CellState` at this module's edges).
function toPushCell(cell: CellState): number {
	return cell === true ? 1 : cell === false ? -1 : 0;
}

// Finds the leftmost-fitting placement of `blocks` on `line` consistent with
// already-known cells (-1/1), or null if none exists. `shouldSkipPosition`
// prunes positions that can't matter (no known-filled cell forces trying
// them) as a speed optimization; it never prunes the only valid position.
function pushLeft(
	line: ReadonlyArray<number>,
	blocks: ReadonlyArray<number>,
): number[] | null {
	if (blocks.length === 0) {
		return line.includes(1) ? null : line.slice();
	}

	const blockSize = blocks[0];
	let maxIndex = line.indexOf(1);
	if (maxIndex === -1) maxIndex = line.length - blockSize;

	for (let i = 0; i <= maxIndex; i++) {
		if (shouldSkipPosition(line, blockSize, i)) continue;

		const rest = pushLeft(line.slice(i + blockSize + 1), blocks.slice(1));
		if (!rest) continue;

		const placed = line.slice();
		for (let x = i; x < i + blockSize; x++) placed[x] = 1;
		for (let x = 0; x < rest.length; x++)
			placed[x + i + blockSize + 1] = rest[x];
		return placed;
	}
	return null;
}

function shouldSkipPosition(
	line: ReadonlyArray<number>,
	blockSize: number,
	i: number,
): boolean {
	let noKnownFilledCellForcesThisSpot = line[i - 1] === 0;
	let collidesWithKnownState = line[i + blockSize] === 1;
	for (let x = i; x < i + blockSize; x++) {
		if (line[x] === -1 || x >= line.length) {
			collidesWithKnownState = true;
			break;
		}
		if (line[x]) noKnownFilledCellForcesThisSpot = false;
	}
	return noKnownFilledCellForcesThisSpot || collidesWithKnownState;
}

// Mutates a fully-determined 0/1 line in place, replacing each cell with an
// id that increments every time a run of filled cells starts or ends — two
// cells share an id only if they belong to the same contiguous block-run.
function markRunIds(line: number[]): void {
	let runId = line[0] % 2;
	for (let i = 0; i < line.length; i++) {
		if (line[i] === -1) line[i] = 0;
		if (line[i] % 2 !== runId % 2) runId++;
		line[i] = runId;
	}
}
