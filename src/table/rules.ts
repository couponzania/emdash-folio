// The table block's rules: the pasted grid checked for shape. The first row is the header, the
// first column names each row. At most 5 columns (4 is the house limit; 5 only for short cells)
// and 50 rows, so a table never needs sideways scrolling.
import { parseGrid } from "../shared/grid.ts";
import { text } from "../shared/fields.ts";

export const MAX_TABLE_COLUMNS = 5;
export const MAX_TABLE_ROWS = 50;

export interface TableModel {
	ok: true;
	head: string[];
	rows: Array<{ name: string; cells: string[] }>;
	/** Index into head of the highlighted column, or -1. Never the first column. */
	pick: number;
	caption: string;
}

export function tableModel(node: Record<string, unknown>): TableModel | { ok: false; reason: string } {
	const grid = parseGrid(text(node.data));
	if (grid.length < 2) return { ok: false, reason: "it needs a header row and at least one row" };
	const width = grid[0].length;
	if (width < 2) return { ok: false, reason: "it needs at least 2 columns" };
	if (width > MAX_TABLE_COLUMNS) return { ok: false, reason: `it has ${width} columns; the most is ${MAX_TABLE_COLUMNS}` };
	if (grid.length - 1 > MAX_TABLE_ROWS) return { ok: false, reason: `it has ${grid.length - 1} rows; the most is ${MAX_TABLE_ROWS}` };
	const head = grid[0];
	const rows = grid.slice(1).map((r) => ({ name: r[0] ?? "", cells: head.slice(1).map((_, i) => r[i + 1] ?? "") }));
	const wanted = text(node.pick).toLowerCase();
	const pick = wanted === "" ? -1 : head.findIndex((h, i) => i > 0 && h.toLowerCase() === wanted);
	return { ok: true, head, rows, pick, caption: text(node.caption) };
}
