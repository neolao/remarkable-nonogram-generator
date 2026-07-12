import type { NonogramClues } from "../domain/nonogram-clues.js";

export interface ClueCell {
	readonly index: number;
	readonly slot: number;
	readonly text: string;
}

export interface RawNonogramPageData {
	readonly width: number;
	readonly height: number;
	readonly rowClueCells: ReadonlyArray<ClueCell>;
	readonly columnClueCells: ReadonlyArray<ClueCell>;
}

export interface PageRenderer {
	renderNonogramPage(url: string): Promise<RawNonogramPageData>;
}

const NONOGRAMS_ORG_PUZZLE_URL_PATTERN =
	/^https:\/\/www\.nonograms\.org\/nonograms2?\/i\/\d+$/;

const PAGE_LOAD_TIMEOUT_MS = 30_000;

export async function extractCluesFromPage(
	url: string,
	renderer: PageRenderer = createPuppeteerPageRenderer(),
): Promise<{ width: number; height: number; clues: NonogramClues }> {
	if (!NONOGRAMS_ORG_PUZZLE_URL_PATTERN.test(url)) {
		throw new Error(`This is not a nonograms.org puzzle URL: ${url}`);
	}

	const data = await renderer.renderNonogramPage(url);

	return {
		width: data.width,
		height: data.height,
		clues: {
			rowClues: groupCluesByLine(data.rowClueCells, data.height),
			columnClues: groupCluesByLine(data.columnClueCells, data.width),
		},
	};
}

function groupCluesByLine(
	cells: ReadonlyArray<ClueCell>,
	lineCount: number,
): number[][] {
	const byIndex = new Map<number, ClueCell[]>();
	for (const cell of cells) {
		const list = byIndex.get(cell.index) ?? [];
		list.push(cell);
		byIndex.set(cell.index, list);
	}

	return Array.from({ length: lineCount }, (_, i) => {
		const lineCells = byIndex.get(i);
		if (!lineCells || lineCells.length === 0) return [0];
		return lineCells
			.slice()
			.sort((a, b) => a.slot - b.slot)
			.map((cell) => Number(cell.text));
	});
}

export function createPuppeteerPageRenderer(): PageRenderer {
	return {
		async renderNonogramPage(url: string): Promise<RawNonogramPageData> {
			const { default: puppeteer } = await import("puppeteer");
			const browser = await puppeteer.launch({
				headless: true,
				args: ["--no-sandbox"],
			});

			try {
				const page = await browser.newPage();
				await page.setUserAgent(
					"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
				);

				let response: Awaited<ReturnType<typeof page.goto>>;
				try {
					response = await page.goto(url, {
						waitUntil: "networkidle2",
						timeout: PAGE_LOAD_TIMEOUT_MS,
					});
				} catch (cause) {
					throw new Error(`Could not reach the puzzle page: ${url}`, {
						cause,
					});
				}
				if (!response?.ok()) {
					throw new Error(`Puzzle page not found or unreachable: ${url}`);
				}

				const hasGrid = await page.evaluate(
					() => !!document.getElementById("nonogram_table"),
				);
				if (!hasGrid) {
					throw new Error(`Could not find the puzzle grid on the page: ${url}`);
				}

				const size = await page.evaluate(() => {
					const match = document.body.textContent?.match(
						/Size:\s*(\d+)\s*x\s*(\d+)/i,
					);
					return match
						? { width: Number(match[1]), height: Number(match[2]) }
						: null;
				});
				if (!size) {
					throw new Error(
						`Could not read the puzzle's grid size from the page: ${url}`,
					);
				}

				// No inner function definitions (not even an arrow assigned to a
				// const) - esbuild's __name()-injection for named/assigned
				// functions leaks into the serialized page.evaluate() callback,
				// referencing a helper that doesn't exist in that isolated
				// browser context. Each prefix's collection loop is duplicated
				// inline instead.
				const clueCells = await page.evaluate(() => {
					const rowClueCells: { index: number; slot: number; text: string }[] =
						[];
					// Unlike nmv{col}_{slot}, this site's row-clue ids are
					// nmh{slot}_{row} - slot first, row second (confirmed by
					// inspecting real ids; an inconsistent convention on the
					// site's own part, not a typo here).
					for (const cell of document.querySelectorAll(
						'#nonogram_table td[id^="nmh"]',
					)) {
						const match = cell.id.match(/^nmh(\d+)_(\d+)$/);
						if (!match) continue;
						rowClueCells.push({
							slot: Number(match[1]),
							index: Number(match[2]),
							text: (cell.textContent ?? "").trim(),
						});
					}

					const columnClueCells: {
						index: number;
						slot: number;
						text: string;
					}[] = [];
					for (const cell of document.querySelectorAll(
						'#nonogram_table td[id^="nmv"]',
					)) {
						const match = cell.id.match(/^nmv(\d+)_(\d+)$/);
						if (!match) continue;
						columnClueCells.push({
							index: Number(match[1]),
							slot: Number(match[2]),
							text: (cell.textContent ?? "").trim(),
						});
					}

					return { rowClueCells, columnClueCells };
				});

				return { ...size, ...clueCells };
			} finally {
				await browser.close();
			}
		},
	};
}
