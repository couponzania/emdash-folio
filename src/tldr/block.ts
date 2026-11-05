// The TL;DR block as the editor sees it: a title and the points, one per line.
import type { PortableTextBlockConfig } from "emdash";

export const TLDR_TYPE = "folioTldr";

export const tldrBlock: PortableTextBlockConfig = {
	type: TLDR_TYPE,
	label: "TL;DR",
	description: "The short version of the article: 3 to 5 points near the top",
	category: "Folio",
	fields: [
		{ type: "text_input", action_id: "title", label: "Title (optional)", placeholder: "The short version" },
		{
			type: "text_input",
			action_id: "points",
			label: "Points, one per line (3 to 5)",
			multiline: true,
			placeholder: "Lenovo runs its biggest discounts in late November.\nStudent pricing stacks with most sale prices.",
		},
	],
};
