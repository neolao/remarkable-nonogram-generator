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

// For each cell, determines whether it is filled/empty in every placement of
// `blocks` on a line of `length` consistent with the currently `known`
// cells, by enumerating those placements. Undetermined cells stay null.
function solveLine(
	length: number,
	clue: ReadonlyArray<number>,
	known: ReadonlyArray<CellState>,
	lineKind: "row" | "column",
	lineIndex: number,
): CellState[] {
	const blocks = clue.length === 1 && clue[0] === 0 ? [] : [...clue];
	const placements = enumerateLinePlacements(length, blocks, known);

	if (placements.length === 0) {
		throw new Error(
			`${lineKind === "row" ? "Row" : "Column"} ${lineIndex} clue is impossible to satisfy for a line of length ${length}`,
		);
	}

	const result: CellState[] = new Array(length).fill(null);
	for (let i = 0; i < length; i++) {
		const allFilled = placements.every((placement) => placement[i]);
		const allEmpty = placements.every((placement) => !placement[i]);
		if (allFilled) result[i] = true;
		else if (allEmpty) result[i] = false;
	}
	return result;
}

function enumerateLinePlacements(
	length: number,
	blocks: ReadonlyArray<number>,
	known: ReadonlyArray<CellState>,
): boolean[][] {
	const results: boolean[][] = [];
	const current: boolean[] = new Array(length).fill(false);

	function place(blockIndex: number, position: number): void {
		if (blockIndex === blocks.length) {
			for (let i = position; i < length; i++) {
				if (known[i] === true) return;
			}
			results.push(current.slice());
			return;
		}

		const blockSize = blocks[blockIndex];
		const minSpaceAfter = blocks
			.slice(blockIndex + 1)
			.reduce((sum, size) => sum + size + 1, 0);

		for (
			let start = position;
			start + blockSize + minSpaceAfter <= length;
			start++
		) {
			let consistent = true;
			for (let i = position; i < start; i++) {
				if (known[i] === true) {
					consistent = false;
					break;
				}
				current[i] = false;
			}
			if (!consistent) continue;

			for (let i = start; i < start + blockSize; i++) {
				if (known[i] === false) {
					consistent = false;
					break;
				}
				current[i] = true;
			}
			if (!consistent) continue;

			const afterBlock = start + blockSize;
			const hasNextBlock = blockIndex + 1 < blocks.length;
			if (hasNextBlock) {
				// The single cell right after this block is a mandatory gap;
				// it can't be part of the next block, so a known-filled cell
				// there makes this placement invalid.
				if (known[afterBlock] === true) continue;
				current[afterBlock] = false;
				place(blockIndex + 1, afterBlock + 1);
			} else {
				place(blockIndex + 1, afterBlock);
			}
		}
	}

	place(0, 0);
	return results;
}
