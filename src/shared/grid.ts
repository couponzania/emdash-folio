// Pasted rows and columns: CSV, tabs from a spreadsheet, or semicolons, with quoted cells.
// Shared by the chart (rows by column name) and the table (cells in order).

/** Every non-empty line as its cells, in order. The separator is read from the first line. */
export function parseGrid(input: string): string[][] {
	const src = input.replace(/\r\n?/g, "\n");
	const header = src.split("\n").find((l) => l.trim() !== "") ?? "";
	const sep = header.includes("\t") ? "\t" : header.includes(";") && !header.includes(",") ? ";" : ",";
	const records: string[][] = [];
	let row: string[] = [];
	let cell = "";
	let quoted = false;
	for (let i = 0; i < src.length; i++) {
		const ch = src[i];
		if (quoted) {
			if (ch === '"' && src[i + 1] === '"') {
				cell += '"';
				i++;
			} else if (ch === '"') quoted = false;
			else cell += ch;
		} else if (ch === '"' && cell.trim() === "") {
			quoted = true;
			cell = "";
		} else if (ch === sep) {
			row.push(cell.trim());
			cell = "";
		} else if (ch === "\n") {
			row.push(cell.trim());
			records.push(row);
			row = [];
			cell = "";
		} else cell += ch;
	}
	row.push(cell.trim());
	records.push(row);
	return records.filter((r) => r.some((c) => c !== ""));
}
