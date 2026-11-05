// The review snapshot block as the editor sees it. The fields' action_ids are the keys
// snapshotData() reads. It goes right after a review's intro; its fields also make the
// page's Review markup.
import type { PortableTextBlockConfig } from "emdash";

export const SNAPSHOT_TYPE = "folioSnapshot";

export const snapshotBlock: PortableTextBlockConfig = {
	type: SNAPSHOT_TYPE,
	label: "Review snapshot",
	description: "A review's verdict card: score, key stats, score rows and who should skip it. Also makes the Review markup",
	category: "Folio",
	fields: [
		{ type: "text_input", action_id: "itemName", label: "What is reviewed", placeholder: "ScalaHosting" },
		{
			type: "select",
			action_id: "itemType",
			label: "It is a",
			options: [
				{ label: "Store, brand or company", value: "Organization" },
				{ label: "Product", value: "Product" },
				{ label: "Software or app", value: "SoftwareApplication" },
			],
		},
		{
			type: "text_input",
			action_id: "verdict",
			label: "Verdict",
			multiline: true,
			placeholder: "One sentence that names it: ScalaHosting is the best VPS host for…",
		},
		{ type: "text_input", action_id: "score", label: "Overall score out of 10 (blank: average of the rows)", placeholder: "8.7" },
		{
			type: "repeater",
			action_id: "stats",
			label: "Key stats (3 or 4)",
			item_label: "Stat",
			fields: [
				{ type: "text_input", action_id: "value", label: "Value", placeholder: "$44.95" },
				{ type: "text_input", action_id: "label", label: "What it is", placeholder: "per month" },
			],
		},
		{
			type: "repeater",
			action_id: "scores",
			label: "Score rows (2 to 4, at least one honest lower score)",
			item_label: "Score",
			fields: [
				{ type: "text_input", action_id: "label", label: "Criterion", placeholder: "Value for money" },
				{ type: "text_input", action_id: "score", label: "Score out of 10", placeholder: "9.7" },
			],
		},
		{ type: "text_input", action_id: "skip", label: "Skip it if", multiline: true, placeholder: "A real, specific reason from the review" },
		{ type: "text_input", action_id: "checked", label: "Checked (month and year)", placeholder: "November 2026" },
		{ type: "text_input", action_id: "note", label: "Note beside the date (optional)", placeholder: "30 day money back" },
		{ type: "text_input", action_id: "ctaLabel", label: "Main button text (optional)", placeholder: "Check Current Price" },
		{ type: "text_input", action_id: "ctaLink", label: "Main button link", placeholder: "https://example.com/plans" },
		{ type: "text_input", action_id: "moreLabel", label: "Second link text (optional)", placeholder: "See all plans" },
		{ type: "text_input", action_id: "moreLink", label: "Second link", placeholder: "#pricing" },
	],
};
