// Mirrors the "thicker gridline every 5 interior rows/columns" convention
// already used by the SVG preview and PDF renderers (packages/core) so the
// manual grid editor's live board matches the same visual layout while the
// user is drawing.
const THICK_GRIDLINE_INTERVAL = 5;

export function isThickGridlineIndex(index: number): boolean {
	return index > 0 && index % THICK_GRIDLINE_INTERVAL === 0;
}
