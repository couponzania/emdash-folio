// The table block as the editor sees it: pasted rows, an optional column to highlight, a caption.
import type { PortableTextBlockConfig } from "emdash";

export const TABLE_TYPE = "folioTable";

export const tableBlock: PortableTextBlockConfig = {
	type: TABLE_TYPE,
	label: "Table",
	description: "A comparison table from pasted rows; one card per row on phones",
	category: "Folio",
	fields: [
		{
			type: "text_input",
			action_id: "data",
			label: "Rows",
			multiline: true,
			placeholder: "Paste from a spreadsheet, or type CSV. The first row names the columns; the first column names the rows.\nPlan,Starter,Business\nMonthly price,$9,$29",
		},
		{ type: "text_input", action_id: "pick", label: "Column to highlight as our pick (optional)", placeholder: "Business" },
		{ type: "text_input", action_id: "caption", label: "Caption (optional)", placeholder: "Prices checked November 2026." },
	],
};
