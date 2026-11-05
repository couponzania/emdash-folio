// The chart block as the editor sees it: pick a chart, paste the data, name the columns.
// The fields' action_ids are the keys chartSpec() reads.
import type { PortableTextBlockConfig } from "emdash";

export const CHART_TYPE = "folioChart";

export const chartBlock: PortableTextBlockConfig = {
	type: CHART_TYPE,
	label: "Chart",
	description: "A bar, line, donut, column, stacked, area or comparison chart from pasted data, drawn on the server with its data table",
	category: "Folio",
	fields: [
		{
			type: "select",
			action_id: "kind",
			label: "Chart",
			options: [
				{ label: "Bars: compare or rank amounts", value: "bar" },
				{ label: "Line: change over time", value: "line" },
				{ label: "Donut: parts of one whole (up to 6)", value: "donut" },
				{ label: "Columns: a few periods side by side (up to 12)", value: "column" },
				{ label: "Stacked bars: parts of a whole across groups (needs a series column)", value: "stacked" },
				{ label: "Area: a total over time (a series column stacks up to 4)", value: "area" },
				{ label: "Comparison: before and after per row (a series column with exactly 2 values)", value: "compare" },
			],
		},
		{ type: "text_input", action_id: "title", label: "Title", placeholder: "Amazon Prime members worldwide, 2020 to 2025" },
		{
			type: "text_input",
			action_id: "description",
			label: "What it shows (required)",
			multiline: true,
			placeholder: "One sentence with the finding: Prime members grew from 150 million in 2020 to 250 million in 2025.",
		},
		{
			type: "text_input",
			action_id: "data",
			label: "Data",
			multiline: true,
			placeholder: "Paste from a spreadsheet, or type CSV. The first row names the columns.\nYear,Members\n2020,150\n2025,250",
		},
		{ type: "text_input", action_id: "x", label: "Column for the labels (bars, slices) or along the bottom (line)", placeholder: "Year" },
		{ type: "text_input", action_id: "y", label: "Column of values", placeholder: "Members" },
		{ type: "text_input", action_id: "series", label: "Column that splits rows into series (optional)", placeholder: "Market" },
		{
			type: "select",
			action_id: "stackMode",
			label: "Stacked bars show (stacked bars only)",
			options: [
				{ label: "Totals: longer bars for bigger totals", value: "total" },
				{ label: "Shares: every bar as 100%", value: "share" },
			],
		},
		{ type: "text_input", action_id: "yUnit", label: "Unit (optional)", placeholder: "%, $, ₹, million" },
		{ type: "text_input", action_id: "caption", label: "Note under the chart (optional)", multiline: true, placeholder: "Figures for each calendar year; 2025 is an estimate." },
		{ type: "text_input", action_id: "sourceName", label: "Source", placeholder: "Amazon annual report 2025" },
		{ type: "text_input", action_id: "sourceLink", label: "Source link (optional)", placeholder: "https://…" },
	],
};
